const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
    cantidad: { type: Number, required: true, min: 1, default: 1 },
    talla: { type: String, required: false, default: null },
    color: { type: String, required: false, default: null },
    // Soporte para Packs
    isPack: { type: Boolean, default: false },
    packInfo: {
      packId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pack' },
      nombrePack: { type: String, default: '' },
      categoriaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      precioPack: { type: Number, default: 0 },
      cantidadUnidades: { type: Number, default: 0 },
      productosSeleccionados: [
        {
          producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          nombre: { type: String, default: '' },
          talla: { type: String, default: null },
          color: { type: String, default: null },
          cantidad: { type: Number, default: 1 },
        }
      ]
    }
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
