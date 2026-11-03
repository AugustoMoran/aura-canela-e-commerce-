const Order = require('../models/Order');
const Product = require('../models/Product');
const Pack = require('../models/Pack');
const Coupon = require('../models/Coupon');
const generateOrderCode = require('../utils/generateOrderCode');
const { variantStock, findVariant, usesVariants } = require('../utils/productStock');
const {
  sendOrderConfirmationToUser,
  sendOrderNotificationToAdmin,
  sendShippingCodeEmail,
  sendOrderCancelledEmail,
} = require('../utils/sendNotifications');

const PEDIDO_ESTADOS = ['Recibido', 'En preparación', 'Enviado', 'Entregado', 'Cancelado'];

const normalizePedidoEstado = (estado) => {
  const map = {
    'Pedido recibido': 'Recibido',
    Preparado: 'En preparación',
    'Listo para despachar': 'En preparación',
    Despachado: 'Enviado',
  };
  return map[estado] || estado || 'Recibido';
};

const syncEnvioFromPedido = (estadoPedido) => {
  const map = {
    Recibido: 'pendiente',
    'En preparación': 'preparando',
    Enviado: 'enviado',
    Entregado: 'entregado',
    Cancelado: 'cancelado',
  };
  return map[estadoPedido] || 'pendiente';
};

const orderEmail = (order) => order.usuario?.email || order.guestData?.email;

const createOrder = async ({ userId, guestData, items, cuponCodigo, metodoPago, shipping }) => {
  // Validate and build items
  let subtotal = 0;
  const orderItems = [];

  const packPriceCache = {};

  for (const item of items) {
    const product = await Product.findOne({ _id: item.producto, isActive: true });
    if (!product) throw Object.assign(new Error(`Producto no encontrado: ${item.producto}`), { statusCode: 404 });

    const available = variantStock(product, item.talla, item.color);
    if (available < item.cantidad) {
      throw Object.assign(
        new Error(`Stock insuficiente para: ${product.nombre}${item.talla || item.color ? ` (${[item.talla, item.color].filter(Boolean).join(' · ')})` : ''} (disponible: ${available})`),
        { statusCode: 400 }
      );
    }

    // Validar talla solo si el producto tiene tallas habilitadas
    if (product.tallas?.habilitadas?.length > 0 && item.talla) {
      if (!product.tallas.habilitadas.includes(item.talla)) {
        throw Object.assign(new Error(`Talla no disponible: ${item.talla}`), { statusCode: 400 });
      }
    }
    
    // Validar color solo si el producto tiene colores
    if (product.colores?.length > 0 && item.color) {
      const colorDisponible = product.colores.find(c => c.nombre === item.color || c.codigo === item.color);
      if (!colorDisponible || !colorDisponible.habilitado) {
        throw Object.assign(new Error(`Color no disponible: ${item.color}`), { statusCode: 400 });
      }
    }

    let precio = product.precioOferta || product.precio;
    if (item.packId) {
      if (!packPriceCache[item.packId]) {
        const pack = await Pack.findById(item.packId);
        if (!pack || pack.activo === false) {
          throw Object.assign(new Error('El pack seleccionado no está disponible.'), { statusCode: 400 });
        }
        packPriceCache[item.packId] = pack.precio / pack.cantidadUnidades;
      }
      precio = packPriceCache[item.packId];
    }

    orderItems.push({
      producto: product._id,
      nombre: product.nombre,
      precio,
      cantidad: item.cantidad,
      imagen: product.imagenes[0]?.url || '',
      talla: item.talla,
      color: item.color,
    });
    subtotal += precio * item.cantidad;
  }

  // Handle coupon
  let descuento = 0;
  if (cuponCodigo) {
    const coupon = await Coupon.findOne({ codigo: cuponCodigo.toUpperCase() });
    if (!coupon || !coupon.isValid()) {
      throw Object.assign(new Error('Cupón inválido o vencido.'), { statusCode: 400 });
    }
    if (subtotal < coupon.minimoCompra) {
      throw Object.assign(new Error(`Mínimo de compra: $${coupon.minimoCompra}`), { statusCode: 400 });
    }
    descuento = coupon.tipo === 'porcentaje'
      ? subtotal * (coupon.valor / 100)
      : coupon.valor;
    coupon.usosActuales += 1;
    await coupon.save();
  }

  if (!shipping || !shipping.tipo) {
    throw Object.assign(new Error('Elegí cómo recibir el pedido (envío, retiro o WhatsApp).'), { statusCode: 400 });
  }

  const shippingCost = Math.max(0, Number(shipping.costo) || 0);
  const total = Math.max(0, subtotal - descuento) + shippingCost;

  // Generate unique code
  let codigo;
  let attempts = 0;
  do {
    codigo = generateOrderCode();
    attempts++;
    if (attempts > 20) throw new Error('No se pudo generar código de orden único.');
  } while (await Order.findOne({ codigo }));

  const order = await Order.create({
    codigo,
    usuario: userId || null,
    guestData: userId ? undefined : guestData,
    items: orderItems,
    subtotal,
    descuento,
    total,
    cupon: cuponCodigo ? cuponCodigo.toUpperCase() : null,
    metodoPago: metodoPago || 'pendiente',
    estadoPago: 'pendiente',
    estadoPedido: 'Recibido',
    historialEstadoPedido: [
      {
        fecha: new Date(),
        estado: 'Recibido',
        usuario: userId ? 'Cliente' : 'Invitado',
      }
    ],
    estadoEnvio: 'pendiente',
    stockDeducido: false,
    datosEnvio: {
      tipo: shipping.tipo,
      proveedor: shipping.tipo === 'correo' ? 'correoargentino' : shipping.tipo,
      servicio: shipping.servicio || '',
      servicioCode: shipping.servicioCode || '',
      costo: shippingCost,
      codigoPostal: shipping.codigoPostal || '',
      direccion: shipping.direccion || guestData?.direccion || '',
      localidad: shipping.localidad || '',
      provincia: shipping.provincia || '',
    },
  });

  // Notificación automática al admin
  const { createNotification } = require('./notificationService');
  createNotification({
    tipo: 'pedido',
    titulo: 'Nuevo Pedido Recibido',
    descripcion: `Se ha recibido el pedido ${order.codigo} por $${total}`,
    entidadRelacionada: 'Order',
    entidadId: order._id,
  }).catch(err => console.error('Error enviando notificación de pedido:', err));

  // Stock is NOT deducted here.
  // MercadoPago: deducted in the webhook when payment is approved.
  // WhatsApp: deducted in finalizeOrder when the admin dispatches.

  let emailRecipient = guestData?.email || null;
  if (userId) {
    const User = require('../models/User');
    const user = await User.findById(userId);
    emailRecipient = user?.email;
    order.usuario = user;
  }

  if (emailRecipient) {
    sendOrderConfirmationToUser(emailRecipient, order).catch((err) =>
      console.error(`Error enviando email a ${emailRecipient}:`, err.message)
    );
  }
  sendOrderNotificationToAdmin(order).catch((err) =>
    console.error('Error enviando email admin:', err.message)
  );

  return order;
};

