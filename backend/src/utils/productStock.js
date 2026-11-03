const usesVariants = (product) =>
  Boolean(product?.tallas?.habilitadas?.length || product?.colores?.length);

const needsStockAssignment = (product) =>
  usesVariants(product) && !(product?.variantes?.length > 0);

const findVariant = (product, talla, color) => {
  if (!product?.variantes?.length) return null;
  return product.variantes.find(
    (v) => (v.talla || '') === (talla || '') && (v.color || '') === (color || '')
  );
};

const variantStock = (product, talla, color) => {
  if (!usesVariants(product)) return Number(product?.stock) || 0;
  const match = findVariant(product, talla, color);
  return match ? Number(match.stock) || 0 : 0;
};

const sellableStock = (product) => {
  if (needsStockAssignment(product)) return 0;
  if (product?.variantes?.length) {
    return product.variantes.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }
  return Number(product?.stock) || 0;
};

const syncStockFromVariants = (data) => {
  if (!data) return data;
  if (Array.isArray(data.variantes) && data.variantes.length > 0) {
    data.stock = data.variantes.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  } else if (usesVariants(data) && (!data.variantes || data.variantes.length === 0)) {
    // Keep legacy stock number in DB until the admin assigns the grid,
    // but public sellable stock is computed as 0.
  }
  return data;
};

const toPublicProduct = (product) => {
  if (!product) return product;
  const obj = typeof product.toObject === 'function' ? product.toObject() : { ...product };
  const anterior = needsStockAssignment(obj) ? Number(obj.stock) || 0 : 0;
  obj.stockAnterior = anterior;
  obj.stock = sellableStock(obj);
  obj.needsStockAssignment = needsStockAssignment(obj);
  return obj;
};

module.exports = {
  usesVariants,
  needsStockAssignment,
  findVariant,
  variantStock,
  sellableStock,
  syncStockFromVariants,
  toPublicProduct,
};
