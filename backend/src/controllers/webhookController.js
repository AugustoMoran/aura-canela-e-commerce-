const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { sendOrderConfirmationToUser } = require('../utils/sendNotifications');

const mercadopagoWebhook = async (req, res, next) => {
  try {
    console.log('🔔 Webhook recibido:', { type: req.body?.type, data: req.body?.data?.id });

    // Validate signature if secret is set
    if (process.env.MP_WEBHOOK_SECRET) {
      const signature = req.headers['x-signature'] || '';
      const xRequestId = req.headers['x-request-id'] || '';
      const manifest = `id:${req.query['data.id']};request-id:${xRequestId};ts:${req.query.ts};`;
      const hmac = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(manifest).digest('hex');
      if (hmac !== signature.split('=')[1]) {
        console.error('❌ Firma inválida en webhook');
        return res.status(401).json({ message: 'Firma inválida.' });
      }
    }

    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data?.id;
      if (!paymentId) {
        console.log('⚠️  Sin paymentId, ignorando webhook');
        return res.sendStatus(200);
      }

      console.log(`📊 Procesando pago ID: ${paymentId}`);

      // Fetch payment from MP API
      const MercadoPagoConfig = require('mercadopago').default;
      const { Payment } = require('mercadopago');
      
      if (!process.env.MP_ACCESS_TOKEN) {
        console.error('❌ MP_ACCESS_TOKEN no configurado');
        return res.sendStatus(500);
      }
      
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
      const payment = new Payment(client);
      
      let paymentData;
      try {
        paymentData = await payment.get({ id: paymentId });
      } catch (error) {
        console.error('❌ Error obteniendo datos de pago desde MP:', error.message);
        return res.sendStatus(500);
      }

      const externalRef = paymentData.external_reference;
      const status = paymentData.status; // approved, pending, rejected

      console.log(`🔍 Pago ${paymentId}: status=${status}, externalRef=${externalRef}`);

      const statusMap = { approved: 'aprobado', pending: 'pendiente', rejected: 'rechazado' };
      const estadoPago = statusMap[status] || 'pendiente';

      const order = await Order.findById(externalRef);
      if (!order) {
        console.error(`❌ Orden no encontrada: ${externalRef}`);
        return res.sendStatus(200);
      }

      console.log(`📦 Orden encontrada: ${order.codigo}`);

      order.estadoPago = estadoPago;
      order.mpPaymentId = paymentId;
      if (estadoPago === 'aprobado') {
        console.log(`✅ Pago aprobado para orden ${order.codigo}`);
        order.metodoPago = 'mercadopago';
        // When payment approved, ensure envio is 'pendiente' for admin to dispatch
        if (!order.estadoEnvio || order.estadoEnvio === 'pendiente') {
          order.estadoEnvio = 'pendiente';
        }
        // Clear the user's cart in DB
        if (order.usuario) {
          await Cart.findOneAndUpdate({ usuario: order.usuario }, { items: [] });
          console.log(`🛒 Carrito limpiado para usuario ${order.usuario}`);
        }
      }
      await order.save();
      console.log(`💾 Orden actualizada: ${order.codigo}`);

      // Send confirmation email when payment is approved
      if (estadoPago === 'aprobado') {
        let emailRecipient = null;
        if (order.usuario) {
          // For logged-in users, fetch their email
          const User = require('../models/User');
          const user = await User.findById(order.usuario);
          emailRecipient = user?.email;
        } else {
          // For guests, use stored email
          emailRecipient = order.guestData?.email;
        }

        console.log(`📧 Enviando email a: ${emailRecipient}`);

        if (emailRecipient) {
          sendOrderConfirmationToUser(emailRecipient, order)
            .then(() => console.log(`✅ Email MP enviado a ${emailRecipient}`))
            .catch(err => console.error(`❌ Error enviando email MP a ${emailRecipient}:`, err.message));
        } else {
          console.error(`❌ Sin emailRecipient para orden ${order.codigo}`);
        }
      }

      // IMPORTANT: Stock is deducted ONLY when admin finalizes the order via finalizeOrder endpoint,
      // NOT when payment is approved. This allows admin control over the dispatch process.
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook error:', error.message, error.stack);
    res.sendStatus(200); // Always return 200 to MP
  }
};

module.exports = { mercadopagoWebhook };
