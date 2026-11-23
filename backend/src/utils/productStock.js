const usesVariants = (product) =>
  Boolean(product?.tallas?.habilitadas?.length || product?.colores?.length);

/** True when the product has a real stock grid assigned */
const hasVariantGrid = (product) => Boolean(product?.variantes?.length);

const needsStockAssignment = (product) =>
  usesVariants(product) && !hasVariantGrid(product);

const findVariant = (product, talla, color) => {
  if (!hasVariantGrid(product)) return null;
  return product.variantes.find(
    (v) => (v.talla || '') === (talla || '') && (v.color || '') === (color || '')
  );
};

const variantStock = (product, talla, color) => {
  // Sin grilla aún: usar stock total legacy (productos viejos siguen vendibles)
  if (!hasVariantGrid(product)) return Number(product?.stock) || 0;
  const match = findVariant(product, talla, color);
  if (match) return Number(match.stock) || 0;

  const gridTotal = product.variantes.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  if (gridTotal === 0 && (Number(product?.stock) || 0) > 0) {
    return Number(product.stock) || 0;
  }
  return 0;
};

const sellableStock = (product) => {
  if (hasVariantGrid(product)) {
    const gridTotal = product.variantes.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    if (gridTotal > 0) return gridTotal;
    return Number(product?.stock) || 0;
  }
  return Number(product?.stock) || 0;
};

const syncStockFromVariants = (data) => {
  if (!data) return data;
  if (Array.isArray(data.variantes) && data.variantes.length > 0) {
    data.stock = data.variantes.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
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
  hasVariantGrid,
  needsStockAssignment,
  findVariant,
  variantStock,
  sellableStock,
  syncStockFromVariants,
  toPublicProduct,
};
