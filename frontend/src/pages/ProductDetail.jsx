import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetProductQuery, useGetRelatedProductsQuery } from '../services/productsApi';
import { useGetSiteSettingsQuery } from '../services/siteSettingsApi';
import { useToggleFavoriteMutation, useGetMeQuery } from '../services/authApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import ProductCard from '../components/products/ProductCard';
import { HiOutlineHeart, HiHeart, HiChevronLeft, HiOutlineFilm, HiChevronRight, HiOutlineShoppingCart } from 'react-icons/hi';
import { FaWhatsapp, FaCreditCard, FaUniversity } from 'react-icons/fa';
import { STORE, waMeUrl } from '../config/storeContact';
import { sellableStock, variantStock, usesVariants } from '../utils/productStock';
import { formatCurrency } from '../utils/formatCurrency';
import { generateWhatsAppLink } from '../utils/generateWhatsAppLink';
import useCart from '../hooks/useCart';
import usePageMeta from '../hooks/usePageMeta';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const user = useSelector(selectCurrentUser);
  const { data: product, isLoading, error } = useGetProductQuery(id);
  const { data: settings } = useGetSiteSettingsQuery();
  const { data: related = [] } = useGetRelatedProductsQuery(id, { skip: !product });
  const { data: me } = useGetMeQuery(undefined, { skip: !user });
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [missingVariant, setMissingVariant] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  usePageMeta({
    title: product?.nombre,
    description: product?.descripcion,
    image: product?.imagenes?.[0]?.url,
  });

  const sellsByUnit = Boolean(product?.ventaPorUnidad) && Number(product?.precio) > 0;
  const needsTalla = product?.tallas?.habilitadas?.length > 0;
  const needsColor = product?.colores?.length > 0;
  const variantReady = (!needsTalla || selectedTalla) && (!needsColor || selectedColor);
  const availableNow = product ? variantStock(product, selectedTalla, selectedColor) : 0;
  const totalSellable = product ? sellableStock(product) : 0;
  const categoriaId = product?.categoria?._id || product?.categoria;
  const packsHref = categoriaId ? `/productos?categoria=${categoriaId}` : '/productos';
  const transferEnabled = Boolean(settings?.transferenciaActiva && settings?.transferenciaAlias?.trim());
  const transferPct = transferEnabled
    ? Math.min(100, Math.max(0, Number(settings.transferenciaDescuento) || 0))
    : 0;

  const requireVariant = () => {
    if ((needsTalla && !selectedTalla) || (needsColor && !selectedColor)) {
      setMissingVariant(true);
      toast.error('Elegí talle y color');
      return false;
    }
    setMissingVariant(false);
    return true;
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 sm:mb-6 min-w-0">
        <Link to="/productos" className="flex items-center gap-1 hover:text-primary-600">
          <HiChevronLeft size={16} /> Productos
        </Link>
        <span>/</span>
        <span className="text-gray-400">{product.categoria?.nombre}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.nombre}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-12 sm:mb-16">
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
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                >
                  <HiChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setSelectedImage((prev) => (prev === media.length - 1 ? 0 : prev + 1))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
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

          {sellsByUnit && (
            <div className="mb-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl font-extrabold text-gray-900">{formatCurrency(product.precioOferta || product.precio)}</span>
                {product.precioOferta && product.precioOferta < product.precio && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{formatCurrency(product.precio)}</span>
                    <span className="badge bg-primary-100 text-primary-700 font-bold">
                      -{Math.round(((product.precio - product.precioOferta) / product.precio) * 100)}%
                    </span>
                  </>
                )}
              </div>
              {transferEnabled && (
                <p className="mt-2 text-sm text-amber-800">
                  {transferPct > 0
                    ? `${formatCurrency(Math.round((product.precioOferta || product.precio) * (1 - transferPct / 100)))} por transferencia (${transferPct}% de descuento). `
                    : 'También podés pagar por transferencia. '}
                  Alias {settings.transferenciaAlias}
                  {settings.transferenciaTitular ? ` · ${settings.transferenciaTitular}` : ''}
                </p>
              )}
            </div>
          )}

          <p className="text-gray-600 leading-relaxed mb-6">{product.descripcion}</p>

          <div className="mb-6">
            {sellsByUnit && usesVariants(product) && !variantReady && totalSellable > 0 ? (
              <span className="badge bg-gray-100 text-gray-700">Elegí talle y color para ver stock</span>
            ) : (sellsByUnit ? availableNow : totalSellable) > 0 ? (
              <span className={`badge ${(sellsByUnit ? availableNow : totalSellable) <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'}`}>
                {(sellsByUnit ? availableNow : totalSellable) <= 2
                  ? `Últimas ${sellsByUnit ? availableNow : totalSellable} unidades`
                  : `En stock (${sellsByUnit ? availableNow : totalSellable})`}
              </span>
            ) : (
              <span className="badge bg-primary-100 text-primary-700">Sin stock</span>
            )}
          </div>

          {product.tallas?.habilitadas?.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {sellsByUnit ? 'Talla' : 'Tallas disponibles'} {product.tallas?.rango && `(${product.tallas.rango})`}
              </label>
              <div className="flex gap-2 flex-wrap">
                {product.tallas.habilitadas.map((talla) => (
                  sellsByUnit ? (
                    <button
                      key={talla}
                      type="button"
                      onClick={() => setSelectedTalla(talla)}
                      className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                        selectedTalla === talla
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : missingVariant && !selectedTalla
                            ? 'border-primary-400 text-primary-700'
                            : 'border-gray-300 text-gray-600 hover:border-primary-300'
                      }`}
                    >
                      {talla}
                    </button>
                  ) : (
                    <span
                      key={talla}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg font-medium text-gray-700"
                    >
                      {talla}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}

          {product.colores?.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {sellsByUnit ? 'Color' : 'Colores disponibles'}
              </label>
              <div className="flex gap-3 flex-wrap">
                {product.colores.map((color) => (
                  sellsByUnit ? (
                    <button
                      key={color.codigo}
                      type="button"
                      onClick={() => setSelectedColor(color.nombre)}
                      disabled={!color.habilitado}
                      className={`relative w-12 h-12 rounded-lg border-2 transition-all ${
                        selectedColor === color.nombre
                          ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${!color.habilitado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{ backgroundColor: color.codigo }}
                      title={color.nombre}
                    >
                      {selectedColor === color.nombre && (
                        <div className="absolute inset-0 flex items-center justify-center text-white font-bold">✓</div>
                      )}
                    </button>
                  ) : (
                    <div
                      key={color.codigo}
                      className={`relative w-12 h-12 rounded-lg border-2 border-gray-300 ${!color.habilitado ? 'opacity-50' : ''}`}
                      style={{ backgroundColor: color.codigo }}
                      title={color.nombre}
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {sellsByUnit ? (
            <div className="space-y-3 mt-auto">
              {totalSellable > 0 && (
                <>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-gray-900">Cantidad:</label>
                    <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                      <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-50 text-lg">-</button>
                      <span className="px-4 py-2 font-medium">{qty}</span>
                      <button type="button" onClick={() => setQty((q) => Math.min(Math.max(1, availableNow || 1), q + 1))} className="px-3 py-2 hover:bg-gray-50 text-lg">+</button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!requireVariant()) return;
                      if (availableNow < qty) {
                        toast.error('No hay suficiente stock de esa combinación');
                        return;
                      }
                      addToCart(product, qty, selectedTalla, selectedColor);
                    }}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    <HiOutlineShoppingCart size={20} />
                    Agregar al carrito
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!requireVariant()) return;
                      addToCart(product, qty, selectedTalla, selectedColor);
                      navigate('/checkout');
                    }}
                    disabled={(needsTalla && !selectedTalla) || (needsColor && !selectedColor)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    <FaCreditCard size={20} />
                    Pagar con Mercado Pago
                  </button>
                  {transferEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireVariant()) return;
                        if (availableNow < qty) {
                          toast.error('No hay suficiente stock de esa combinación');
                          return;
                        }
                        addToCart(product, qty, selectedTalla, selectedColor);
                        navigate('/checkout?metodo=transferencia');
                      }}
                      disabled={(needsTalla && !selectedTalla) || (needsColor && !selectedColor)}
                      className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
                    >
                      <FaUniversity size={20} />
                      Pagar por transferencia
                    </button>
                  )}
                </>
              )}
              <a
                href={variantReady ? generateWhatsAppLink([{ producto: product, cantidad: qty, talla: selectedTalla, color: selectedColor }], (product.precioOferta || product.precio) * qty) : '#'}
                onClick={(e) => { if (!requireVariant()) e.preventDefault(); }}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
              >
                <FaWhatsapp size={20} />
                Consultar por WhatsApp
              </a>
              <Link to={packsHref} className="block text-center text-sm text-primary-600 font-medium hover:underline">
                También podés armar un pack
              </Link>
            </div>
          ) : (
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
          )}
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
