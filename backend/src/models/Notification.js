const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null indica notificación global para admins
    },
    tipo: {
      type: String,
      enum: ['pedido', 'pago', 'envio', 'stock', 'facturacion', 'usuario'],
      required: true,
    },
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      default: '',
      trim: true,
    },
    entidadRelacionada: {
      type: String,
      enum: ['Order', 'Product', 'User', 'Invoice', 'Shipping'],
      default: null,
    },
    entidadId: {
      type: String,
      default: null,
    },
    leida: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ usuario: 1, leida: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
