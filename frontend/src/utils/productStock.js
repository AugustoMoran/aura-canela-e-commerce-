export const usesVariants = (product) =>
  Boolean(product?.tallas?.habilitadas?.length || product?.colores?.length);

export const needsStockAssignment = (product) =>
  usesVariants(product) && !(product?.variantes?.length > 0);

export const variantStock = (product, talla, color) => {
  if (!usesVariants(product)) return Number(product?.stock) || 0;
  const match = (product?.variantes || []).find(
    (v) => (v.talla || '') === (talla || '') && (v.color || '') === (color || '')
  );
  return match ? Number(match.stock) || 0 : 0;
};

export const sellableStock = (product) => {
  if (needsStockAssignment(product)) return 0;
  if (product?.variantes?.length) {
    return product.variantes.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }
  return Number(product?.stock) || 0;
};
