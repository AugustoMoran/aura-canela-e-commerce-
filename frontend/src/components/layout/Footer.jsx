import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { HiMail, HiPhone } from 'react-icons/hi';

const Footer = () => {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000';
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/tutienda';
  const storeName = import.meta.env.VITE_STORE_NAME || 'Aura Canela';

  return (
    <footer className="bg-natural text-ink mt-16 border-t border-natural-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2 text-center md:text-left">
            <div className="flex justify-center md:justify-start items-center gap-3 mb-6">
              <img src="/logo.png" alt="Aura Canela Logo" className="h-32 w-auto" />
            </div>
            <p className="text-xl font-black text-ink tracking-widest mb-6 uppercase">
              {storeName}
            </p>
            <div className="flex justify-center md:justify-start gap-4">
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 transition-all transform hover:scale-110 shadow-md"
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={24} className="text-white" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-full flex items-center justify-center hover:opacity-90 transition-all transform hover:scale-110 shadow-md"
                aria-label="Instagram"
              >
                <FaInstagram size={24} className="text-white" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-black text-primary-600 uppercase text-xs tracking-widest mb-6">Tienda</h3>
            <ul className="space-y-3 text-sm font-bold">
              <li><Link to="/productos" className="hover:text-primary-600 transition-colors">Productos</Link></li>
              <li><Link to="/productos?sort=popular" className="hover:text-primary-600 transition-colors">Más vendidos</Link></li>
              <li><Link to="/mis-ordenes" className="hover:text-primary-600 transition-colors">Mis pedidos</Link></li>
            </ul>
          </div>

          {/* Sucursales */}
          <div>
            <h3 className="font-black text-primary-600 uppercase text-xs tracking-widest mb-6">📍 Sucursales</h3>
            <ul className="space-y-4 text-sm font-bold">
              <li>
                <p className="text-primary-600">Moron - Local 1</p>
                <p className="text-gray-500">25 de mayo 136</p>
                <p className="text-gray-500">Galería Ciudad Local 25</p>
              </li>
              <li>
                <p className="text-primary-600">Moron - Local 2</p>
                <p className="text-gray-500">Av Rivadavia 18252 (Local 6)</p>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-black text-primary-600 uppercase text-xs tracking-widest mb-6">Contacto</h3>
            <ul className="space-y-3 text-sm font-bold">
              <li className="flex items-center gap-2">
                <HiMail size={20} className="text-primary-600" />
                <span className="truncate">info@Aura Canela.com</span>
              </li>
              <li className="flex items-center gap-2">
                <HiPhone size={20} className="text-primary-600" />
                <span>+54 11 0000-0000</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-natural-dark text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} {storeName}. TODOS LOS DERECHOS RESERVADOS.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
