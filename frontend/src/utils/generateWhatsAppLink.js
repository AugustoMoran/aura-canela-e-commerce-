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

export const buildTransferReceiptMessage = ({ codigo, total, alias, titular, cbu }) => {
  const lines = [
    `Hola ${STORE.name}, ya realicé la transferencia de mi pedido.`,
    '',
    `Número de pedido: ${codigo}`,
    `Importe transferido: ${formatCurrency(total || 0)}`,
    `Alias: ${alias}`,
  ];
  if (titular) lines.push(`Titular: ${titular}`);
  if (cbu) lines.push(`CBU/CVU: ${cbu}`);
  lines.push('', 'Adjunto el comprobante de la transferencia.');
  return lines.join('\n');
};
