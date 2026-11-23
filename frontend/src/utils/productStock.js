export const usesVariants = (product) =>
  Boolean(product?.tallas?.habilitadas?.length || product?.colores?.length);

/** True when the product has a real stock grid assigned */
export const hasVariantGrid = (product) => Boolean(product?.variantes?.length);

export const needsStockAssignment = (product) =>
  usesVariants(product) && !hasVariantGrid(product);

export const findVariant = (product, talla, color) => {
  if (!hasVariantGrid(product)) return null;
  return product.variantes.find(
    (v) => (v.talla || '') === (talla || '') && (v.color || '') === (color || '')
  );
};

export const variantStock = (product, talla, color) => {
  // Sin grilla aún: usar stock total (productos con talle/color pero stock único)
  if (!hasVariantGrid(product)) return Number(product?.stock) || 0;

  const match = findVariant(product, talla, color);
  if (match) return Number(match.stock) || 0;

  // Grilla toda en 0 pero hay stock total residual → permitir vender con el total
  const gridTotal = product.variantes.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  if (gridTotal === 0 && (Number(product?.stock) || 0) > 0) {
    return Number(product.stock) || 0;
  }

  return 0;
};

export const sellableStock = (product) => {
  if (hasVariantGrid(product)) {
    const gridTotal = product.variantes.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    if (gridTotal > 0) return gridTotal;
    // Grilla vacía: no tapar un stock total que sí existe
    return Number(product?.stock) || 0;
  }
  return Number(product?.stock) || 0;
};
