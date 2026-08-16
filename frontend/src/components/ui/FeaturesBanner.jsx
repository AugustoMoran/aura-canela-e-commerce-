import React from 'react';
import { HiOutlineSparkles, HiOutlineHeart, HiOutlineShieldCheck } from 'react-icons/hi';

const FeaturesBanner = () => {
  const features = [
    {
      icon: HiOutlineSparkles,
      title: 'Diseños Exclusivos',
      subtitle: 'Calidad Boutique',
    },
    {
      icon: HiOutlineHeart,
       title: 'Atención Personalizada',
      subtitle: 'Comunicate con nosotros',
    },
    {
      icon: HiOutlineShieldCheck,
      title: 'Compra Segura',
      subtitle: 'Tus datos están protegidos',
    },
  ];

  return (
    <div className="bg-ink text-natural-500 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {features.map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                <f.icon size={36} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-xl uppercase tracking-tighter mb-1">{f.title}</h3>
                <p className="text-primary-500 font-bold text-sm tracking-widest uppercase">{f.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesBanner;
