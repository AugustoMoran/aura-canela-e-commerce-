const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { variantStock, toPublicProduct } = require('../utils/productStock');

const sellsByUnit = (product) =>
  Boolean(product?.ventaPorUnidad) && Number(product?.precio) > 0;

const getCart = async (userId) => {
  const cart = await Cart.findOne({ usuario: userId }).populate({
    path: 'items.producto',
    select: 'nombre precio precioOferta imagenes stock isActive tallas colores variantes categoria',
  });
  if (!cart) return { items: [] };
  const obj = cart.toObject();
  obj.items = obj.items.map((item) => ({
    ...item,
    producto: item.producto ? toPublicProduct(item.producto) : item.producto,
  }));
  return obj;
};

const syncCart = async (userId, items) => {
  let cart = await Cart.findOne({ usuario: userId });
  if (!cart) {
    cart = new Cart({ usuario: userId, items: [] });
  }

  cart.items = [];
  for (const item of items) {
    if (item.isPack && item.packInfo) {
      cart.items.push({
        isPack: true,
        cantidad: 1,
        packInfo: item.packInfo,
      });
      continue;
    }

    const product = await Product.findOne({ _id: item.producto, isActive: true });
    if (!product || !sellsByUnit(product)) continue;
    const available = variantStock(product, item.talla, item.color);
    if (available <= 0) continue;
    cart.items.push({
      producto: item.producto,
      cantidad: Math.min(item.cantidad, available),
      talla: item.talla || null,
      color: item.color || null,
    });
  }

  await cart.save();
  return getCart(userId);
};

const addToCart = async (userId, productoId, cantidad = 1, talla, color, packPayload = null) => {
  if (packPayload?.isPack && packPayload.packInfo) {
    let cart = await Cart.findOne({ usuario: userId });
    if (!cart) cart = new Cart({ usuario: userId, items: [] });
    cart.items.push({
      isPack: true,
      cantidad: 1,
      packInfo: packPayload.packInfo,
    });
    await cart.save();
    return getCart(userId);
  }

  talla = talla || null;
  color = color || null;

  const product = await Product.findOne({ _id: productoId, isActive: true });
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  if (!sellsByUnit(product)) {
    throw Object.assign(
      new Error('Este producto solo se vende por pack. Publicá la venta por unidad para venderlo suelto.'),
      { statusCode: 400 }
    );
  }

  if (product.tallas?.habilitadas?.length > 0 && talla) {
    if (!product.tallas.habilitadas.includes(talla)) {
      throw Object.assign(new Error('Talla no disponible.'), { statusCode: 400 });
    }
  }

  if (product.colores?.length > 0 && color) {
    const colorDisponible = product.colores.find((c) => c.nombre === color || c.codigo === color);
    if (!colorDisponible || !colorDisponible.habilitado) {
      throw Object.assign(new Error('Color no disponible.'), { statusCode: 400 });
    }
  }

  let cart = await Cart.findOne({ usuario: userId });
  if (!cart) cart = new Cart({ usuario: userId, items: [] });

  const existing = cart.items.find(
    (i) =>
      !i.isPack &&
      i.producto &&
      i.producto.toString() === productoId.toString() &&
      i.talla === talla &&
      i.color === color
  );

  const available = variantStock(product, talla, color);
  if (available <= 0) {
    throw Object.assign(new Error('Sin stock para esa talla y color.'), { statusCode: 400 });
  }

  if (existing) {
    existing.cantidad = Math.min(existing.cantidad + cantidad, available);
  } else {
    cart.items.push({
      producto: productoId,
      cantidad: Math.min(cantidad, available),
      talla,
      color,
    });
  }

  await cart.save();
  return getCart(userId);
};

const updateCartItem = async (userId, productoId, cantidad, talla, color) => {
  // Normalizar null/undefined
  talla = talla || null;
  color = color || null;
  
  const cart = await Cart.findOne({ usuario: userId });
  if (!cart) throw Object.assign(new Error('Carrito no encontrado.'), { statusCode: 404 });

  const item = cart.items.find(
    (i) =>
      !i.isPack &&
      i.producto &&
      i.producto.toString() === productoId.toString() &&
      i.talla === talla &&
      i.color === color
  );
  if (!item) throw Object.assign(new Error('Item no encontrado.'), { statusCode: 404 });

  if (cantidad <= 0) {
    cart.items = cart.items.filter(
      (i) =>
        !(
          !i.isPack &&
          i.producto &&
          i.producto.toString() === productoId.toString() &&
          i.talla === talla &&
          i.color === color
        )
    );
  } else {
    item.cantidad = cantidad;
  }

  await cart.save();
  return getCart(userId);
};

const removeFromCart = async (userId, productoId, talla, color) => {
  // Normalizar null/undefined
  talla = talla || null;
  color = color || null;
  
  const cart = await Cart.findOne({ usuario: userId });
  if (!cart) return { items: [] };

  cart.items = cart.items.filter((i) => {
    if (i.isPack) {
      return i.packInfo?.packId?.toString() !== productoId;
    }
    if (!i.producto) return true;
    return !(i.producto.toString() === productoId && i.talla === talla && i.color === color);
  });
  
  await cart.save();
  return getCart(userId);
};

const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ usuario: userId }, { items: [] });
};

module.exports = { getCart, syncCart, addToCart, updateCartItem, removeFromCart, clearCart };
