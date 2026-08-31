import React, { useEffect } from 'react';
import { useGetMyOrdersQuery } from '../services/ordersApi';
import { formatCurrency } from '../utils/formatCurrency';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  preparando: { label: 'Preparando', color: 'bg-blue-100 text-blue-700' },
  enviado: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  entregado: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', color: 'bg-primary-100 text-primary-700' },
};

const PAY_LABELS = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  aprobado: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  rechazado: { label: 'Rechazado', color: 'bg-primary-100 text-primary-700' },
};

const OrderHistory = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { data, isLoading } = useGetMyOrdersQuery();

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-5 animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      ))}
    </div>
  );

  const orders = data?.orders || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <p className="mb-4">No tenés pedidos aún.</p>
          <Link to="/productos" className="btn-primary">Ver productos</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const envio = STATUS_LABELS[order.estadoEnvio] || STATUS_LABELS.pendiente;
            const pago = PAY_LABELS[order.estadoPago] || PAY_LABELS.pendiente;
            const trackingNumber = order.datosEnvio?.trackingNumber;
            const historialEnvio = order.datosEnvio?.historialEnvio || [];

            return (
              <div key={order._id} className="card p-5 space-y-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono font-bold text-primary-600 text-lg">{order.codigo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('es-AR', { dateStyle: 'long' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="badge bg-amber-100 text-amber-800 text-xs font-semibold">
                    Estado: {order.estadoPedido || 'Pedido recibido'}
                  </span>
                  <span className={`badge text-xs ${envio.color}`}>Envío: {envio.label}</span>
                  <span className={`badge text-xs ${pago.color}`}>Pago: {pago.label}</span>
                </div>

                {/* Info de Seguimiento Correo Argentino */}
                {trackingNumber && (
                  <div className="bg-gray-50 p-3 rounded-lg border text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700">🚚 Correo Argentino - Tracking:</span>
                      <span className="font-mono font-bold text-primary-600 bg-white px-2 py-0.5 rounded border">
                        {trackingNumber}
                      </span>
                    </div>
                  </div>
                )}

                {/* Timeline de Seguimiento */}
                <div className="border-t pt-3">
                  <p className="text-xs font-bold text-gray-700 mb-2">Progreso del Pedido y Envío:</p>
                  <div className="space-y-2">
                    {[
                      { estado: 'Pedido recibido', done: true },
                      {
                        estado: 'En preparación',
                        done: ['En preparación', 'Preparado', 'Listo para despachar', 'Despachado', 'entregado'].includes(
                          order.estadoPedido
                        ),
                      },
                      {
                        estado: 'Despachado / Correo Argentino',
                        done: ['Despachado', 'entregado'].includes(order.estadoPedido) || Boolean(trackingNumber),
                      },
                      {
                        estado: 'Entregado',
                        done: order.estadoEnvio === 'entregado' || order.estadoPedido === 'Entregado',
                      },
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            step.done ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {step.done ? '✓' : idx + 1}
                        </div>
                        <span className={step.done ? 'font-semibold text-gray-800' : 'text-gray-400'}>
                          {step.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                  {order.items?.slice(0, 3).map((item) => (
                    <span key={item._id || item.nombre} className="truncate max-w-[120px]">
                      {item.nombre}
                    </span>
                  ))}
                  {order.items?.length > 3 && <span>+{order.items.length - 3} más</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
