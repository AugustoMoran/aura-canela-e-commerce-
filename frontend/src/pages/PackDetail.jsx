import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiChevronLeft } from 'react-icons/hi';
import { useGetPackQuery } from '../services/packsApi';
import CategoryPacks from '../components/products/CategoryPacks';
import { formatCurrency } from '../utils/formatCurrency';
import usePageMeta from '../hooks/usePageMeta';

const PackDetail = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useGetPackQuery(id);
  const pack = data?.data;

  usePageMeta({
    title: pack?.nombre || 'Pack',
    description: pack?.descripcion || `Pack de ${pack?.cantidadUnidades || ''} unidades Aura Canela`,
    image: pack?.imagen?.url,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">No encontramos este pack.</p>
        <Link to="/" className="btn-primary">Volver al inicio</Link>
      </div>
    );
  }

  const categoriaId = pack.categoria?._id || pack.categoria;
  const cover = pack.imagen?.url || pack.categoria?.imagen;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <HiChevronLeft size={16} /> Volver
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="rounded-3xl overflow-hidden bg-natural aspect-square">
          {cover ? (
            <img src={cover} alt={pack.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
          )}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary-600 mb-2">
            {pack.categoria?.nombre || 'Pack'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-ink uppercase tracking-tight">
            {pack.nombre || `Pack de ${pack.cantidadUnidades} unidades`}
          </h1>
          <p className="text-3xl font-black text-primary-600 mt-4">{formatCurrency(pack.precio)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {pack.cantidadUnidades} unidades · {formatCurrency(pack.precio / pack.cantidadUnidades)} c/u
          </p>
          {pack.descripcion && (
            <p className="text-gray-600 mt-6 leading-relaxed">{pack.descripcion}</p>
          )}
          <p className="text-sm text-gray-500 mt-6">
            Elegí talle y color de cada prenda y sumá el pack al carrito.
          </p>
        </div>
      </div>

      <CategoryPacks
        categoriaId={categoriaId}
        categoriaNombre={pack.categoria?.nombre || 'Pack'}
        lockPackId={pack._id}
      />
    </div>
  );
};

export default PackDetail;
