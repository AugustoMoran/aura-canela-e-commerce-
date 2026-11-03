import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { HiMail, HiPhone } from 'react-icons/hi';
import { STORE, waMeUrl } from '../../config/storeContact';

const Footer = () => (
  <footer className="bg-natural text-ink mt-16 border-t border-natural-dark">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 text-center md:text-left">
          <div className="flex justify-center md:justify-start items-center gap-3 mb-6">
            <img src="/logo.png" alt="Aura Canela Logo" className="h-32 w-auto" />
          </div>
          <p className="text-xl font-black text-ink tracking-widest mb-6 uppercase">
            {STORE.name}
          </p>
          <div className="flex justify-center md:justify-start gap-4">
            <a
              href={waMeUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 transition-all transform hover:scale-110 shadow-md"
              aria-label="WhatsApp"
            >
              <FaWhatsapp size={24} className="text-white" />
            </a>
            <a
              href={STORE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-full flex items-center justify-center hover:opacity-90 transition-all transform hover:scale-110 shadow-md"
              aria-label="Instagram"
            >
              <FaInstagram size={24} className="text-white" />
            </a>
            <a
              href={STORE.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-ink rounded-full flex items-center justify-center hover:bg-ink-soft transition-all transform hover:scale-110 shadow-md"
              aria-label="TikTok"
            >
              <FaTiktok size={24} className="text-white" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-black text-primary-600 uppercase text-xs tracking-widest mb-6">Tienda</h3>
          <ul className="space-y-3 text-sm font-bold">
            <li><Link to="/productos" className="hover:text-primary-600 transition-colors">Productos</Link></li>
            <li><Link to="/#packs" className="hover:text-primary-600 transition-colors">Packs</Link></li>
            <li><Link to="/pedido" className="hover:text-primary-600 transition-colors">Seguí tu pedido</Link></li>
            <li><Link to="/contacto" className="hover:text-primary-600 transition-colors">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-black text-primary-600 uppercase text-xs tracking-widest mb-6">Contacto</h3>
          <ul className="space-y-3 text-sm font-bold">
            <li>
              <a href={`mailto:${STORE.email}`} className="flex items-center gap-2 hover:text-primary-600">
                <HiMail size={20} className="text-primary-600 flex-shrink-0" />
                <span className="truncate">{STORE.email}</span>
              </a>
            </li>
            <li>
              <a href={waMeUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary-600">
                <HiPhone size={20} className="text-primary-600 flex-shrink-0" />
                <span>{STORE.phoneDisplay}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-natural-dark text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} {STORE.name}. TODOS LOS DERECHOS RESERVADOS.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
