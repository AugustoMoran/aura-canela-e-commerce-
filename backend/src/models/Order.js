const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    imagen: { type: String, default: '' },
    talla: { type: String, required: false, default: null },
    color: { type: String, required: false, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true, uppercase: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Guest data
    guestData: {
      nombre: { type: String, default: '' },
      apellido: { type: String, default: '' },
      email: { type: String, default: '' },
      telefono: { type: String, default: '' },
      direccion: { type: String, default: '' },
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    descuento: { type: Number, default: 0 },
    total: { type: Number, required: true },
    cupon: { type: String, default: null },
    metodoPago: {
      type: String,
      enum: ['mercadopago', 'whatsapp', 'pendiente'],
      default: 'pendiente',
    },
    estadoPago: {
      type: String,
      enum: ['pendiente', 'aprobado', 'rechazado', 'reembolsado'],
      default: 'pendiente',
    },
    // Estado interno del pedido
    estadoPedido: {
      type: String,
      enum: [
        'Recibido',
        'En preparación',
        'Enviado',
        'Entregado',
        'Cancelado',
        'Pedido recibido',
        'Preparado',
        'Listo para despachar',
        'Despachado',
      ],
      default: 'Recibido',
    },
    notasAdmin: { type: String, default: '' },
    historialEstadoPedido: [
      {
        fecha: { type: Date, default: Date.now },
        estado: { type: String, required: true },
        usuario: { type: String, default: 'Sistema' },
      }
    ],
    // Información y seguimiento de envío (Correo Argentino / Logística)
    datosEnvio: {
      tipo: { type: String, enum: ['correo', 'retiro', 'whatsapp', ''], default: '' },
      proveedor: { type: String, default: 'correoargentino' },
      servicio: { type: String, default: '' },
      servicioCode: { type: String, default: '' },
      costo: { type: Number, default: 0 },
      trackingNumber: { type: String, default: null },
      codigoPostal: { type: String, default: '' },
      direccion: { type: String, default: '' },
      localidad: { type: String, default: '' },
      provincia: { type: String, default: '' },
      estadoCorreo: { type: String, default: 'Iniciado' },
      historialEnvio: [
        {
          fecha: { type: Date, default: Date.now },
          estado: { type: String, required: true },
          descripcion: { type: String, default: '' },
        }
      ]
    },
    estadoEnvio: {
      type: String,
      enum: ['pendiente', 'preparando', 'enviado', 'entregado', 'cancelado'],
      default: 'pendiente',
    },
    mpPreferenceId: { type: String, default: null },
    mpPaymentId: { type: String, default: null },
    notificacionEnviada: { type: Boolean, default: false },
    codigoUsado: { type: Boolean, default: false },
    stockDeducido: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
