import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetSiteSettingsQuery, useUpdateSiteSettingsMutation } from '../../services/siteSettingsApi';
import { toast } from 'react-hot-toast';

const SettingsAdmin = () => {
  const { data: settings, isLoading } = useGetSiteSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSiteSettingsMutation();

  const [formData, setFormData] = useState({
    announcementText: '',
    announcementActive: true,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        announcementText: settings.announcementText,
        announcementActive: settings.announcementActive,
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(formData).unwrap();
      toast.success('Configuraciones actualizadas');
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8 text-center text-primary-600 font-bold">Cargando configuraciones...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-natural-dark overflow-hidden">
          <div className="bg-primary-700 p-6">
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Configuración del Sitio</h2>
            <p className="text-primary-100 text-sm opacity-80">Personaliza elementos generales de la tienda</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Banner Scrolling Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-ink border-b border-natural-dark pb-2 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary-600 rounded-full"></span>
                Banner de Anuncio (Superior)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Texto del Anuncio</label>
                  <textarea
                    value={formData.announcementText}
                    onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                    className="w-full p-4 bg-natural/50 border border-natural-dark rounded-xl focus:ring-2 focus:ring-primary-600 outline-none min-h-[100px]"
                    placeholder="Ej: CLICK AQUÍ // Seguinos por redes..."
                  />
                  <p className="mt-2 text-xs text-gray-500 italic">Este texto se desplazará horizontalmente de derecha a izquierda.</p>
                </div>

                <div className="flex items-center gap-3 bg-natural/30 p-4 rounded-xl border border-natural-dark">
                  <input
                    type="checkbox"
                    id="announcementActive"
                    checked={formData.announcementActive}
                    onChange={(e) => setFormData({ ...formData, announcementActive: e.target.checked })}
                    className="w-5 h-5 accent-primary-600"
                  />
                  <label htmlFor="announcementActive" className="text-sm font-bold text-ink cursor-pointer">BANNER ACTIVO</label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-natural-dark">
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isUpdating ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsAdmin;
