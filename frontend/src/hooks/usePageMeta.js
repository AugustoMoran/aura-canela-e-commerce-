import { useEffect } from 'react';

const DEFAULTS = {
  title: 'Aura Canela',
  description: 'Packs y prendas de Aura Canela. Comprá online, armá tu combinación y recibilo en casa.',
  image: '/logo.png',
};

const upsertMeta = (attr, key, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const usePageMeta = ({ title, description, image, url } = {}) => {
  useEffect(() => {
    const nextTitle = title ? `${title} | Aura Canela` : DEFAULTS.title;
    const nextDescription = description || DEFAULTS.description;
    const origin = window.location.origin;
    const nextImage = image
      ? (image.startsWith('http') ? image : `${origin}${image}`)
      : `${origin}${DEFAULTS.image}`;
    const nextUrl = url || window.location.href;

    document.title = nextTitle;
    upsertMeta('name', 'description', nextDescription);
    upsertMeta('property', 'og:title', nextTitle);
    upsertMeta('property', 'og:description', nextDescription);
    upsertMeta('property', 'og:image', nextImage);
    upsertMeta('property', 'og:url', nextUrl);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
  }, [title, description, image, url]);
};

export default usePageMeta;
