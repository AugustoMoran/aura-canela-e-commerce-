const notificationService = require('../services/notificationService');

const getNotificationsController = async (req, res, next) => {
  try {
    const usuarioId = req.user?._id;
    const isAdmin = req.user?.rol === 'admin';
    const { page, limit, tipo } = req.query;

    const data = await notificationService.getNotifications({
      usuarioId,
      isAdmin,
      page,
      limit,
      tipo,
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const markAsReadController = async (req, res, next) => {
  try {
    const usuarioId = req.user?._id;
    const isAdmin = req.user?.rol === 'admin';

    const notification = await notificationService.markAsRead(req.params.id, usuarioId, isAdmin);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

const markAllAsReadController = async (req, res, next) => {
  try {
    const usuarioId = req.user?._id;
    const isAdmin = req.user?.rol === 'admin';

    await notificationService.markAllAsRead(usuarioId, isAdmin);
    res.json({ success: true, message: 'Todas las notificaciones fueron marcadas como leídas' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
};
