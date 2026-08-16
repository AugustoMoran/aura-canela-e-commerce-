import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetProductsQuery, useGetCategoriesQuery } from '../services/productsApi';
import ProductCard from '../components/products/ProductCard';
import CategoryPacks from '../components/products/CategoryPacks';
import HomePacks from '../components/products/HomePacks';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import { HiAdjustments, HiX } from 'react-icons/hi';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'popular', label: 'Más vendidos' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoria = searchParams.get('categoria') || '';
  const search = searchParams.get('search') || '';
  const sort = SORT_OPTIONS.some((opt) => opt.value === searchParams.get('sort'))
    ? searchParams.get('sort')
    : 'newest';
  const filterKey = `${categoria}|${search}|${sort}`;

  const [page, setPage] = useState(1);
  const [pagesMap, setPagesMap] = useState({});
  const [activeKey, setActiveKey] = useState(filterKey);
  const [filtersOpen, setFiltersOpen] = useState(false);

  if (activeKey !== filterKey) {
    setActiveKey(filterKey);
    setPage(1);
    setPagesMap({});
  }

  const queryArgs = useMemo(() => {
    const args = { page, limit: 12, sort };
    if (categoria) args.categoria = categoria;
    if (search) args.search = search;
    return args;
  }, [page, categoria, search, sort]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
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
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="md:hidden flex items-center gap-2 btn-secondary text-sm"
        >
          <HiAdjustments size={16} />
          Filtros
        </button>
      </div>

      <div className="flex gap-6">
        <aside className={`w-56 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden md:block'}`}>
          <div className="card p-4 sticky top-20 space-y-5">
            <div>
              <h3 className="font-semibold text-sm mb-3">Ordenar por</h3>
              <div className="space-y-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFilter('sort', opt.value === 'newest' ? '' : opt.value)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sort === opt.value ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3">Categoría</h3>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => updateFilter('categoria', '')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
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
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        categoria === cat._id ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(categoria || search || (sort && sort !== 'newest')) && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full flex items-center gap-2 text-red-500 text-sm hover:text-red-700"
              >
                <HiX size={14} /> Limpiar filtros
              </button>
            )}
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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
