import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTrackOrderMutation } from '../services/ordersApi';
import { formatCurrency } from '../utils/formatCurrency';
import usePageMeta from '../hooks/usePageMeta';

const STEPS = ['Recibido', 'En preparación', 'Enviado', 'Entregado'];

const normalizeEstado = (estado) => {
  const map = {
    'Pedido recibido': 'Recibido',
    Preparado: 'En preparación',
    'Listo para despachar': 'En preparación',
    Despachado: 'Enviado',
  };
  return map[estado] || estado || 'Recibido';
};

const TrackOrder = () => {
  usePageMeta({ title: 'Seguí tu pedido', description: 'Consultá el estado de tu pedido Aura Canela con el código y tu email.' });
  const [codigo, setCodigo] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState(null);
  const [trackOrder, { isLoading }] = useTrackOrderMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await trackOrder({ codigo: codigo.trim(), email: email.trim() }).unwrap();
      setOrder(result);
    } catch (err) {
      setOrder(null);
      toast.error(err?.data?.message || 'No encontramos ese pedido');
    }
  };

  const estado = normalizeEstado(order?.estadoPedido);
  const stepIndex = estado === 'Cancelado' ? -1 : STEPS.indexOf(estado);

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-ink uppercase tracking-tight mb-2">Seguí tu pedido</h1>
      <p className="text-gray-500 text-sm mb-8">Ingresá el código que te llegó por mail y el email con el que compraste.</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1">Código de pedido</label>
          <input
            className="input-field uppercase"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="ABC123"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? 'Buscando...' : 'Consultar'}
        </button>
      </form>

      {order && (
        <div className="card p-6 space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-600 font-bold">Pedido</p>
              <p className="font-mono font-black text-xl text-ink">{order.codigo}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              estado === 'Cancelado' ? 'bg-primary-100 text-primary-700' : 'bg-green-100 text-green-800'
            }`}>
              {estado}
            </span>
          </div>

          {estado !== 'Cancelado' && (
            <div className="flex justify-between gap-1">
              {STEPS.map((step, i) => (
                <div key={step} className="flex-1 text-center">
                  <div className={`h-1.5 rounded-full mb-2 ${i <= stepIndex ? 'bg-primary-600' : 'bg-gray-200'}`} />
                  <p className="text-[10px] font-bold text-gray-500 uppercase">{step}</p>
                </div>
              ))}
            </div>
          )}

          <ul className="text-sm space-y-2">
            {order.items?.map((item, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  {item.cantidad}x {item.nombre}
                  {[item.talla, item.color].filter(Boolean).length ? ` (${[item.talla, item.color].filter(Boolean).join(' · ')})` : ''}
                </span>
                <span className="font-medium">{formatCurrency(item.precio * item.cantidad)}</span>
              </li>
            ))}
          </ul>

          {order.datosEnvio?.servicio && (
            <p className="text-sm text-gray-600">Envío: {order.datosEnvio.servicio} — {formatCurrency(order.datosEnvio.costo || 0)}</p>
          )}
          {order.datosEnvio?.trackingNumber && (
            <p className="text-sm">Seguimiento: <strong>{order.datosEnvio.trackingNumber}</strong></p>
          )}
          <div className="flex justify-between font-black text-lg border-t pt-3">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
