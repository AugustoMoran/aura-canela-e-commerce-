import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiOutlineShoppingCart,
  HiOutlineSearch,
  HiOutlineUser,
  HiX,
  HiMenu,
  HiChevronDown,
} from 'react-icons/hi';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import { toggleMenu, closeMenu } from '../../features/ui/uiSlice';
import { useGetCategoriesQuery, useGetProductSuggestionsQuery } from '../../services/productsApi';
import { useGetSiteSettingsQuery } from '../../services/siteSettingsApi';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const { count, toggleCart } = useCart();
  const menuOpen = useSelector((s) => s.ui.menuOpen);
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: settings } = useGetSiteSettingsQuery();
  const bannerActive = settings?.announcementActive;
  
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  
  const { data: suggestions = [] } = useGetProductSuggestionsQuery(search);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/productos?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setShowSuggestions(false);
      dispatch(closeMenu());
    }
  };

  const handleSuggestionClick = (product) => {
    navigate(`/productos/${product._id}`);
    setSearch('');
    setShowSuggestions(false);
    dispatch(closeMenu());
  };

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'top-0' : (bannerActive ? 'top-8' : 'top-0')
        } ${
          scrolled ? 'bg-natural/95 backdrop-blur-md shadow-md py-1' : 'bg-natural py-4 border-b border-natural-dark'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-12">
            
            {/* Left: Navigation Menu (Desktop) */}
            <nav className="hidden lg:flex items-center gap-6 text-[13px] font-bold text-ink uppercase tracking-tight">
              <Link to="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
              <Link to="/#packs" className="hover:text-primary-600 transition-colors">Packs</Link>
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                  Productos <HiChevronDown className="group-hover:rotate-180 transition-transform" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-natural shadow-xl rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border border-natural-dark overflow-hidden">
                  <Link to="/productos" className="block px-4 py-2 hover:bg-natural-dark text-ink font-semibold">Ver Todo</Link>
                  <div className="border-t border-natural-dark my-1" />
                  {categories.map(cat => (
                    <Link key={cat._id} to={`/productos?categoria=${cat._id}`} className="block px-4 py-2 hover:bg-natural-dark text-ink capitalize font-medium">
                      {cat.nombre}
                    </Link>
                  ))}
                </div>
              </div>
              <Link to="/contacto" className="hover:text-primary-600 transition-colors">Contacto</Link>
            </nav>

            {/* Left: Mobile Menu Trigger */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => dispatch(toggleMenu())}
                className="p-2 -ml-2 text-ink"
                aria-label="Menú"
              >
                {menuOpen ? <HiX size={26} /> : <HiMenu size={26} />}
              </button>
            </div>

            {/* Center: Logo */}
            <div className="flex-1 lg:flex-none flex justify-center lg:absolute lg:left-1/2 lg:-translate-x-1/2">
              <Link to="/" onClick={() => dispatch(closeMenu())} className="flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Aura Canela Logo" 
                  className={`transition-all duration-300 object-contain ${scrolled ? 'h-8 sm:h-10' : 'h-16 sm:h-20'}`}
                />
              </Link>
            </div>

            {/* Right: Search, Auth, Cart */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Desktop Search */}
              <div className="hidden sm:flex relative" ref={suggestionsRef}>
                <form onSubmit={handleSearch} className="w-48 lg:w-56">
                  <div className="relative group">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Buscar productos..."
                      className="w-full bg-natural/50 border border-natural-dark rounded-full pl-4 pr-10 py-2 text-sm focus:bg-white focus:ring-1 focus:ring-primary-600 outline-none transition-all"
                    />
                    <button type="submit" className="absolute right-0 top-0 h-full px-3 text-ink group-hover:text-primary-600">
                      <HiOutlineSearch size={18} />
                    </button>
                  </div>
                </form>
                
                {showSuggestions && search.trim().length > 0 && (
                  <div className="absolute top-full right-0 mt-2 bg-natural border border-natural-dark rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto w-80">
                    {suggestions.length > 0 ? (suggestions.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => handleSuggestionClick(product)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-natural-dark transition-colors border-b border-natural last:border-b-0 text-left"
                      >
                        <img src={product.imagenes?.[0]?.url} alt="" className="w-12 h-12 object-cover rounded shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-ink truncate">{product.nombre}</p>
                          <p className="text-xs text-primary-600 font-black">${product.precio.toLocaleString()}</p>
                        </div>
                      </button>
                    ))) : (
                      <div className="p-6 text-center text-sm text-gray-500">No se encontraron productos</div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Search Icon */}
              <button onClick={() => navigate('/productos')} className="sm:hidden p-2 text-ink">
                <HiOutlineSearch size={22} />
              </button>

              {/* User Dropdown */}
              <div className="relative group">
                <button className={`p-2 transition-colors ${isAuthenticated ? 'text-primary-600' : 'text-ink'}`}>
                  <HiOutlineUser size={24} />
                </button>
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-2xl border border-natural-dark py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-natural mb-1">
                        <p className="text-xs text-gray-400">Sesión iniciada como</p>
                        <p className="text-sm font-bold text-ink truncate">{user?.email}</p>
                      </div>
                      <Link to="/perfil" className="block px-4 py-2 text-sm hover:bg-natural font-medium">Mi Perfil</Link>
                      <Link to="/mis-ordenes" className="block px-4 py-2 text-sm hover:bg-natural font-medium">Mis Pedidos</Link>
                      {isAdmin && (
                        <Link to="/admin" className="block px-4 py-2 text-sm text-primary-600 font-bold hover:bg-red-50 border-t border-natural mt-1 pt-2">
                          Panel Administrador
                        </Link>
                      )}
                      <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-natural mt-1 pt-2">
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-2 text-sm hover:bg-natural font-bold text-ink">Iniciar Sesión</Link>
                      <Link to="/registro" className="block px-4 py-2 text-sm hover:bg-natural text-gray-600">Crear Cuenta</Link>
                    </>
                  )}
                </div>
              </div>

              {/* Cart Button */}
              <button 
                onClick={toggleCart} 
                className="p-2 text-ink hover:text-primary-600 transition-colors relative"
              >
                <HiOutlineShoppingCart size={24} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 lg:hidden ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => dispatch(closeMenu())}
      />
      
      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 left-0 w-80 h-full bg-white z-[101] shadow-2xl transition-transform duration-300 transform lg:hidden flex flex-col ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-natural flex items-center justify-between bg-natural/20">
          <img src="/logo.png" alt="Aura Canela Logo" className="h-10 w-auto" />
          <button onClick={() => dispatch(closeMenu())} className="p-2 text-ink bg-white rounded-full shadow-sm"><HiX size={24} /></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <nav className="flex flex-col gap-1">
            <Link to="/" onClick={() => dispatch(closeMenu())} className="py-4 text-lg font-black text-ink uppercase tracking-wider border-b border-natural">Inicio</Link>
            <Link to="/#packs" onClick={() => dispatch(closeMenu())} className="py-4 text-lg font-black text-primary-600 uppercase tracking-wider border-b border-natural">Packs</Link>
            
            <div className="py-4 border-b border-natural">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Productos</p>
              <Link to="/productos" onClick={() => dispatch(closeMenu())} className="block py-2 text-lg font-black text-ink uppercase mb-2">Ver Todo</Link>
              <div className="grid grid-cols-1 gap-1 pl-2">
                {categories.map(cat => (
                  <Link 
                    key={cat._id} 
                    to={`/productos?categoria=${cat._id}`} 
                    onClick={() => dispatch(closeMenu())} 
                    className="py-2 text-sm font-bold text-primary-800 capitalize hover:text-primary-600"
                  >
                    • {cat.nombre}
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/contacto" onClick={() => dispatch(closeMenu())} className="py-4 text-lg font-black text-ink uppercase tracking-wider border-b border-natural">Contacto</Link>
            
            {isAdmin && (
              <Link to="/admin" onClick={() => dispatch(closeMenu())} className="py-4 text-lg font-black text-primary-600 uppercase tracking-wider border-b border-natural">Administración</Link>
            )}
          </nav>
        </div>

        <div className="p-6 bg-natural/20 border-t border-natural text-center">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Seguinos en redes</p>
          <div className="flex justify-center gap-6">
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
