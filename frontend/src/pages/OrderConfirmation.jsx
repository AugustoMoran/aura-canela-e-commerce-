import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { HiCheckCircle, HiXCircle, HiOutlineClipboardList } from 'react-icons/hi';
import toast from 'react-hot-toast';
import usePageMeta from '../hooks/usePageMeta';

const OrderConfirmation = () => {
  usePageMeta({ title: 'Pedido realizado' });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [params] = useSearchParams();
  const status = params.get('status') || 'success';
  const codigo = params.get('codigo');
  const isSuccess = status === 'success' || status === 'approved';

  const copyCode = () => {
    if (!codigo) return;
    navigator.clipboard.writeText(codigo).then(() => toast.success('Código copiado'));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-10 text-center animate-fade-in">
        {isSuccess ? (
          <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        ) : (
          <HiXCircle className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        )}

        <h1 className="text-2xl font-bold mb-2">
          {isSuccess ? '¡Pedido realizado!' : 'Error en el pago'}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {isSuccess
            ? 'Guardá el código para seguir el estado. También te llega por mail cuando SMTP esté configurado.'
            : 'Hubo un problema al procesar tu pago. Podés intentarlo nuevamente.'}
        </p>

        {isSuccess && codigo && (
          <button
            type="button"
            onClick={copyCode}
            className="w-full mb-6 rounded-xl bg-natural border border-natural-dark py-3 font-mono font-black text-lg text-ink"
          >
            {codigo}
            <span className="block text-[10px] font-bold tracking-widest text-gray-400 mt-1">TOCA PARA COPIAR</span>
          </button>
        )}

        <div className="flex flex-col gap-3">
          {isSuccess && (
            <Link to={codigo ? `/pedido` : '/mis-ordenes'} className="btn-primary flex items-center justify-center gap-2">
              <HiOutlineClipboardList size={18} />
              Seguir pedido
            </Link>
          )}
          <Link to="/productos" className="btn-secondary">
            {isSuccess ? 'Seguir comprando' : 'Volver al inicio'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
