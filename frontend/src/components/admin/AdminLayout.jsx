import React, { useState } from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAdmin } from '../../features/auth/authSlice';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
} from '../../services/notificationsApi';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineTicket,
  HiOutlinePhotograph,
  HiOutlineCollection,
  HiOutlineHome,
  HiOutlineChatAlt2,
  HiOutlineCog,
  HiOutlineBell,
  HiOutlineArchive,
} from 'react-icons/hi';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: HiOutlineViewGrid, exact: true },
  { to: '/admin/productos', label: 'Productos', icon: HiOutlineCube },
  { to: '/admin/categorias', label: 'Categorías', icon: HiOutlineTag },
  { to: '/admin/packs', label: 'Packs Promocionales', icon: HiOutlineArchive },
  { to: '/admin/ordenes', label: 'Pedidos', icon: HiOutlineClipboardList },
  { to: '/admin/envios', label: 'Cotización Correo', icon: HiOutlineTruck },
  { to: '/admin/notificaciones', label: 'Notificaciones', icon: HiOutlineBell },
  { to: '/admin/cupones', label: 'Cupones', icon: HiOutlineTicket },
  { to: '/admin/cloudinary', label: 'Almacenamiento', icon: HiOutlinePhotograph },
  { to: '/admin/banners', label: 'Banners', icon: HiOutlineCollection },
  { to: '/admin/popup', label: 'Popup WhatsApp', icon: HiOutlineChatAlt2 },
  { to: '/admin/configuracion', label: 'Configuración', icon: HiOutlineCog },
];

const AdminLayout = ({ children, title }) => {
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();
  const navigate = useNavigate();
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  const { data: notifData } = useGetNotificationsQuery(
    { page: 1, limit: 5 },
    { pollingInterval: 25000, skip: !isAdmin }
  );

  const [markAsRead] = useMarkAsReadMutation();

  const unreadCount = notifData?.data?.unreadCount || 0;
  const notifications = notifData?.data?.notifications || [];

  if (!isAdmin) return <Navigate to="/" replace />;

  const handleNotifClick = async (notif) => {
    if (!notif.leida) {
      await markAsRead(notif._id).catch(() => {});
    }
    setShowBellDropdown(false);
    if (notif.entidadRelacionada === 'Order') {
      navigate('/admin/ordenes');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-100 flex-shrink-0 hidden md:flex flex-col">
        <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center">
          <p className="font-bold text-white">Panel Admin</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                  active ? 'bg-primary-400 text-gray-900 font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <HiOutlineHome size={18} />
            Ir a la tienda
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#F5F3EE]">
        {/* Topbar Admin */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-30">
          <h1 className="text-lg font-bold text-gray-800">{title || 'Panel de Control'}</h1>

          <div className="relative">
            <button
              onClick={() => setShowBellDropdown(!showBellDropdown)}
              className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
              title="Notificaciones"
            >
              <HiOutlineBell size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Notificaciones */}
            {showBellDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">Notificaciones Recientes</span>
                  <Link
                    to="/admin/notificaciones"
                    onClick={() => setShowBellDropdown(false)}
                    className="text-xs text-primary-600 font-semibold hover:underline"
                  >
                    Ver todas
                  </Link>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">Sin notificaciones</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotifClick(n)}
                        className={`p-3 text-xs cursor-pointer hover:bg-gray-50 transition ${
                          !n.leida ? 'bg-blue-50/60 font-semibold' : ''
                        }`}
                      >
                        <p className="text-gray-800 font-medium">{n.titulo}</p>
                        <p className="text-gray-500 text-[11px] truncate mt-0.5">{n.descripcion}</p>
                        <span className="text-[10px] text-gray-400 block mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
