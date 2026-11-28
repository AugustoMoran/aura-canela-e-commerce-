import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetSiteSettingsQuery, useUpdateSiteSettingsMutation } from '../../services/siteSettingsApi';
import { toast } from 'react-hot-toast';

const EMPTY = {
  transferenciaActiva: false,
  transferenciaAlias: '',
  transferenciaTitular: '',
  transferenciaCbu: '',
  transferenciaDescuento: 0,
};

const TransferAdmin = () => {
  const { data: settings, isLoading } = useGetSiteSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSiteSettingsMutation();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!settings) return;
    setForm({
      transferenciaActiva: Boolean(settings.transferenciaActiva),
      transferenciaAlias: settings.transferenciaAlias || '',
      transferenciaTitular: settings.transferenciaTitular || '',
      transferenciaCbu: settings.transferenciaCbu || '',
      transferenciaDescuento: Number(settings.transferenciaDescuento) || 0,
    });
  }, [settings]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const alias = form.transferenciaAlias.trim();
    const descuento = Math.min(100, Math.max(0, Number(form.transferenciaDescuento) || 0));
    if (form.transferenciaActiva && !alias) {
      toast.error('Cargá el alias para activar la transferencia');
      return;
    }
    try {
      await updateSettings({
        ...form,
        transferenciaAlias: alias,
        transferenciaTitular: form.transferenciaTitular.trim(),
        transferenciaCbu: form.transferenciaCbu.trim(),
        transferenciaDescuento: descuento,
      }).unwrap();
      toast.success('Pago por transferencia actualizado');
    } catch {
      toast.error('No se pudo guardar');
    }
  };

  if (isLoading) {
    return <AdminLayout title="Transferencias"><div className="p-8 text-center text-primary-600 font-bold">Cargando...</div></AdminLayout>;
  }

  return (
    <AdminLayout title="Transferencias">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-natural-dark overflow-hidden">
          <div className="bg-primary-700 p-6">
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Pago por transferencia</h2>
            <p className="text-primary-100 text-sm mt-1">
              El alias y el descuento se muestran en el checkout. El pedido se crea al confirmar y queda pendiente hasta que verifiques el comprobante.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <label className="flex items-center gap-3 bg-natural/30 p-4 rounded-xl border border-natural-dark cursor-pointer">
              <input
                type="checkbox"
                checked={form.transferenciaActiva}
                onChange={(e) => set('transferenciaActiva', e.target.checked)}
                className="w-5 h-5 accent-primary-600"
              />
              <span className="text-sm font-bold text-ink">Mostrar esta opción en el checkout</span>
            </label>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Alias</label>
              <input
                value={form.transferenciaAlias}
                onChange={(e) => set('transferenciaAlias', e.target.value)}
                className="input-field"
                placeholder="auracanela.mp"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Titular</label>
                <input
                  value={form.transferenciaTitular}
                  onChange={(e) => set('transferenciaTitular', e.target.value)}
                  className="input-field"
                  placeholder="Aura Canela"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">CBU / CVU</label>
                <input
                  value={form.transferenciaCbu}
                  onChange={(e) => set('transferenciaCbu', e.target.value)}
                  className="input-field"
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Descuento sobre los productos (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.transferenciaDescuento}
                onChange={(e) => set('transferenciaDescuento', e.target.value)}
                className="input-field max-w-[160px]"
              />
              <p className="mt-2 text-xs text-gray-500">
                Se aplica al subtotal de productos, después del cupón. El envío no entra en el descuento.
              </p>
            </div>

            <div className="rounded-xl bg-natural/40 border border-natural-dark p-4 text-sm text-gray-700">
              <p className="font-bold text-ink mb-1">Así lo ve el cliente</p>
              <p>
                Transferencia bancaria
                {Number(form.transferenciaDescuento) > 0 ? ` · ${Number(form.transferenciaDescuento)}% de descuento` : ''}
              </p>
              <p className="mt-1">Alias: {form.transferenciaAlias.trim() || '— todavía sin alias —'}</p>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50"
            >
              {isUpdating ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TransferAdmin;
