const Pack = require('../models/Pack');
const Category = require('../models/Category');

const createPack = async ({ categoria, cantidadUnidades, precio, nombre, activo, descripcion, imagen }) => {
  if (!categoria) throw new Error('Debe especificar una categoría.');
  if (!cantidadUnidades || cantidadUnidades <= 0) {
    throw new Error('La cantidad de unidades debe ser mayor a 0.');
  }
  if (!precio || precio <= 0) {
    throw new Error('El precio debe ser mayor a 0.');
  }

  const categoryExists = await Category.findById(categoria);
  if (!categoryExists) throw new Error('La categoría especificada no existe.');

  // Validar no duplicar packs con la misma cantidad dentro de una categoría
  const existingPack = await Pack.findOne({ categoria, cantidadUnidades });
  if (existingPack) {
    throw new Error(`Ya existe un pack de ${cantidadUnidades} unidades para la categoría seleccionada.`);
  }

  const pack = await Pack.create({
    nombre: nombre || `Pack de ${cantidadUnidades} unidades`,
    categoria,
    cantidadUnidades,
    precio,
    descripcion: descripcion || '',
    imagen: imagen || { url: '', publicId: '' },
    activo: activo !== undefined ? activo : true,
  });

  return pack;
};

const getPacks = async (queryFilters = {}) => {
  const filter = {};

  if (queryFilters.categoria) {
    filter.categoria = queryFilters.categoria;
  }
  if (queryFilters.activo !== undefined) {
    filter.activo = queryFilters.activo === 'true' || queryFilters.activo === true;
  }

  const packs = await Pack.find(filter)
    .populate('categoria', 'nombre imagen')
    .sort({ cantidadUnidades: 1 });

  return packs;
};

const getPackById = async (id) => {
  const pack = await Pack.findById(id).populate('categoria', 'nombre imagen');
  if (!pack) throw new Error('Pack no encontrado.');
  return pack;
};

const updatePack = async (id, updateData) => {
  const pack = await Pack.findById(id);
  if (!pack) throw new Error('Pack no encontrado.');

  if (updateData.cantidadUnidades && updateData.cantidadUnidades <= 0) {
    throw new Error('La cantidad de unidades debe ser mayor a 0.');
  }
  if (updateData.precio && updateData.precio <= 0) {
    throw new Error('El precio debe ser mayor a 0.');
  }

  const targetCategory = updateData.categoria || pack.categoria;
  const targetCantidad = updateData.cantidadUnidades || pack.cantidadUnidades;

  // Si cambia categoría o cantidad de unidades, validar duplicado
  if (
    targetCategory.toString() !== pack.categoria.toString() ||
    targetCantidad !== pack.cantidadUnidades
  ) {
    const duplicate = await Pack.findOne({
      _id: { $ne: id },
      categoria: targetCategory,
      cantidadUnidades: targetCantidad,
    });
    if (duplicate) {
      throw new Error(`Ya existe un pack de ${targetCantidad} unidades para esa categoría.`);
    }
  }

  Object.assign(pack, updateData);
  await pack.save();
  return pack;
};

const deletePack = async (id) => {
  const pack = await Pack.findById(id);
  if (!pack) throw new Error('Pack no encontrado.');

  await Pack.findByIdAndDelete(id);
  return { message: 'Pack eliminado correctamente.' };
};

const getPacksByCategory = async (categoriaId) => {
  const packs = await Pack.find({
    categoria: categoriaId,
    activo: true,
  }).sort({ cantidadUnidades: 1 });

  return packs;
};

module.exports = {
  createPack,
  getPacks,
  getPackById,
  updatePack,
  deletePack,
  getPacksByCategory,
};
