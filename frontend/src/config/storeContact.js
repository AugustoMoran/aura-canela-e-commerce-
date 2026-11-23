const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');

/** Normaliza a formato wa.me (Argentina): 549 + área + número */
export const normalizeWhatsApp = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '5491159354045';
  if (digits.startsWith('54')) return digits;
  if (digits.length === 10 && digits.startsWith('11')) return `549${digits}`;
  if (digits.length === 11 && digits.startsWith('911')) return `54${digits}`;
  return digits;
};

const WHATSAPP_DEFAULT = '5491159354045';

export const STORE = {
  name: trimEnv(import.meta.env.VITE_STORE_NAME) || 'Aura Canela',
  whatsapp: normalizeWhatsApp(
    trimEnv(import.meta.env.VITE_WHATSAPP_NUMBER) || WHATSAPP_DEFAULT
  ),
  instagram:
    trimEnv(import.meta.env.VITE_INSTAGRAM_URL) || 'https://www.instagram.com/auracanela.moda/',
  tiktok:
    trimEnv(import.meta.env.VITE_TIKTOK_URL) || 'https://www.tiktok.com/@auracanela.moda',
  email: trimEnv(import.meta.env.VITE_CONTACT_EMAIL) || 'contactoauracanela@gmail.com',
  phoneDisplay: '11 5935-4045',
  address:
    trimEnv(import.meta.env.VITE_STORE_ADDRESS) ||
    '25 de Mayo 136, Local 4, Galería Ciudad, Morón, Buenos Aires',
  addressShort:
    trimEnv(import.meta.env.VITE_STORE_ADDRESS_SHORT) ||
    '25 de Mayo 136, Local 4 — Galería Ciudad, Morón',
  mapsUrl:
    trimEnv(import.meta.env.VITE_STORE_MAPS_URL) ||
    'https://www.google.com/maps/search/?api=1&query=25+de+Mayo+136+Galeria+Ciudad+Moron+Buenos+Aires',
};

export const waMeUrl = (text) => {
  const base = `https://wa.me/${STORE.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};
