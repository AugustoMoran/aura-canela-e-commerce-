import React, { useState } from 'react';
import { useGetPacksByCategoryQuery } from '../../services/packsApi';
import { useGetProductsQuery } from '../../services/productsApi';
import { useAddToCartMutation } from '../../services/cartApi';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, openCart } from '../../features/cart/cartSlice';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

const CategoryPacks = ({ categoriaId, categoriaNombre }) => {
  const { data: packsData } = useGetPacksByCategoryQuery(categoriaId, { skip: !categoriaId });
  const { data: productsData } = useGetProductsQuery({ categoria: categoriaId, limit: 50 }, { skip: !categoriaId });

  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedProducts, setSelectedProductos] = useState([]); // Array de objetos { producto, cantidad, talla, color }

  const packs = packsData?.data || [];
  const categoryProducts = productsData?.products || [];

  if (!packs || packs.length === 0) return null;

  const handleSelectPack = (pack) => {
    setSelectedPack(pack);
    setSelectedProductos([]);
  };

  const currentQuantitySelected = selectedProducts.reduce((sum, item) => sum + item.cantidad, 0);
  const remainingQuantity = selectedPack ? selectedPack.cantidadUnidades - currentQuantitySelected : 0;

  const handleAddProductToPackSelection = (product, talla, color) => {
    if (!selectedPack) return;
    if (remainingQuantity <= 0) {
      toast.error(`Ya completaste las ${selectedPack.cantidadUnidades} unidades de tu pack.`);
      return;
    }

    setSelectedProductos((prev) => {
      const idx = prev.findIndex(
        (p) => p.producto._id === product._id && p.talla === talla && p.color === color
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].cantidad += 1;
        return copy;
      }
      return [
        ...prev,
        {
          producto: product,
          nombre: product.nombre,
          talla: talla || null,
          color: color || null,
          cantidad: 1,
        },
      ];
    });

    toast.success(`Añadido 1x ${product.nombre} al pack`);
  };

  const handleRemoveProductFromPack = (index) => {
    setSelectedProductos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddToCartPack = async () => {
    if (!selectedPack) return;
    if (currentQuantitySelected < selectedPack.cantidadUnidades) {
      toast.error(`Debes seleccionar exactamente ${selectedPack.cantidadUnidades} unidades para formar tu pack.`);
      return;
    }

    try {
      const packCartItem = {
        isPack: true,
        cantidad: 1,
        packInfo: {
          packId: selectedPack._id,
          nombrePack: selectedPack.nombre || `Pack de ${selectedPack.cantidadUnidades} u. (${categoriaNombre})`,
          categoriaId,
          precioPack: selectedPack.precio,
          cantidadUnidades: selectedPack.cantidadUnidades,
          productosSeleccionados: selectedProducts.map((p) => ({
            producto: p.producto._id,
            nombre: p.nombre,
            talla: p.talla,
            color: p.color,
            cantidad: p.cantidad,
          })),
        },
      };

      if (user) {
        await addToCart(packCartItem).unwrap();
      } else {
        dispatch(addItem(packCartItem));
      }
      dispatch(openCart());
      toast.success('¡Pack agregado al carrito!');

      setSelectedPack(null);
      setSelectedProductos([]);
    } catch (error) {
      toast.error(error?.data?.message || 'Error al agregar el pack al carrito.');
    }
  };

  return (
    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 my-8 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📦</span>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Comprar por Pack</h3>
          <p className="text-xs text-gray-600">
            Aprovecha los descuentos por cantidad en {categoriaNombre}. Armá tu combinación preferida.
          </p>
        </div>
      </div>

      {/* Opciones de Packs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {packs.map((pack) => {
          const isSelected = selectedPack?._id === pack._id;
          return (
            <div
              key={pack._id}
              onClick={() => handleSelectPack(pack)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary-600 bg-white shadow-md ring-2 ring-primary-500/20'
                  : 'border-amber-200 bg-white hover:border-primary-400'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-gray-800 text-sm">
                  {pack.nombre || `Pack ${pack.cantidadUnidades} Unidades`}
                </span>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  Llevás {pack.cantidadUnidades} u.
                </span>
              </div>
              <p className="text-lg font-black text-primary-600">{formatCurrency(pack.precio)}</p>
              <p className="text-[11px] text-gray-500 mt-1">
                {formatCurrency(pack.precio / pack.cantidadUnidades)} por unidad
              </p>
            </div>
          );
        })}
      </div>

      {/* Selector de productos para completar el pack */}
      {selectedPack && (
        <div className="bg-white rounded-xl p-5 border border-amber-300 shadow-inner space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h4 className="font-bold text-gray-800 text-sm">
                Seleccioná tus productos ({currentQuantitySelected} de {selectedPack.cantidadUnidades})
              </h4>
              <p className="text-xs text-gray-500">
                Elegí cualquier variante hasta completar {selectedPack.cantidadUnidades} unidades.
              </p>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                remainingQuantity === 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {remainingQuantity === 0 ? '¡Pack Completo!' : `Faltan ${remainingQuantity} u.`}
            </span>
          </div>

          {/* Lista de productos elegidos */}
          {selectedProducts.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <span className="text-xs font-bold text-gray-700 block">Tu combinación:</span>
              {selectedProducts.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs text-gray-800 bg-white p-2 rounded border">
                  <span>
                    <strong>{item.cantidad}x</strong> {item.nombre}{' '}
                    {item.talla && `(Talla: ${item.talla})`}{' '}
                    {item.color && `(Color: ${item.color})`}
                  </span>
                  <button
                    onClick={() => handleRemoveProductFromPack(idx)}
                    className="text-red-500 hover:text-red-700 font-bold ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Grilla de selección de productos de la categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
            {categoryProducts.map((product) => (
              <div key={product._id} className="p-2 border rounded-lg flex items-center justify-between text-xs bg-gray-50">
                <div className="flex items-center gap-2 min-w-0">
                  {product.imagenes?.[0]?.url && (
                    <img src={product.imagenes[0].url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  )}
                  <span className="truncate font-medium text-gray-800">{product.nombre}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddProductToPackSelection(product, product.tallas?.habilitadas?.[0], product.colores?.[0]?.nombre)}
                  disabled={remainingQuantity <= 0}
                  className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded font-bold disabled:opacity-40"
                >
                  + Agregar
                </button>
              </div>
            ))}
          </div>

          {/* Botón de confirmar Pack */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleAddToCartPack}
              disabled={isAdding || currentQuantitySelected !== selectedPack.cantidadUnidades}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow transition disabled:opacity-50"
            >
              {isAdding ? 'Agregando...' : `Agregar Pack al Carrito por ${formatCurrency(selectedPack.precio)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPacks;
