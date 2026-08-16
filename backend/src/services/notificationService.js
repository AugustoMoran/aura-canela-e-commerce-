const Notification = require('../models/Notification');

const createNotification = async ({
  usuario = null,
  tipo,
  titulo,
  descripcion = '',
  entidadRelacionada = null,
  entidadId = null,
}) => {
  try {
    const notification = await Notification.create({
      usuario,
      tipo,
      titulo,
      descripcion,
      entidadRelacionada,
      entidadId: entidadId ? entidadId.toString() : null,
    });

    return notification;
  } catch (error) {
    console.error('Error al crear notificación:', error);
  }
};

const getNotifications = async ({ usuarioId, isAdmin = false, page = 1, limit = 20, tipo = null }) => {
  const query = {};

  if (isAdmin) {
    query.$or = [{ usuario: null }, { usuario: usuarioId }];
  } else {
    query.usuario = usuarioId;
  }

  if (tipo && tipo !== 'todas') {
    query.tipo = tipo;
  }

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ ...query, leida: false });

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    notifications,
    unreadCount,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

const markAsRead = async (id, usuarioId, isAdmin = false) => {
  const notification = await Notification.findById(id);
  if (!notification) throw new Error('Notificación no encontrada');

  notification.leida = true;
  await notification.save();
  return notification;
};

const markAllAsRead = async (usuarioId, isAdmin = false) => {
  const query = {};
  if (isAdmin) {
    query.$or = [{ usuario: null }, { usuario: usuarioId }];
  } else {
    query.usuario = usuarioId;
  }

  await Notification.updateMany(query, { leida: true });
  return { success: true };
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
};
