const shippingService = require('../services/shippingService');

const getShippingConfigController = async (req, res, next) => {
  try {
    const config = await shippingService.getShippingConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

const updateShippingConfigController = async (req, res, next) => {
  try {
    const config = await shippingService.updateShippingConfig(req.body);
    res.json({ success: true, message: 'Configuración de envíos actualizada con éxito', data: config });
  } catch (error) {
    next(error);
  }
};

const quoteShippingController = async (req, res, next) => {
  try {
    const { items, destinationZip, providerName } = req.body;
    const result = await shippingService.calculateShippingQuote({
      items,
      destinationZip,
      providerName,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const syncTrackingController = async (req, res, next) => {
  try {
    await shippingService.syncPendingShipmentsTracking();
    res.json({ success: true, message: 'Sincronización de estados de envío finalizada' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShippingConfigController,
  updateShippingConfigController,
  quoteShippingController,
  syncTrackingController,
};
