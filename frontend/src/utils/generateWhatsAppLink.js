import { STORE, waMeUrl } from '../config/storeContact';
import { formatCurrency } from './formatCurrency';

export const generateWhatsAppLink = (items, total, phone) => {
  const lines = (items || []).map((item) => {
    if (item.isPack) {
      const packName = item.packInfo?.nombrePack || 'Pack';
      const inner = (item.packInfo?.productosSeleccionados || [])
        .map((p) => `  • ${p.cantidad}x ${p.nombre}${p.talla ? ` (${p.talla})` : ''}${p.color ? ` ${p.color}` : ''}`)
        .join('\n');
      return `• ${packName}\n${inner}`;
    }
    const nombre = item.producto?.nombre || item.nombre || 'Producto';
    const extra = [item.talla, item.color].filter(Boolean).join(' · ');
    return `• ${item.cantidad}x ${nombre}${extra ? ` (${extra})` : ''}`;
  });

  const message = [
    `Hola ${STORE.name} 💕`,
    'Quiero hacer este pedido:',
    '',
    ...lines,
    '',
    `Total: ${formatCurrency(total || 0)}`,
  ].join('\n');

  if (phone) return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  return waMeUrl(message);
};
