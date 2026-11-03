import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetCategoriesQuery } from '../../services/productsApi';
import {
  useGetPacksQuery,
  useCreatePackMutation,
  useUpdatePackMutation,
  useDeletePackMutation,
} from '../../services/packsApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { useUploadImageMutation } from '../../services/cartApi';

const PacksAdmin = () => {
  const { data: packsData, isLoading: loadingPacks } = useGetPacksQuery();
  const { data: categoriesData, isLoading: loadingCategories } = useGetCategoriesQuery();

  const [createPack, { isLoading: isCreating }] = useCreatePackMutation();
  const [updatePack, { isLoading: isUpdating }] = useUpdatePackMutation();
  const [deletePack, { isLoading: isDeleting }] = useDeletePackMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingPack, setEditingPack] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [uploadImage, { isLoading: uploading }] = useUploadImageMutation();
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    cantidadUnidades: '',
    precio: '',
    descripcion: '',
    imagen: { url: '', publicId: '' },
    activo: true,
  });

  const packs = packsData?.data || [];
  const categories = categoriesData || [];

  const handleOpenModal = (pack = null) => {
    if (pack) {
      setEditingPack(pack);
      setFormData({
        nombre: pack.nombre || '',
        categoria: pack.categoria?._id || pack.categoria || '',
        cantidadUnidades: pack.cantidadUnidades || '',
        precio: pack.precio || '',
        descripcion: pack.descripcion || '',
        imagen: pack.imagen || { url: '', publicId: '' },
        activo: pack.activo ?? true,
      });
    } else {
      setEditingPack(null);
      setFormData({
        nombre: '',
        categoria: categories[0]?._id || '',
        cantidadUnidades: '',
        precio: '',
        descripcion: '',
        imagen: { url: '', publicId: '' },
        activo: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPack(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.categoria) {
      setMessage({ type: 'error', text: 'Seleccione una categoría.' });
      return;
    }
    if (Number(formData.cantidadUnidades) <= 0) {
      setMessage({ type: 'error', text: 'La cantidad de unidades debe ser mayor a 0.' });
      return;
    }
    if (Number(formData.precio) <= 0) {
      setMessage({ type: 'error', text: 'El precio debe ser mayor a 0.' });
      return;
    }

    try {
      const payload = {
        nombre: formData.nombre,
        categoria: formData.categoria,
        cantidadUnidades: Number(formData.cantidadUnidades),
        precio: Number(formData.precio),
        descripcion: formData.descripcion,
        imagen: formData.imagen,
        activo: formData.activo,
      };

      if (editingPack) {
        await updatePack({ id: editingPack._id, ...payload }).unwrap();
        setMessage({ type: 'success', text: 'Pack actualizado exitosamente.' });
      } else {
        await createPack(payload).unwrap();
        setMessage({ type: 'success', text: 'Pack creado exitosamente.' });
      }

      handleCloseModal();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.data?.message || 'Error al guardar el pack.',
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este pack?')) return;
    try {
      await deletePack(id).unwrap();
      setMessage({ type: 'success', text: 'Pack eliminado correctamente.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.data?.message || 'Error al eliminar el pack.',
      });
    }
  };

  return (
    <AdminLayout title="Administración de Packs">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📦 Packs por Categoría</h2>
            <p className="text-sm text-gray-600">
              Gestione las promociones de venta por volumen para cada categoría.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow flex items-center gap-2"
          >
            <span>+ Nuevo Pack</span>
          </button>
        </div>

        {message.text && (
          <div
            className={`p-4 mb-6 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-primary-50 border border-primary-200 text-primary-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabla de Packs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingPacks || loadingCategories ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : packs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay packs registrados. Haga clic en "+ Nuevo Pack" para crear uno.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre Pack
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packs.map((pack) => (
                  <tr key={pack._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {pack.categoria?.nombre || 'Categoría no asignada'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {pack.nombre || `Pack de ${pack.cantidadUnidades} u.`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {pack.cantidadUnidades} unidades
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600 font-bold">
                      {formatCurrency(pack.precio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          pack.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-primary-100 text-primary-800'
                        }`}
                      >
                        {pack.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleOpenModal(pack)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(pack._id)}
                        disabled={isDeleting}
                        className="text-primary-600 hover:text-primary-800 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Formulario */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {editingPack ? 'Editar Pack' : 'Nuevo Pack de Categoría'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">-- Seleccione una categoría --</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Pack (opcional)
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Pack 6 unidades"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto del pack</label>
                  {formData.imagen?.url && (
                    <img src={formData.imagen.url} alt="" className="w-full h-40 object-cover rounded-lg mb-2" />
                  )}
                  <label className="btn-secondary inline-block cursor-pointer">
                    {uploading ? 'Subiendo...' : 'Subir imagen'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('image', file);
                        try {
                          const { url, publicId } = await uploadImage(fd).unwrap();
                          setFormData((prev) => ({ ...prev, imagen: { url, publicId } }));
                        } catch {
                          setMessage({ type: 'error', text: 'No se pudo subir la imagen' });
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad de Unidades *
                  </label>
                  <input
                    type="number"
                    name="cantidadUnidades"
                    value={formData.cantidadUnidades}
                    onChange={handleChange}
                    min="1"
                    required
                    placeholder="Ej: 6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio del Pack ($) *
                  </label>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="Ej: 18000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="activo-pack"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <label htmlFor="activo-pack" className="text-sm font-medium text-gray-700">
                    Pack Activo para Venta
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow disabled:opacity-50"
                  >
                    {isCreating || isUpdating ? 'Guardando...' : 'Guardar Pack'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PacksAdmin;
