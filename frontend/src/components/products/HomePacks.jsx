import React, { useEffect } from 'react';
import { useGetPacksQuery } from '../../services/packsApi';
import CategoryPacks from './CategoryPacks';

const HomePacks = () => {
  const { data: packsData, isLoading } = useGetPacksQuery({ activo: 'true' });
  const packs = (packsData?.data || []).filter((pack) => pack.activo !== false);

  useEffect(() => {
    if (window.location.hash === '#packs') {
      document.getElementById('packs')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [packs.length]);

  if (isLoading || packs.length === 0) return null;

  const categories = [];
  const seen = new Set();
  packs.forEach((pack) => {
    const cat = pack.categoria;
    const id = cat?._id || cat;
    if (!id || seen.has(String(id))) return;
    seen.add(String(id));
    categories.push({
      _id: id,
      nombre: cat?.nombre || 'Pack',
    });
  });

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
            Llevá más unidades y pagá menos. Elegí el pack, armá tu combinación y sumalo al carrito.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <CategoryPacks
            key={cat._id}
            categoriaId={cat._id}
            categoriaNombre={cat.nombre}
          />
        ))}
      </div>
    </section>
  );
};

export default HomePacks;