const getOrders = async ({ page = 1, limit = 20, estado, userId }) => {
  const query = {};
  if (estado) query.estadoEnvio = estado;
  if (userId) query.usuario = userId;

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('usuario', 'nombre apellido email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { orders, page: Number(page), pages: Math.ceil(total / limit), total };
};

const getOrderById = async (id) => {
  const order = await Order.findById(id).populate('usuario', 'nombre apellido email');
  if (!order) throw Object.assign(new Error('Orden no encontrada.'), { statusCode: 404 });
  return order;
};

const getOrderByCode = async (codigo, email) => {
  if (!codigo || !email) {
    throw Object.assign(new Error('Ingresá el código de pedido y el email.'), { statusCode: 400 });
  }
  const order = await Order.findOne({ codigo: String(codigo).toUpperCase() }).populate('usuario', 'nombre apellido email');
  if (!order) throw Object.assign(new Error('No encontramos un pedido con esos datos.'), { statusCode: 404 });

  const orderEmailValue = (order.usuario?.email || order.guestData?.email || '').trim().toLowerCase();
  if (orderEmailValue !== String(email).trim().toLowerCase()) {
    throw Object.assign(new Error('No encontramos un pedido con esos datos.'), { statusCode: 404 });
  }

  // If order is pending with MP payment, check current status in MP
  if (order.estadoPago === 'pendiente' && order.metodoPago === 'mercadopago' && order.mpPaymentId) {
    try {
      const MercadoPagoConfig = require('mercadopago').default;
      const { Payment } = require('mercadopago');
      
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
      const payment = new Payment(client);
      
      const paymentData = await payment.get({ id: order.mpPaymentId });
      
      if (paymentData.status === 'approved' && order.estadoPago !== 'aprobado') {
        console.log(`✅ Actualizando orden ${order.codigo} a aprobado (verificado desde MP)`);
        order.estadoPago = 'aprobado';
        await order.save();
      }
    } catch (error) {
      console.warn(`⚠️  No se pudo verificar estado en MP: ${error.message}`);
    }
  }

  return order;
};

const updateOrderStatus = async (id, { estadoPago, estadoEnvio, estadoPedido, trackingNumber, notasAdmin, usuarioNombre = 'Administrador' }) => {
  const order = await Order.findById(id).populate('usuario', 'nombre apellido email');
  if (!order) throw Object.assign(new Error('Orden no encontrada.'), { statusCode: 404 });

  const { createNotification } = require('./notificationService');

  if (estadoPago && order.estadoPago !== estadoPago) {
    order.estadoPago = estadoPago;
    createNotification({
      tipo: 'pago',
      titulo: `Pago ${estadoPago}`,
      descripcion: `El pago del pedido ${order.codigo} ha pasado a estado ${estadoPago}`,
      entidadRelacionada: 'Order',
      entidadId: order._id,
    }).catch(err => console.error(err));
  }

  if (estadoEnvio && order.estadoEnvio !== estadoEnvio) {
    order.estadoEnvio = estadoEnvio;
  }

    if (estadoPedido && order.estadoPedido !== estadoPedido) {
    const nextEstado = normalizePedidoEstado(estadoPedido);
    order.estadoPedido = nextEstado;
    order.historialEstadoPedido.push({
      fecha: new Date(),
      estado: nextEstado,
      usuario: usuarioNombre,
    });

    order.estadoEnvio = syncEnvioFromPedido(nextEstado);

    if (nextEstado === 'Cancelado' && order.estadoPago === 'pendiente') {
      order.estadoPago = 'rechazado';
    }

    const email = orderEmail(order);
    if (nextEstado === 'Enviado' && email) {
      sendShippingCodeEmail(email, order).catch((err) => console.error(err.message));
    }
    if (nextEstado === 'Cancelado' && email) {
      sendOrderCancelledEmail(email, order).catch((err) => console.error(err.message));
    }

    createNotification({
      tipo: 'pedido',
      titulo: `Pedido ${estadoPedido}`,
      descripcion: `El pedido ${order.codigo} cambió su estado a: ${estadoPedido}`,
      entidadRelacionada: 'Order',
      entidadId: order._id,
    }).catch(err => console.error(err));
  }

  if (trackingNumber !== undefined) {
    order.datosEnvio = order.datosEnvio || {};
    order.datosEnvio.trackingNumber = trackingNumber;
  }

  if (notasAdmin !== undefined) {
    order.notasAdmin = notasAdmin;
  }

  await order.save();
  return order;
};

const dispatchOrder = async (codigo) => {
  const order = await Order.findOne({ codigo: codigo.toUpperCase() }).populate('usuario', 'nombre apellido email');
  if (!order) throw Object.assign(new Error('Código de orden inválido.'), { statusCode: 404 });
  if (order.estadoEnvio === 'enviado' || order.estadoEnvio === 'entregado') {
    throw Object.assign(new Error('Esta orden ya fue despachada.'), { statusCode: 400 });
  }

  order.estadoEnvio = 'enviado';
  order.estadoPedido = 'Enviado';
  order.historialEstadoPedido.push({
    fecha: new Date(),
    estado: 'Enviado',
    usuario: 'Administrador',
  });
  order.codigoUsado = true;
  await order.save();

  // Send shipping email
  const email = order.usuario?.email || order.guestData?.email;
  if (email) {
    sendShippingCodeEmail(email, order).catch(console.error);
  }

  return order;
};

const finalizeOrder = async (id, force = false) => {
  const order = await Order.findById(id);
  if (!order) throw Object.assign(new Error('Orden no encontrada.'), { statusCode: 404 });
  if (order.stockDeducido) throw Object.assign(new Error('El stock de este pedido ya fue descontado.'), { statusCode: 400 });

  // Si es rechazado o cancelado: marcar como finalizado SIN deducir stock
  if (order.estadoPago === 'rechazado' || order.estadoPago === 'cancelado') {
    order.stockDeducido = true;
    await order.save();
    const populated = await Order.findById(order._id).populate('usuario', 'nombre apellido email');
    return { order: populated, agotados: [], mensaje: `Pedido ${order.estadoPago} finalizado sin deducción de stock.` };
  }

  if (order.estadoPago !== 'aprobado') {
    throw Object.assign(new Error('El pedido debe tener pago aprobado, rechazado o cancelado para descontar stock.'), { statusCode: 400 });
  }

  for (const item of order.items) {
    const product = await Product.findById(item.producto);
    if (!product) continue;
    const available = variantStock(product, item.talla, item.color);
    if (!force && available < item.cantidad) {
      const err = Object.assign(
        new Error(`Stock insuficiente para: ${item.nombre} (disponible: ${available}, pedido: ${item.cantidad})`),
        { statusCode: 400, code: 'STOCK_INSUFICIENTE' }
      );
      throw err;
    }

    if (usesVariants(product)) {
      const variant = findVariant(product, item.talla, item.color);
      if (variant) {
        variant.stock = force ? variant.stock - item.cantidad : Math.max(0, variant.stock - item.cantidad);
      }
      product.stock = (product.variantes || []).reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      product.vendidos = (product.vendidos || 0) + item.cantidad;
      await product.save();
    } else {
      await Product.findByIdAndUpdate(item.producto, {
        $inc: { stock: -item.cantidad, vendidos: item.cantidad },
      });
    }
  }

  order.stockDeducido = true;
  await order.save();

  // Collect products that hit stock <= 0 after this deduction
  const agotados = [];
  for (const item of order.items) {
    const product = await Product.findById(item.producto).select('nombre stock').lean();
    if (product && product.stock <= 0) agotados.push({ _id: product._id, nombre: product.nombre, stock: product.stock });
  }

  const populated = await Order.findById(order._id).populate('usuario', 'nombre apellido email');
  return { order: populated, agotados };
};

const updateProductStock = async (productId, newStock) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  const oldStock = product.stock;
  product.stock = Math.max(0, newStock);
  await product.save();
  return { productId, oldStock, newStock: product.stock };
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getOrderByCode,
  updateOrderStatus,
  dispatchOrder,
  finalizeOrder,
  updateProductStock,
};
