import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetProductsQuery, useGetCategoriesQuery } from '../services/productsApi';
import ProductCard from '../components/products/ProductCard';
import CategoryPacks from '../components/products/CategoryPacks';
import HomePacks from '../components/products/HomePacks';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import { HiAdjustments, HiX } from 'react-icons/hi';
import usePageMeta from '../hooks/usePageMeta';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'popular', label: 'Más vendidos' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
];

const Products = () => {
  usePageMeta({ title: 'Productos', description: 'Catálogo Aura Canela. Filtrá por talle, color y categoría.' });
  const [searchParams, setSearchParams] = useSearchParams();
  const categoria = searchParams.get('categoria') || '';
  const search = searchParams.get('search') || '';
  const talla = searchParams.get('talla') || '';
  const color = searchParams.get('color') || '';
  const conStock = searchParams.get('conStock') === '1';
  const sort = SORT_OPTIONS.some((opt) => opt.value === searchParams.get('sort'))
    ? searchParams.get('sort')
    : 'newest';
  const filterKey = `${categoria}|${search}|${sort}|${talla}|${color}|${conStock}`;

  const [page, setPage] = useState(1);
  const [pagesMap, setPagesMap] = useState({});
  const [activeKey, setActiveKey] = useState(filterKey);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [categoria, talla, color, conStock ? '1' : '', sort !== 'newest' ? sort : ''].filter(Boolean).length;

  useEffect(() => {
    if (!filtersOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [filtersOpen]);

  if (activeKey !== filterKey) {
    setActiveKey(filterKey);
    setPage(1);
    setPagesMap({});
  }

  const queryArgs = useMemo(() => {
    const args = { page, limit: 12, sort };
    if (categoria) args.categoria = categoria;
    if (search) args.search = search;
    if (talla) args.talla = talla;
    if (color) args.color = color;
    if (conStock) args.conStock = true;
    return args;
  }, [page, categoria, search, sort, talla, color, conStock]);

  const { currentData: data, isFetching, isLoading } = useGetProductsQuery(queryArgs);
  const { data: categories = [] } = useGetCategoriesQuery();

  useEffect(() => {
    if (!data?.products || data.page !== page) return;
    setPagesMap((prev) => {
      if (page === 1) return { 1: data.products };
      if (prev[page]) return prev;
      return { ...prev, [page]: data.products };
    });
  }, [data, page, filterKey]);

  const allProducts = useMemo(
    () => Object.keys(pagesMap)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap((key) => pagesMap[key] || []),
    [pagesMap]
  );

  const totalPages = data?.pages || 1;
  const hasMore = page < totalPages;
  const selectedCategoryName = categories.find((c) => c._id === categoria)?.nombre;

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) setPage((p) => p + 1);
  }, [isFetching, hasMore]);

  const sentinelRef = useInfiniteScroll({ onVisible: loadMore, hasMore, loading: isFetching });

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (!value) params.delete(key);
    else params.set(key, value);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => setSearchParams({}, { replace: true });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-end justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {search
              ? `Resultados para "${search}"`
              : selectedCategoryName
                ? selectedCategoryName
                : 'Productos'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading && !data ? 'Cargando...' : `${data?.total ?? 0} productos encontrados`}
          </p>
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          className="md:hidden relative flex items-center gap-2 border-2 border-gray-900 text-gray-900 font-semibold px-3 py-2 rounded-xl text-sm shrink-0"
        >
          <HiAdjustments size={16} />
          Filtros
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-black h-5 min-w-5 px-1 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="md:flex md:gap-6">
        {filtersOpen && (
          <button
            type="button"
            className="md:hidden fixed inset-0 z-[60] bg-black/50"
            aria-label="Cerrar filtros"
            onClick={() => setFiltersOpen(false)}
          />
        )}
        <aside
          className={`${
            filtersOpen
              ? 'fixed inset-x-0 bottom-0 z-[70] flex max-h-[88vh] flex-col rounded-t-3xl bg-white shadow-2xl'
              : 'hidden'
          } md:static md:z-auto md:flex md:w-56 md:max-h-none md:flex-shrink-0 md:rounded-none md:bg-transparent md:shadow-none`}
        >
          <div className="md:hidden flex justify-center pt-2">
            <span className="h-1 w-10 rounded-full bg-gray-300" />
          </div>
          <div className="md:hidden flex items-center justify-between px-4 pt-2 pb-2 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Filtros</h2>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="p-2 -mr-2 text-gray-700"
              aria-label="Cerrar"
            >
              <HiX size={22} />
            </button>
          </div>
          <div className="bg-white p-4 pb-6 space-y-5 overflow-y-auto flex-1 min-h-0 md:sticky md:top-24 md:rounded-2xl md:shadow-md md:overflow-visible md:pb-4">
            <div>
              <h3 className="font-semibold text-sm mb-3">Ordenar por</h3>
              <div className="space-y-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFilter('sort', opt.value === 'newest' ? '' : opt.value)}
                    className={`w-full text-left px-3 py-2.5 md:py-1.5 rounded-lg text-sm transition-colors ${
                      sort === opt.value ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={conStock}
                  onChange={(e) => updateFilter('conStock', e.target.checked ? '1' : '')}
                />
                Solo con stock
              </label>
            </div>

            {(data?.filters?.tallas || []).length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Talle</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(data.filters.tallas).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateFilter('talla', talla === t ? '' : t)}
                      className={`px-3 py-2 rounded-lg text-sm font-bold border ${
                        talla === t ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(data?.filters?.colores || []).length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Color</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(data.filters.colores).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateFilter('color', color === c ? '' : c)}
                      className={`px-3 py-2 rounded-lg text-sm font-bold border ${
                        color === c ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {categories.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Categoría</h3>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => updateFilter('categoria', '')}
                    className={`w-full text-left px-3 py-2.5 md:py-1.5 rounded-lg text-sm transition-colors ${
                      !categoria ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => updateFilter('categoria', cat._id)}
                      className={`w-full text-left px-3 py-2.5 md:py-1.5 rounded-lg text-sm transition-colors ${
                        categoria === cat._id ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(categoria || search || talla || color || conStock || (sort && sort !== 'newest')) && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 text-primary-600 text-sm hover:text-primary-700 py-2"
              >
                <HiX size={14} /> Limpiar filtros
              </button>
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="md:hidden btn-primary w-full"
            >
              Ver productos
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {categoria ? (
            <CategoryPacks
              categoriaId={categoria}
              categoriaNombre={selectedCategoryName || 'Categoría'}
            />
          ) : (
            <HomePacks />
          )}

          {allProducts.length === 0 && !isFetching && !isLoading ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg mb-2">No hay productos</p>
              <p className="text-sm">Probá otra categoría o búsqueda</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                {allProducts.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
                {(isFetching || isLoading) &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={`sk-${i}`} className="card animate-pulse">
                      <div className="aspect-square bg-gray-200" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
              </div>
              <div ref={sentinelRef} className="h-4" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
