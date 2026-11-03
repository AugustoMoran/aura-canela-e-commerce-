import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGetPacksQuery } from '../../services/packsApi';
import { formatCurrency } from '../../utils/formatCurrency';

const HomePacks = () => {
  const { data: packsData, isLoading } = useGetPacksQuery({ activo: 'true' });
  const packs = (packsData?.data || []).filter((pack) => pack.activo !== false);

  useEffect(() => {
    if (window.location.hash === '#packs') {
      document.getElementById('packs')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [packs.length]);

  if (isLoading || packs.length === 0) return null;

  return (
    <section id="packs" className="py-10 scroll-mt-28">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary-600 mb-2">
            La mejor forma de comprar
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-ink uppercase tracking-tight">
            Packs
          </h2>
          <p className="text-gray-600 mt-2 max-w-xl">
            Elegí el pack, armá talle y color de cada prenda y sumalo al carrito.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {packs.map((pack) => {
          const cover = pack.imagen?.url || pack.categoria?.imagen;
          return (
            <Link
              key={pack._id}
              to={`/packs/${pack._id}`}
              className="group bg-white rounded-3xl overflow-hidden border border-natural-dark shadow-sm hover:shadow-xl transition-all"
            >
              <div className="aspect-[4/5] bg-natural overflow-hidden">
                {cover ? (
                  <img src={cover} alt={pack.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                )}
              </div>
              <div className="p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">
                  {pack.categoria?.nombre || 'Pack'}
                </p>
                <h3 className="font-black text-ink text-lg mt-1 group-hover:text-primary-600">
                  {pack.nombre || `Pack de ${pack.cantidadUnidades} unidades`}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{pack.cantidadUnidades} unidades</p>
                <p className="text-xl font-black text-primary-600 mt-3">{formatCurrency(pack.precio)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default HomePacks;
