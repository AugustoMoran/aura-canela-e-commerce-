import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiHeart, HiOutlineShoppingCart } from 'react-icons/hi';
import { formatCurrency } from '../../utils/formatCurrency';
import useCart from '../../hooks/useCart';
import { useToggleFavoriteMutation, useGetMeQuery } from '../../services/authApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { usesVariants, sellableStock } from '../../utils/productStock';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const user = useSelector(selectCurrentUser);
  const { data: me } = useGetMeQuery(undefined, { skip: !user });
  const [toggleFavorite] = useToggleFavoriteMutation();

  const isFavorite = me?.favoritos?.includes(product._id);
  const image = product.imagenes?.[0]?.url || 'https://via.placeholder.com/400x400?text=Sin+imagen';
  const displayPrice = product.precioOferta || product.precio;
  const hasDiscount = product.precioOferta && product.precioOferta < product.precio;

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Iniciá sesión para agregar favoritos'); return; }
    try {
      await toggleFavorite(product._id).unwrap();
    } catch (_) {}
  };

  const inStock = sellableStock(product) > 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (usesVariants(product)) {
      return;
    }
    addToCart(product, 1);
  };

  return (
    <Link to={`/productos/${product._id}`} className="bg-white rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full border border-natural-dark">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/5] bg-natural/30">
        <img
          src={image}
          alt={product.nombre}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-primary-600 text-white font-black text-[10px] px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">
            -{Math.round(((product.precio - product.precioOferta) / product.precio) * 100)}% OFF
          </span>
        )}
        
        {/* Favorite */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center transition-all hover:bg-white hover:scale-110 z-10"
        >
          {isFavorite ? (
            <HiHeart size={18} className="text-primary-600" />
          ) : (
            <HiOutlineHeart size={18} className="text-ink" />
          )}
        </button>

        {/* Quick Add Button (Desktop only on hover) */}
        {inStock && !usesVariants(product) && (
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block">
            <button
              onClick={handleAddToCart}
              className="w-full bg-ink/90 hover:bg-primary-600 text-white text-xs font-black py-3 px-4 rounded-xl backdrop-blur-sm transition-colors uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2"
            >
              <HiOutlineShoppingCart size={16} />
              Agregar al carrito
            </button>
          </div>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-white font-black text-xs bg-ink/80 px-4 py-2 rounded-full uppercase tracking-[0.2em]">Agotado</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col bg-white">
        <p className="text-[10px] text-primary-600 font-bold mb-1 uppercase tracking-widest">{product.categoria?.nombre || 'General'}</p>
        <h3 className="font-bold text-sm line-clamp-2 mb-3 text-ink group-hover:text-primary-600 transition-colors flex-1 leading-tight">
          {product.nombre}
        </h3>
        
        <div className="flex flex-col gap-0.5">
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through font-medium">{formatCurrency(product.precio)}</span>
          )}
          <div className="flex items-center justify-between">
            <span className="font-black text-xl text-primary-700 tracking-tighter">
              {formatCurrency(displayPrice)}
            </span>
            {!usesVariants(product) && inStock && (
            <button 
              onClick={handleAddToCart}
              className="md:hidden w-8 h-8 rounded-full bg-natural flex items-center justify-center text-ink hover:bg-primary-600 hover:text-white transition-colors"
            >
              <HiOutlineShoppingCart size={16} />
            </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
