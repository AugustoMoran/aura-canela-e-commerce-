const Banner = require('../models/Banner');

const getBanners = async (req, res, next) => {
  try {
    const soloActivos = req.query.activos === 'true';
    const filter = soloActivos ? { activo: true } : {};
    const banners = await Banner.find(filter).sort({ orden: 1, createdAt: 1 });
    
    // Agregar defaults para campos que podrían no existir en banners antiguos
    const bannersConDefaults = banners.map(b => {
      const obj = b.toObject();
      return {
        ...obj,
        mostrarTexto: obj.mostrarTexto !== false,
        mostrarBoton: obj.mostrarBoton !== false,
        autoplay: obj.autoplay === true,
        video: obj.video || '',
      };
    });
    
    res.json(bannersConDefaults);
  } catch (err) {
    next(err);
  }
};

const createBanner = async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch (err) {
    next(err);
  }
};

const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!banner) return res.status(404).json({ message: 'Banner no encontrado' });
    res.json(banner);
  } catch (err) {
    next(err);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner no encontrado' });
    res.json({ message: 'Banner eliminado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBanners, createBanner, updateBanner, deleteBanner };
