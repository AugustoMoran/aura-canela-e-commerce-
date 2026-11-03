import React, { useEffect, useMemo, useState } from 'react';
import { useGetPacksByCategoryQuery } from '../../services/packsApi';
import { useGetProductsQuery } from '../../services/productsApi';
import { useAddToCartMutation } from '../../services/cartApi';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, openCart } from '../../features/cart/cartSlice';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { variantStock, usesVariants } from '../../utils/productStock';

const lineKey = (productId, talla, color) => `${productId}::${talla || ''}::${color || ''}`;

const CategoryPacks = ({ categoriaId, categoriaNombre, lockPackId }) => {
  const { data: packsData } = useGetPacksByCategoryQuery(categoriaId, { skip: !categoriaId });
  const { data: productsData } = useGetProductsQuery(
    { categoria: categoriaId, limit: 50, sort: 'newest' },
    { skip: !categoriaId }
  );

  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  const [selectedPack, setSelectedPack] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [variantByProduct, setVariantByProduct] = useState({});

  const packs = (packsData?.data || []).filter((pack) => !lockPackId || pack._id === lockPackId);
  const categoryProducts = productsData?.products || [];

  useEffect(() => {
    if (lockPackId && packs.length && !selectedPack) {
      setSelectedPack(packs[0]);
    }
  }, [lockPackId, packs, selectedPack]);

  const currentQuantitySelected = useMemo(
    () => selectedProducts.reduce((sum, item) => sum + item.cantidad, 0),
    [selectedProducts]
  );
  const remainingQuantity = selectedPack
    ? Math.max(0, selectedPack.cantidadUnidades - currentQuantitySelected)
    : 0;

  if (!packs.length) return null;

  const handleSelectPack = (pack) => {
    if (selectedPack?._id === pack._id) return;
    setSelectedPack(pack);
    setSelectedProducts([]);
  };

  const getVariant = (product) => {
    const saved = variantByProduct[product._id] || {};
    return {
      talla: saved.talla ?? product.tallas?.habilitadas?.[0] ?? null,
      color: saved.color ?? product.colores?.[0]?.nombre ?? null,
    };
  };

  const setVariant = (productId, field, value) => {
    setVariantByProduct((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const addOneUnit = (product) => {
    if (!selectedPack) return;
    const { talla, color } = getVariant(product);
    if (usesVariants(product) && ((product.tallas?.habilitadas?.length && !talla) || (product.colores?.length && !color))) {
      toast.error('Elegí talle y color');
      return;
    }
    const available = variantStock(product, talla, color);
    if (available <= 0) {
      toast.error('Sin stock para esa combinación');
      return;
    }
    const key = lineKey(product._id, talla, color);

    setSelectedProducts((prev) => {
      const total = prev.reduce((sum, item) => sum + item.cantidad, 0);
      if (total >= selectedPack.cantidadUnidades) return prev;

      const idx = prev.findIndex(
        (item) => lineKey(item.producto._id, item.talla, item.color) === key
      );
      if (idx >= 0) {
        if (prev[idx].cantidad + 1 > available) {
          toast.error(`Solo hay ${available} de esa combinación`);
          return prev;
        }
        return prev.map((item, i) =>
          i === idx ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [
        ...prev,
        {
          producto: product,
          nombre: product.nombre,
          talla,
          color,
          cantidad: 1,
        },
      ];
    });
  };

  const changeLineQty = (index, delta) => {
    setSelectedProducts((prev) => {
      const max = selectedPack?.cantidadUnidades || 0;
      const total = prev.reduce((sum, item) => sum + item.cantidad, 0);
      const item = prev[index];
      if (!item) return prev;
      const nextQty = item.cantidad + delta;
      if (nextQty <= 0) return prev.filter((_, i) => i !== index);
      if (delta > 0 && total >= max) return prev;
      return prev.map((row, i) => (i === index ? { ...row, cantidad: nextQty } : row));
    });
  };

  const handleAddToCartPack = async () => {
    if (!selectedPack) return;
    if (currentQuantitySelected !== selectedPack.cantidadUnidades) {
      toast.error(`Seleccioná exactamente ${selectedPack.cantidadUnidades} unidades.`);
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
      setSelectedProducts([]);
    } catch (error) {
      toast.error(error?.data?.message || 'Error al agregar el pack al carrito.');
    }
  };

  return (
    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 my-8 shadow-sm">
      {!lockPackId && (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📦</span>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Comprar por Pack</h3>
          <p className="text-xs text-gray-600">
            Aprovechá los descuentos por cantidad en {categoriaNombre}. Armá tu combinación de a una unidad.
          </p>
        </div>
      </div>
      )}

      {!lockPackId && (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {packs.map((pack) => {
          const isSelected = selectedPack?._id === pack._id;
          return (
            <button
              type="button"
              key={pack._id}
              onClick={() => handleSelectPack(pack)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
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
            </button>
          );
        })}
      </div>
      )}

      {selectedPack && (
        <div className="bg-white rounded-xl p-5 border border-amber-300 shadow-inner space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h4 className="font-bold text-gray-800 text-sm">
                Seleccioná {selectedPack.cantidadUnidades} unidades ({currentQuantitySelected}/{selectedPack.cantidadUnidades})
              </h4>
              <p className="text-xs text-gray-500">Cada toque suma 1 unidad. Usá + y − para ajustar.</p>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                remainingQuantity === 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {remainingQuantity === 0 ? '¡Pack completo!' : `Faltan ${remainingQuantity} u.`}
            </span>
          </div>

          {selectedProducts.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <span className="text-xs font-bold text-gray-700 block">Tu combinación:</span>
              {selectedProducts.map((item, idx) => (
                <div key={`${item.producto._id}-${idx}`} className="flex justify-between items-center text-xs text-gray-800 bg-white p-2 rounded border gap-2">
                  <span className="min-w-0 truncate">
                    {item.nombre}
                    {item.talla ? ` · ${item.talla}` : ''}
                    {item.color ? ` · ${item.color}` : ''}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => changeLineQty(idx, -1)}
                      className="w-6 h-6 rounded-full border font-bold hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="w-5 text-center font-bold">{item.cantidad}</span>
                    <button
                      type="button"
                      onClick={() => changeLineQty(idx, 1)}
                      disabled={remainingQuantity <= 0}
                      className="w-6 h-6 rounded-full border font-bold hover:bg-gray-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
            {categoryProducts.map((product) => {
              const variant = getVariant(product);
              const tallas = product.tallas?.habilitadas || [];
              const colores = (product.colores || []).filter((c) => c.habilitado !== false);
              return (
                <div key={product._id} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {product.imagenes?.[0]?.url && (
                      <img src={product.imagenes[0].url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    )}
                    <span className="truncate font-medium text-gray-800 text-xs">{product.nombre}</span>
                  </div>
                  <div className="flex gap-2">
                    {tallas.length > 0 && (
                      <select
                        value={variant.talla || ''}
                        onChange={(e) => setVariant(product._id, 'talla', e.target.value)}
                        className="flex-1 text-xs border rounded px-1 py-1 bg-white"
                      >
                        {tallas.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    )}
                    {colores.length > 0 && (
                      <select
                        value={variant.color || ''}
                        onChange={(e) => setVariant(product._id, 'color', e.target.value)}
                        className="flex-1 text-xs border rounded px-1 py-1 bg-white"
                      >
                        {colores.map((c) => (
                          <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addOneUnit(product)}
                    disabled={remainingQuantity <= 0}
                    className="w-full px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded font-bold text-xs disabled:opacity-40"
                  >
                    + 1 unidad
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleAddToCartPack}
              disabled={isAdding || currentQuantitySelected !== selectedPack.cantidadUnidades}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow transition disabled:opacity-50"
            >
              {isAdding ? 'Agregando...' : `Agregar pack al carrito por ${formatCurrency(selectedPack.precio)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPacks;
