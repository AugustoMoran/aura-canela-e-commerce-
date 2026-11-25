import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiHeart } from 'react-icons/hi';
import { useToggleFavoriteMutation, useGetMeQuery } from '../../services/authApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { sellableStock } from '../../utils/productStock';

const ProductCard = ({ product }) => {
  const user = useSelector(selectCurrentUser);
  const { data: me } = useGetMeQuery(undefined, { skip: !user });
  const [toggleFavorite] = useToggleFavoriteMutation();

  const isFavorite = me?.favoritos?.includes(product._id);
  const image = product.imagenes?.[0]?.url || 'https://via.placeholder.com/400x400?text=Sin+imagen';
  const inStock = sellableStock(product) > 0;

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Iniciá sesión para agregar favoritos'); return; }
    try {
      await toggleFavorite(product._id).unwrap();
    } catch (_) {}
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
        <p className="text-xs text-gray-500 font-medium">Disponible en packs</p>
      </div>
    </Link>
  );
};

export default ProductCard;
