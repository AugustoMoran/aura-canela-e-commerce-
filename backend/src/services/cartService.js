const Cart = require('../models/Cart');
const { toPublicProduct } = require('../utils/productStock');

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
    // Solo packs: la venta unitaria está deshabilitada
    if (item.isPack && item.packInfo) {
      cart.items.push({
        isPack: true,
        cantidad: 1,
        packInfo: item.packInfo,
      });
    }
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

  throw Object.assign(
    new Error('Los productos solo se venden por pack. Armá un pack para agregarlo al carrito.'),
    { statusCode: 400 }
  );
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
