import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import FloatingButtons from '../ui/FloatingButtons';
import WhatsAppPopup from '../ui/WhatsAppPopup';
import ScrollingBanner from './ScrollingBanner';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollingBanner />
      <Header />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <FloatingButtons />
      <WhatsAppPopup />
    </div>
  );
};

export default Layout;
