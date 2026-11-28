const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    announcementText: { 
      type: String, 
      default: 'CLICK AQUÍ // Seguinos por redes para obtener ofertas exclusivas // CLICK AQUÍ // Seguinos por redes para obtener ofertas exclusivas' 
    },
    announcementActive: { 
      type: Boolean, 
      default: true 
    },
    announcementLink: {
      type: String,
      default: ''
    },
    primaryColor: {
      type: String,
      default: '#E11D8A'
    },
    naturalColor: {
      type: String,
      default: '#F5F3EE' // Natural/Cream
    },
    blackColor: {
      type: String,
      default: '#000000'
    },
    transferenciaActiva: {
      type: Boolean,
      default: false,
    },
    transferenciaAlias: {
      type: String,
      default: '',
      trim: true,
    },
    transferenciaTitular: {
      type: String,
      default: '',
      trim: true,
    },
    transferenciaCbu: {
      type: String,
      default: '',
      trim: true,
    },
    transferenciaDescuento: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
