const packService = require('../services/packService');

const createPackController = async (req, res, next) => {
  try {
    const pack = await packService.createPack(req.body);
    res.status(201).json({ success: true, message: 'Pack creado exitosamente', data: pack });
  } catch (error) {
    next(error);
  }
};

const getPacksController = async (req, res, next) => {
  try {
    const packs = await packService.getPacks(req.query);
    res.json({ success: true, data: packs });
  } catch (error) {
    next(error);
  }
};

const getPackByIdController = async (req, res, next) => {
  try {
    const pack = await packService.getPackById(req.params.id);
    res.json({ success: true, data: pack });
  } catch (error) {
    next(error);
  }
};

const updatePackController = async (req, res, next) => {
  try {
    const pack = await packService.updatePack(req.params.id, req.body);
    res.json({ success: true, message: 'Pack actualizado exitosamente', data: pack });
  } catch (error) {
    next(error);
  }
};

const deletePackController = async (req, res, next) => {
  try {
    const result = await packService.deletePack(req.params.id);
    res.json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const getPacksByCategoryController = async (req, res, next) => {
  try {
    const packs = await packService.getPacksByCategory(req.params.categoriaId);
    res.json({ success: true, data: packs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPackController,
  getPacksController,
  getPackByIdController,
  updatePackController,
  deletePackController,
  getPacksByCategoryController,
};
