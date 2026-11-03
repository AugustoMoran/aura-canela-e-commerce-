const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const { cloudinary } = require('../config/cloudinary');
const { toPublicProduct, syncStockFromVariants } = require('../utils/productStock');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const inStockClause = {
  $or: [
    { 'variantes.stock': { $gt: 0 } },
    {
      $and: [
        { $or: [{ variantes: { $exists: false } }, { variantes: { $size: 0 } }] },
        { $or: [{ 'tallas.habilitadas': { $size: 0 } }, { 'tallas.habilitadas.0': { $exists: false } }] },
        { $or: [{ colores: { $size: 0 } }, { 'colores.0': { $exists: false } }] },
        { stock: { $gt: 0 } },
      ],
    },
  ],
};

const getProducts = async ({ page = 1, limit = 12, categoria, search, sort, sinStock, talla, color, conStock }) => {
  const cleanPage = Math.max(1, parseInt(page, 10) || 1);
  const cleanLimit = Math.max(1, Math.min(parseInt(limit, 10) || 12, 100));
  const cleanCategoria = typeof categoria === 'string' ? categoria.trim() : '';
  const cleanSearch = typeof search === 'string' ? search.trim() : '';
  const cleanSort = typeof sort === 'string' ? sort.trim() : 'newest';
  const cleanSinStock = sinStock === 'true' || sinStock === true;
  const cleanConStock = conStock === 'true' || conStock === true;
  const cleanTalla = typeof talla === 'string' ? talla.trim() : '';
  const cleanColor = typeof color === 'string' ? color.trim() : '';

  const query = { isActive: true, deletedAt: null };

  if (cleanCategoria && !['todas', 'null', 'undefined'].includes(cleanCategoria.toLowerCase())) {
    const isId = mongoose.Types.ObjectId.isValid(cleanCategoria) && String(new mongoose.Types.ObjectId(cleanCategoria)) === cleanCategoria;
    if (isId) {
      query.categoria = cleanCategoria;
    } else {
      const cat = await Category.findOne({
        nombre: { $regex: `^${escapeRegex(cleanCategoria)}$`, $options: 'i' },
        isActive: true,
      }).select('_id');
      query.categoria = cat?._id || new mongoose.Types.ObjectId();
    }
  }

  if (cleanSearch.length >= 2) {
    const rx = { $regex: escapeRegex(cleanSearch), $options: 'i' };
    query.$or = [{ nombre: rx }, { descripcion: rx }, { tags: rx }];
  }

  if (cleanSinStock) {
    query.stock = { $lte: 0 };
  }

  if (cleanConStock) {
    query.$and = (query.$and || []).concat([inStockClause]);
  }

  if (cleanTalla) {
    query.$and = (query.$and || []).concat([
      {
        $or: [
          { 'variantes': { $elemMatch: { talla: cleanTalla, stock: { $gt: 0 } } } },
          { 'tallas.habilitadas': cleanTalla },
        ],
      },
    ]);
  }

  if (cleanColor) {
    query.$and = (query.$and || []).concat([
      {
        $or: [
          { 'variantes': { $elemMatch: { color: cleanColor, stock: { $gt: 0 } } } },
          { 'colores.nombre': cleanColor },
        ],
      },
    ]);
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { precio: 1 },
    'price-desc': { precio: -1 },
    popular: { vendidos: -1, createdAt: -1 },
  };
  const sortBy = sortOptions[cleanSort] || sortOptions.newest;

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('categoria', 'nombre')
    .sort(sortBy)
    .skip((cleanPage - 1) * cleanLimit)
    .limit(cleanLimit)
    .lean();

  const filterBase = { isActive: true, deletedAt: null };
  if (query.categoria) filterBase.categoria = query.categoria;

  const [tallaVals, colorVals] = await Promise.all([
    Product.distinct('tallas.habilitadas', filterBase),
    Product.distinct('colores.nombre', { ...filterBase, 'colores.habilitado': { $ne: false } }),
  ]);

  return {
    products: products.map(toPublicProduct),
    page: cleanPage,
    pages: Math.max(1, Math.ceil(total / cleanLimit) || 1),
    total,
    filters: {
      tallas: (tallaVals || []).filter(Boolean).sort(),
      colores: (colorVals || []).filter(Boolean).sort(),
    },
  };
};

const getProductById = async (id) => {
  const product = await Product.findOne({ _id: id, isActive: true }).populate('categoria', 'nombre');
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  return toPublicProduct(product);
};

const getRelatedProducts = async (productId, categoriaId, limit = 4) => {
  const related = await Product.find({
    _id: { $ne: productId },
    categoria: categoriaId,
    isActive: true,
  })
    .limit(limit)
    .lean();
  return related.map(toPublicProduct);
};

const sanitizeProductData = (data) => {
  const clean = { ...data };
  if (!clean.categoria) delete clean.categoria;
  if (!clean.descripcion) clean.descripcion = '';
  if (!clean.precioOferta) clean.precioOferta = null;
  if (Array.isArray(clean.variantes)) {
    clean.variantes = clean.variantes.map((v) => ({
      talla: v.talla || '',
      color: v.color || '',
      stock: Math.max(0, Number(v.stock) || 0),
    }));
  }
  syncStockFromVariants(clean);
  return clean;
};

const createProduct = async (data) => {
  const product = await Product.create(sanitizeProductData(data));
  return product;
};

const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, sanitizeProductData(data), { new: true, runValidators: true });
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });

  // Delete images and videos from Cloudinary
  for (const img of product.imagenes) {
    await cloudinary.uploader.destroy(img.publicId).catch(() => {});
  }
  for (const vid of product.videos) {
    await cloudinary.uploader.destroy(vid.publicId, { resource_type: 'video' }).catch(() => {});
  }

  await product.softDelete();
};

const addProductImage = async (productId, url, publicId) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  if (product.imagenes.length >= 7) {
    throw Object.assign(new Error('Máximo 7 imágenes por producto.'), { statusCode: 400 });
  }
  product.imagenes.push({ url, publicId });
  return product.save();
};

const removeProductImage = async (productId, publicId) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });

  await cloudinary.uploader.destroy(publicId);
  product.imagenes = product.imagenes.filter((img) => img.publicId !== publicId);
  return product.save();
};

const addProductVideo = async (productId, url, publicId) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });
  if (product.videos.length >= 3) {
    throw Object.assign(new Error('Máximo 3 videos por producto.'), { statusCode: 400 });
  }
  product.videos.push({ url, publicId });
  return product.save();
};

const removeProductVideo = async (productId, publicId) => {
  const product = await Product.findById(productId);
  if (!product) throw Object.assign(new Error('Producto no encontrado.'), { statusCode: 404 });

  await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  product.videos = product.videos.filter((vid) => vid.publicId !== publicId);
  return product.save();
};

const getSuggestions = async (q, limit = 10) => {
  if (!q || q.trim().length === 0) return [];
  
  const query = q.trim().toLowerCase();
  const suggestions = await Product.find({
    isActive: true,
    $or: [
      { nombre: { $regex: `^${query}`, $options: 'i' } },
      { nombre: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ],
  })
    .select('_id nombre precio precioOferta imagenes')
    .limit(limit)
    .lean();
  
  return suggestions;
};

module.exports = {
  getProducts,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  removeProductImage,
  addProductVideo,
  removeProductVideo,
  getSuggestions,
};
