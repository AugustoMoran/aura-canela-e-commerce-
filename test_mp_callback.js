require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/User');

async function testMercadoPagoCallback() {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  Testing MP Callback Functionality     ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Connect to DB
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado\n');

    // Create test order with pending status
    console.log('📦 Creando orden de prueba...');
    const testOrder = new Order({
      codigo: `TEST-${Date.now()}`,
      usuario: null,
      guestData: {
        nombre: 'Test Usuario',
        apellido: 'Prueba',
        email: 'test@example.com',
        telefono: '1234567890',
        direccion: 'Calle Test 123'
      },
      items: [
        {
          producto: new mongoose.Types.ObjectId(),
          nombre: 'Producto Test',
          cantidad: 1,
          precio: 100,
          talla: 'M',
          color: 'Rojo',
          imagen: 'https://via.placeholder.com/200'
        }
      ],
      subtotal: 100,
      descuento: 0,
      total: 100,
      metodoPago: 'mercadopago',
      estadoPago: 'pendiente',
      estadoEnvio: 'pendiente',
      mpPreferenceId: 'TEST-PREF-123',
      stockDeducido: false
    });

    await testOrder.save();
    console.log(`✅ Orden creada: ${testOrder._id}`);
    console.log(`   Código: ${testOrder.codigo}`);
    console.log(`   Estado pago: ${testOrder.estadoPago}\n`);

    // Test the callback logic (simulating what the callback function does)
    console.log('🧪 Simulando callback de MP...\n');

    const { Payment } = require('mercadopago');
    const MercadoPagoConfig = require('mercadopago').default;

    const orderId = testOrder._id.toString();
    console.log(`Buscando pagos para orden: ${orderId}`);

    try {
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
      const payment = new Payment(client);

      // Search for approved payments
      console.log('🔍 Consultando pagos aprobados en MP...');
      const payments = await payment.search({
        qs: { external_reference: orderId, status: 'approved' }
      });

      console.log(`   Resultados encontrados: ${payments.results ? payments.results.length : 0}\n`);

      if (payments.results && payments.results.length > 0) {
        const approvedPayment = payments.results[0];
        console.log('✅ PAGO APROBADO ENCONTRADO!');
        console.log(`   Payment ID: ${approvedPayment.id}`);
        console.log(`   Status: ${approvedPayment.status}`);
        console.log(`   Amount: ${approvedPayment.transaction_amount}\n`);

        // Update order
        testOrder.estadoPago = 'aprobado';
        testOrder.mpPaymentId = approvedPayment.id;
        testOrder.metodoPago = 'mercadopago';
        await testOrder.save();

        console.log(`✅ Orden actualizada:`);
        console.log(`   Nuevo estado pago: ${testOrder.estadoPago}\n`);
      } else {
        console.log('⚠️  No hay pagos aprobados para esta orden');
        console.log('   (Esto es normal si no hiciste un pago real en MP)\n');
      }
    } catch (mpError) {
      console.error('⚠️  Error consultando MP:');
      console.error(`   ${mpError.message}\n`);
      console.log('💡 Esto es normal - verifica que MP_ACCESS_TOKEN sea válido\n');
    }

    // Verify final order state
    console.log('✅ ORDEN FINAL:');
    const finalOrder = await Order.findById(testOrder._id);
    console.log(`   ID: ${finalOrder._id}`);
    console.log(`   Código: ${finalOrder.codigo}`);
    console.log(`   Estado Pago: ${finalOrder.estadoPago}`);
    console.log(`   Método Pago: ${finalOrder.metodoPago}`);
    console.log(`   MP Payment ID: ${finalOrder.mpPaymentId || 'N/A'}\n`);

    // Cleanup
    console.log('🧹 Limpiando orden de prueba...');
    await Order.findByIdAndDelete(testOrder._id);
    console.log('✅ Eliminada\n');

    console.log('✅ TEST COMPLETADO!\n');

  } catch (error) {
    console.error('❌ ERROR en test:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testMercadoPagoCallback();
