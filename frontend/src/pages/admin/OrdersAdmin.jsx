import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetAllOrdersQuery, useUpdateOrderMutation, useFinalizeOrderMutation, useDeleteOrderMutation } from '../../services/ordersApi';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineTrash, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';

const PEDIDO_ESTADOS = ['Recibido', 'En preparación', 'Enviado', 'Entregado', 'Cancelado'];
const PAGO_OPTIONS = ['pendiente', 'aprobado', 'rechazado', 'reembolsado'];

const METODO_BADGE = {
  mercadopago: 'bg-blue-100 text-blue-700',
  whatsapp: 'bg-green-100 text-green-700',
  pendiente: 'bg-gray-100 text-gray-600',
};

const normalizeEstado = (estado) => {
  const map = {
    'Pedido recibido': 'Recibido',
    Preparado: 'En preparación',
    'Listo para despachar': 'En preparación',
    Despachado: 'Enviado',
  };
  return map[estado] || estado || 'Recibido';
};

const clienteNombre = (order) =>
  order.usuario
    ? `${order.usuario.nombre} ${order.usuario.apellido}`
    : `${order.guestData?.nombre || ''} ${order.guestData?.apellido || ''}`.trim() || 'Invitado';

const clienteEmail = (order) => order.usuario?.email || order.guestData?.email || '—';
const clienteTel = (order) => order.usuario?.telefono || order.guestData?.telefono || '—';

const OrdersAdmin = () => {
  const [page, setPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [trackingDraft, setTrackingDraft] = useState({});
  const { data, isLoading, isFetching } = useGetAllOrdersQuery({ page, limit: 15 });
  const [updateOrder] = useUpdateOrderMutation();
  const [finalizeOrder, { isLoading: finalizing }] = useFinalizeOrderMutation();
  const [deleteOrder] = useDeleteOrderMutation();
  const [finalizingId, setFinalizingId] = useState(null);

  const handleUpdate = async (id, payload) => {
    try {
      await updateOrder({ id, ...payload }).unwrap();
      toast.success('Pedido actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleFinalize = async (order, force = false) => {
    const isRejectedOrCanceled = ['rechazado', 'cancelado'].includes(order.estadoPago);
    const confirmMsg = isRejectedOrCanceled
      ? `¿Finalizar ${order.codigo} sin tocar stock?`
      : force
        ? 'Stock insuficiente. ¿Descontar igual?'
        : `¿Descontar el stock de ${order.codigo}?`;
    if (!window.confirm(confirmMsg)) return;
    setFinalizingId(order._id);
    try {
      await finalizeOrder({ id: order._id, force }).unwrap();
      toast.success('Pedido finalizado');
    } catch (err) {
      if (err?.data?.code === 'STOCK_INSUFICIENTE') {
        handleFinalize(order, true);
        return;
      }
      toast.error(err?.data?.message || 'Error al finalizar');
    } finally {
      setFinalizingId(null);
    }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`¿Eliminar ${order.codigo}?`)) return;
    try {
      await deleteOrder(order._id).unwrap();
      toast.success('Eliminado');
    } catch (err) {
      toast.error(err?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-2">Pedidos</h1>
      <p className="text-sm text-gray-500 mb-6">
        Un solo flujo: Recibido → En preparación → Enviado → Entregado. El envío lo gestionás vos; acá queda el registro y el cliente recibe el mail al pasar a Enviado o Cancelado.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : (data?.orders || []).map((order) => (
              <React.Fragment key={order._id}>
                <tr className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                      className="p-1 hover:bg-gray-200 rounded inline-flex mr-2"
                    >
                      {expandedOrderId === order._id ? <HiOutlineChevronUp size={16} /> : <HiOutlineChevronDown size={16} />}
                    </button>
                    <span className="font-mono font-bold text-primary-600">{order.codigo}</span>
                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${METODO_BADGE[order.metodoPago] || METODO_BADGE.pendiente}`}>
                      {order.metodoPago}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px]">
                    <p className="truncate font-medium">{clienteNombre(order)}</p>
                    <p className="truncate text-xs text-gray-400">{clienteEmail(order)}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.estadoPago}
                      onChange={(e) => handleUpdate(order._id, { estadoPago: e.target.value })}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                    >
                      {PAGO_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={normalizeEstado(order.estadoPedido)}
                      onChange={(e) => handleUpdate(order._id, { estadoPedido: e.target.value })}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-amber-50 font-semibold"
                    >
                      {PEDIDO_ESTADOS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    {!order.stockDeducido && ['aprobado', 'rechazado', 'cancelado'].includes(order.estadoPago) ? (
                      <button
                        onClick={() => handleFinalize(order)}
                        disabled={finalizingId === order._id || finalizing}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <HiOutlineCheckCircle size={14} />
                        {finalizingId === order._id ? '...' : 'Descontar stock'}
                      </button>
                    ) : order.stockDeducido ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Stock ok</span>
                        <button onClick={() => handleDelete(order)} className="p-1 rounded-lg hover:bg-primary-50 text-primary-400">
                          <HiOutlineTrash size={13} />
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
                {expandedOrderId === order._id && (
                  <tr className="bg-gray-50 border-b">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                          <h4 className="font-semibold text-sm mb-3">Qué pidió</h4>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b text-gray-600">
                                <th className="text-left py-2">Producto</th>
                                <th className="text-right">Cant.</th>
                                <th className="text-left">Talle</th>
                                <th className="text-left">Color</th>
                                <th className="text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items?.map((item, i) => (
                                <tr key={i} className="border-b last:border-0">
                                  <td className="py-2">{item.nombre}</td>
                                  <td className="text-right">{item.cantidad}</td>
                                  <td>{item.talla || '—'}</td>
                                  <td>{item.color || '—'}</td>
                                  <td className="text-right font-medium">{formatCurrency(item.precio * item.cantidad)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="space-y-3 text-sm">
                          <h4 className="font-semibold">Cliente y envío</h4>
                          <p>{clienteNombre(order)}</p>
                          <p className="text-gray-500">{clienteEmail(order)}</p>
                          <p className="text-gray-500">{clienteTel(order)}</p>
                          <p className="text-gray-500">{order.guestData?.direccion || order.datosEnvio?.direccion || 'Sin dirección'}</p>
                          <div className="rounded-xl bg-natural p-3 text-xs space-y-1">
                            <p><strong>Cómo lo recibe:</strong> {order.datosEnvio?.servicio || order.datosEnvio?.tipo || '—'}</p>
                            <p><strong>Costo envío:</strong> {formatCurrency(order.datosEnvio?.costo || 0)}</p>
                            <p><strong>CP:</strong> {order.datosEnvio?.codigoPostal || '—'}</p>
                          </div>
                          <label className="block text-xs font-medium">Código de seguimiento (opcional)</label>
                          <div className="flex gap-2">
                            <input
                              className="input-field text-xs"
                              placeholder="Andreani / Correo / etc."
                              value={trackingDraft[order._id] ?? order.datosEnvio?.trackingNumber ?? ''}
                              onChange={(e) => setTrackingDraft((prev) => ({ ...prev, [order._id]: e.target.value }))}
                            />
                            <button
                              type="button"
                              className="btn-secondary text-xs whitespace-nowrap"
                              onClick={() => handleUpdate(order._id, { trackingNumber: trackingDraft[order._id] ?? '' })}
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              disabled={isFetching}
              className={`w-9 h-9 rounded-lg text-sm font-medium ${
                page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white border hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default OrdersAdmin;
