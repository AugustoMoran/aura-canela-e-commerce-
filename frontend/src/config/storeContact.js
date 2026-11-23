const trimEnv = (value) => (typeof value === 'string' ? value.trim() : '');

export const STORE = {
  name: trimEnv(import.meta.env.VITE_STORE_NAME) || 'Aura Canela',
  whatsapp: trimEnv(import.meta.env.VITE_WHATSAPP_NUMBER) || '5491159354045',
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
