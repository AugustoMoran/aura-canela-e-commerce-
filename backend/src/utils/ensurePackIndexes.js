const Pack = require('../models/Pack');

async function ensurePackIndexes() {
  let indexes;
  try {
    indexes = await Pack.collection.indexes();
  } catch (error) {
    if (error.codeName === 'NamespaceNotFound' || error.code === 26) return;
    throw error;
  }

  const legacy = indexes.find(
    (idx) => idx.unique && idx.key?.categoria === 1 && idx.key?.cantidadUnidades === 1
  );

  if (legacy) {
    await Pack.collection.dropIndex(legacy.name);
    console.log(`Índice único de packs eliminado: ${legacy.name}`);
  }

  await Pack.collection.createIndex(
    { categoria: 1, cantidadUnidades: 1 },
    { unique: false, name: 'categoria_1_cantidadUnidades_1' }
  );
}

module.exports = ensurePackIndexes;
