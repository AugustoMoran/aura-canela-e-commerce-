import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetProductQuery, useGetRelatedProductsQuery } from '../services/productsApi';
import { useToggleFavoriteMutation, useGetMeQuery } from '../services/authApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import ProductCard from '../components/products/ProductCard';
import { HiOutlineHeart, HiHeart, HiChevronLeft, HiOutlineFilm, HiChevronRight } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { STORE, waMeUrl } from '../config/storeContact';
import { sellableStock } from '../utils/productStock';
import usePageMeta from '../hooks/usePageMeta';

const ProductDetail = () => {
  const { id } = useParams();
  const user = useSelector(selectCurrentUser);
  const { data: product, isLoading, error } = useGetProductQuery(id);
  const { data: related = [] } = useGetRelatedProductsQuery(id, { skip: !product });
  const { data: me } = useGetMeQuery(undefined, { skip: !user });
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  usePageMeta({
    title: product?.nombre,
    description: product?.descripcion,
    image: product?.imagenes?.[0]?.url,
  });

  const totalSellable = product ? sellableStock(product) : 0;
  const categoriaId = product?.categoria?._id || product?.categoria;
  const packsHref = categoriaId ? `/productos?categoria=${categoriaId}` : '/productos';

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-square bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
      <p>Producto no encontrado.</p>
      <Link to="/productos" className="btn-primary mt-4 inline-block">Ver productos</Link>
    </div>
  );

  const isFavorite = me?.favoritos?.includes(product._id);

  const media = [];
  if (product.imagenes?.length) {
    product.imagenes.forEach((img) => media.push({ type: 'image', ...img }));
  }
  if (product.videos?.length) {
    product.videos.forEach((vid) => media.push({ type: 'video', ...vid }));
  }
  if (media.length === 0) {
    media.push({ type: 'image', url: 'https://via.placeholder.com/600x600?text=Sin+imagen' });
  }

  const waLink = waMeUrl(
    `Hola ${STORE.name} 💕\nQuiero consultar por: ${product.nombre}`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/productos" className="flex items-center gap-1 hover:text-primary-600">
          <HiChevronLeft size={16} /> Productos
        </Link>
        <span>/</span>
        <span className="text-gray-400">{product.categoria?.nombre}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.nombre}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
        <div>
          <div className="rounded-2xl overflow-hidden bg-white mb-3 relative group aspect-square">
            {media[selectedImage]?.type === 'video' ? (
              <video
                src={media[selectedImage]?.url}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={media[selectedImage]?.url}
                alt={product.nombre}
                onClick={() => setZoomOpen(true)}
                className="w-full h-full object-contain cursor-zoom-in"
              />
            )}

            {media.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((prev) => (prev === 0 ? media.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <HiChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setSelectedImage((prev) => (prev === media.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <HiChevronRight size={24} />
                </button>
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {selectedImage + 1} / {media.length}
                </div>
              </>
            )}
          </div>
          {media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {media.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImage === i ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  {item.type === 'video' ? (
                    <>
                      <video src={item.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <HiOutlineFilm size={20} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm text-gray-400">{product.categoria?.nombre}</p>
            <button
              onClick={() => toggleFavorite(product._id)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              {isFavorite ? <HiHeart size={22} className="text-primary-600" /> : <HiOutlineHeart size={22} className="text-gray-400" />}
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{product.nombre}</h1>

          <p className="text-gray-600 leading-relaxed mb-6">{product.descripcion}</p>

          <div className="mb-6">
            {totalSellable > 0 ? (
              <span className={`badge ${totalSellable <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'}`}>
                {totalSellable <= 2 ? `Últimas ${totalSellable} unidades` : `En stock (${totalSellable})`}
              </span>
            ) : (
              <span className="badge bg-primary-100 text-primary-700">Sin stock</span>
            )}
          </div>

          {product.tallas?.habilitadas?.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tallas disponibles {product.tallas?.rango && `(${product.tallas.rango})`}
              </label>
              <div className="flex gap-2 flex-wrap">
                {product.tallas.habilitadas.map((talla) => (
                  <span
                    key={talla}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg font-medium text-gray-700"
                  >
                    {talla}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.colores?.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Colores disponibles
              </label>
              <div className="flex gap-3 flex-wrap">
                {product.colores.map((color) => (
                  <div
                    key={color.codigo}
                    className={`relative w-12 h-12 rounded-lg border-2 border-gray-300 ${!color.habilitado ? 'opacity-50' : ''}`}
                    style={{ backgroundColor: color.codigo }}
                    title={color.nombre}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 mt-auto">
            <p className="text-sm text-gray-600">
              Este producto se vende solo en packs. Armá tu combinación desde la categoría.
            </p>
            {totalSellable > 0 && (
              <Link to={packsHref} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                Ver packs y comprar
              </Link>
            )}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              <FaWhatsapp size={20} />
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pb-16">
          <h2 className="text-xl font-bold mb-6">Productos relacionados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {zoomOpen && media[selectedImage]?.type !== 'video' && (
        <button
          type="button"
          className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <img src={media[selectedImage]?.url} alt={product.nombre} className="max-h-full max-w-full object-contain" />
        </button>
      )}
    </div>
  );
};

export default ProductDetail;
