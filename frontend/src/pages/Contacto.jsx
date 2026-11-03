import React from 'react';
import { FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import { HiMail } from 'react-icons/hi';
import { STORE, waMeUrl } from '../config/storeContact';
import usePageMeta from '../hooks/usePageMeta';

const cards = [
  {
    name: 'WhatsApp',
    hint: STORE.phoneDisplay,
    href: waMeUrl('Hola Aura Canela, te escribo desde la web 💕'),
    icon: FaWhatsapp,
    className: 'bg-green-500 hover:bg-green-400',
  },
  {
    name: 'Instagram',
    hint: '@auracanela.moda',
    href: STORE.instagram,
    icon: FaInstagram,
    className: 'bg-gradient-to-tr from-yellow-400 via-primary-600 to-purple-600 hover:opacity-90',
  },
  {
    name: 'TikTok',
    hint: '@auracanela.moda',
    href: STORE.tiktok,
    icon: FaTiktok,
    className: 'bg-ink hover:bg-ink-soft',
  },
  {
    name: 'Email',
    hint: STORE.email,
    href: `mailto:${STORE.email}`,
    icon: HiMail,
    className: 'bg-primary-600 hover:bg-primary-700',
  },
];

const Contacto = () => {
  usePageMeta({
    title: 'Contacto',
    description: 'Escribinos por WhatsApp, Instagram, TikTok o mail. Aura Canela.',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="text-center mb-12">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary-600 mb-3">
          Estamos para ayudarte
        </p>
        <h1 className="text-4xl sm:text-5xl font-black text-ink uppercase tracking-tight">
          Contacto
        </h1>
        <p className="text-gray-600 mt-4 max-w-xl mx-auto">
          Pedidos, talles y packs: escribinos por la red que más uses. Te respondemos a la brevedad.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {cards.map((card) => (
          <a
            key={card.name}
            href={card.href}
            target={card.href.startsWith('mailto:') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="group rounded-3xl bg-white border border-natural-dark p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-5"
          >
            <span
              className={`w-16 h-16 rounded-2xl text-white flex items-center justify-center flex-shrink-0 shadow-md ${card.className}`}
            >
              <card.icon size={28} />
            </span>
            <span className="min-w-0">
              <span className="block font-black text-ink uppercase tracking-wide text-lg group-hover:text-primary-600 transition-colors">
                {card.name}
              </span>
              <span className="block text-sm text-gray-500 truncate mt-0.5">{card.hint}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Contacto;
