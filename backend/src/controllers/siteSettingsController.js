const SiteSettings = require('../models/SiteSettings');

exports.getSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener configuraciones', error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ mensaje: 'Configuraciones actualizadas con éxito', settings });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar configuraciones', error: error.message });
  }
};
