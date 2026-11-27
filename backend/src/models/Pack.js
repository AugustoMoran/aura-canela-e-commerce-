const mongoose = require('mongoose');

const packSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      default: '',
      trim: true,
    },
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    cantidadUnidades: {
      type: Number,
      required: true,
      min: [1, 'La cantidad de unidades debe ser mayor a 0'],
    },
    precio: {
      type: Number,
      required: true,
      min: [0.01, 'El precio debe ser mayor a 0'],
    },
    descripcion: {
      type: String,
      default: '',
      trim: true,
    },
    imagen: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Consultas por categoría ordenadas por cantidad. No es único: se pueden repetir packs.
packSchema.index({ categoria: 1, cantidadUnidades: 1 });

module.exports = mongoose.model('Pack', packSchema);
