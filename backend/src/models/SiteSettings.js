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
      default: '#B91C1C' // Darker red per user requirement
    },
    naturalColor: {
      type: String,
      default: '#F5F3EE' // Natural/Cream
    },
    blackColor: {
      type: String,
      default: '#000000'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
