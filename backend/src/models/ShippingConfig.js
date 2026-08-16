const mongoose = require('mongoose');

const shippingConfigSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: 'correoargentino',
      required: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    // Credenciales
    usuario: {
      type: String,
      default: '',
      trim: true,
    },
    passwordOrToken: {
      type: String,
      default: '',
      trim: true,
    },
    ambiente: {
      type: String,
      enum: ['sandbox', 'produccion'],
      default: 'sandbox',
    },
    // Datos Remitente / Origen
    codigoPostalOrigen: {
      type: String,
      default: '',
      trim: true,
    },
    direccionOrigen: {
      type: String,
      default: '',
      trim: true,
    },
    localidad: {
      type: String,
      default: '',
      trim: true,
    },
    provincia: {
      type: String,
      default: '',
      trim: true,
    },
    nombreRemitente: {
      type: String,
      default: '',
      trim: true,
    },
    emailRemitente: {
      type: String,
      default: '',
      trim: true,
    },
    telefonoRemitente: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShippingConfig', shippingConfigSchema);
