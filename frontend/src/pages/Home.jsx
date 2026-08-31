import React from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/ui/HeroCarousel';
import ProductCard from '../components/products/ProductCard';
import HomePacks from '../components/products/HomePacks';
import { useGetProductsQuery } from '../services/productsApi';
import { useGetCategoriesQuery } from '../services/productsApi';
import { HiArrowRight } from 'react-icons/hi';

const CategoryCard = ({ category }) => (
  <Link
    to={`/productos?categoria=${category._id}`}
    className="group relative h-48 sm:h-64 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500"
  >
    {category.imagen ? (
      <img 
        src={category.imagen} 
        alt={category.nombre} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
      />
    ) : (
      <div className="w-full h-full bg-ink flex items-center justify-center">
        <span className="text-natural-500 font-bold text-4xl opacity-20">{category.nombre[0]}</span>
      </div>
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-hover:from-primary-900/90 transition-all" />
    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform">
      <span className="block font-black text-white text-base sm:text-lg uppercase tracking-wider text-center group-hover:scale-105 transition-transform">
        {category.nombre}
      </span>
      <div className="w-8 h-1 bg-primary-600 mx-auto mt-2 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
    </div>
  </Link>
);

const Home = () => {
  const { data: featuredData } = useGetProductsQuery({ limit: 8, sort: 'popular' });
  const { data: newData } = useGetProductsQuery({ limit: 8, sort: 'newest' });
  const { data: categories = [] } = useGetCategoriesQuery();

  return (
    <div className="bg-natural font-sans">
      {/* Hero */}
      <HeroCarousel />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HomePacks />

        {/* Featured products */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Más vendidos</h2>
            <Link to="/productos?sort=popular" className="text-gray-900 hover:text-gray-600 text-sm font-semibold flex items-center gap-1">
              Ver todo <HiArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(featuredData?.products || []).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
              <Link to="/productos" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                Ver todo <HiArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((cat) => <CategoryCard key={cat._id} category={cat} />)}
            </div>
          </section>
        )}

        {/* Banner CTA */}
        <section className="py-12">
          <div className="bg-ink rounded-[40px] p-8 sm:p-16 flex flex-col sm:flex-row items-center justify-between gap-10 text-white border-2 border-primary-600 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary-600/20 transition-all duration-700"></div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black mb-4 uppercase tracking-tighter">¡Comprá con confianza!</h2>
              <p className="text-gray-400 text-lg max-w-lg">Los packs son la forma más conveniente de armar tu pedido. Pagá por Mercado Pago, transferencia o en el local.</p>
            </div>
            <Link to="/#packs" className="relative z-10 bg-primary-600 text-white font-black px-10 py-5 rounded-2xl hover:bg-primary-700 transition-all whitespace-nowrap flex-shrink-0 shadow-[0_0_20px_rgba(225,29,138,0.4)] uppercase tracking-widest text-sm">
              Ver packs
            </Link>
          </div>
        </section>

        {/* New products */}
        <section className="py-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Novedades</h2>
            <Link to="/productos?sort=newest" className="text-gray-900 hover:text-gray-600 text-sm font-semibold flex items-center gap-1">
              Ver todo <HiArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(newData?.products || []).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
