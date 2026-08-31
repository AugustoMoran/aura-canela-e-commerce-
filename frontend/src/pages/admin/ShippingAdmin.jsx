import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetShippingConfigQuery,
  useUpdateShippingConfigMutation,
} from '../../services/shippingApi';

const ShippingAdmin = () => {
  const { data, isLoading } = useGetShippingConfigQuery();
  const [updateShippingConfig, { isLoading: isSaving }] = useUpdateShippingConfigMutation();

  const [formData, setFormData] = useState({
    activo: true,
    usuario: '',
    passwordOrToken: '',
    ambiente: 'sandbox',
    codigoPostalOrigen: '',
    direccionOrigen: '',
    localidad: '',
    provincia: '',
    nombreRemitente: '',
    emailRemitente: '',
    telefonoRemitente: '',
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (data?.data) {
      setFormData({
        activo: data.data.activo ?? true,
        usuario: data.data.usuario || '',
        passwordOrToken: data.data.passwordOrToken || '',
        ambiente: data.data.ambiente || 'sandbox',
        codigoPostalOrigen: data.data.codigoPostalOrigen || '',
        direccionOrigen: data.data.direccionOrigen || '',
        localidad: data.data.localidad || '',
        provincia: data.data.provincia || '',
        nombreRemitente: data.data.nombreRemitente || '',
        emailRemitente: data.data.emailRemitente || '',
        telefonoRemitente: data.data.telefonoRemitente || '',
      });
    }
  }, [data]);

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
    try {
      await updateShippingConfig(formData).unwrap();
      setMessage({ type: 'success', text: 'Configuración de Correo Argentino guardada exitosamente.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.data?.message || 'Error al guardar la configuración.',
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Configuración de Envíos">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configuración > Correo Argentino">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          🚚 Configuración de Logística y Envíos (Correo Argentino)
        </h2>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="activo" className="font-semibold text-gray-800 cursor-pointer">
              Habilitar cálculo y envíos automáticos con Correo Argentino
            </label>
          </div>

          {/* Credenciales */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">API y Autenticación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario API</label>
                <input
                  type="text"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleChange}
                  placeholder="Usuario MiCorreo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña / Token API
                </label>
                <input
                  type="password"
                  name="passwordOrToken"
                  value={formData.passwordOrToken}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entorno API</label>
                <select
                  name="ambiente"
                  value={formData.ambiente}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="sandbox">Pruebas / Sandbox (Desarrollo)</option>
                  <option value="produccion">Producción (Operación Real)</option>
                </select>
                <span className="text-xs text-gray-500 mt-1 block">
                  En Sandbox las pruebas no generan cargos reales.
                </span>
              </div>
            </div>
          </div>

          {/* Origen y Remitente */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-lg text-gray-700">Datos de Origen y Remitente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal Origen *
                </label>
                <input
                  type="text"
                  name="codigoPostalOrigen"
                  value={formData.codigoPostalOrigen}
                  onChange={handleChange}
                  placeholder="Ej: 1000"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Origen *
                </label>
                <input
                  type="text"
                  name="direccionOrigen"
                  value={formData.direccionOrigen}
                  onChange={handleChange}
                  placeholder="Calle y Número"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localidad *</label>
                <input
                  type="text"
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleChange}
                  placeholder="Localidad"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
                <input
                  type="text"
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleChange}
                  placeholder="Provincia"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Remitente *
                </label>
                <input
                  type="text"
                  name="nombreRemitente"
                  value={formData.nombreRemitente}
                  onChange={handleChange}
                  placeholder="Nombre de la Tienda"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Remitente *</label>
                <input
                  type="email"
                  name="emailRemitente"
                  value={formData.emailRemitente}
                  onChange={handleChange}
                  placeholder="contacto@tienda.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono Remitente *
                </label>
                <input
                  type="text"
                  name="telefonoRemitente"
                  value={formData.telefonoRemitente}
                  onChange={handleChange}
                  placeholder="1112345678"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ShippingAdmin;
