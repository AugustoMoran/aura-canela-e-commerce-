import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '../../services/notificationsApi';

const NotificationsAdmin = () => {
  const navigate = useNavigate();
  const [filterTipo, setFilterTipo] = useState('todas');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetNotificationsQuery(
    { tipo: filterTipo, page, limit: 15 },
    { pollingInterval: 30000 } // Polling automático cada 30s
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  const notifications = data?.data?.notifications || [];
  const totalPages = data?.data?.totalPages || 1;

  const handleNotificationClick = async (notif) => {
    if (!notif.leida) {
      try {
        await markAsRead(notif._id).unwrap();
      } catch (err) {
        console.error(err);
      }
    }

    // Redirección inteligente al recurso relacionado
    if (notif.entidadRelacionada === 'Order') {
      navigate('/admin/ordenes');
    } else if (notif.entidadRelacionada === 'Product') {
      navigate('/admin/productos');
    } else if (notif.entidadRelacionada === 'User') {
      navigate('/admin/usuarios');
    }
  };

  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case 'pedido':
        return '🛒';
      case 'pago':
        return '💳';
      case 'envio':
        return '🚚';
      case 'stock':
        return '📦';
      case 'facturacion':
        return '📄';
      case 'usuario':
        return '👤';
      default:
        return '🔔';
    }
  };

  return (
    <AdminLayout title="Centro de Notificaciones">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🔔 Historial de Notificaciones
            </h2>
            <p className="text-sm text-gray-600">
              Eventos en tiempo real sobre pedidos, pagos, stock y envíos.
            </p>
          </div>

          <button
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition disabled:opacity-50"
          >
            Marcar todas como leídas
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'pedido', label: 'Pedidos' },
            { id: 'pago', label: 'Pagos' },
            { id: 'envio', label: 'Envíos' },
            { id: 'stock', label: 'Stock' },
            { id: 'facturacion', label: 'Facturación' },
            { id: 'usuario', label: 'Usuarios' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setFilterTipo(item.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                filterTipo === item.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay notificaciones registradas para esta categoría.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-lg cursor-pointer transition flex items-start gap-4 ${
                  notif.leida ? 'hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50 border-l-4 border-primary-600'
                }`}
              >
                <div className="text-2xl p-2 bg-white rounded-full shadow-sm">
                  {getNotificationIcon(notif.tipo)}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-900 text-sm">{notif.titulo}</h4>
                    <span className="text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{notif.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-xs text-gray-500">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default NotificationsAdmin;
