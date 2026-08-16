import React, { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import { Link } from 'react-router-dom';
import { useGetBannersQuery } from '../../services/bannersApi';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const DEFAULT_SLIDES = [
  {
    _id: 'default1',
    imagen: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop',
    titulo: 'Bienvenidos a Aura Canela',
    subtitulo: 'Moda exclusiva para vos',
    mostrarTexto: true,
    ctaLink: '/productos',
    esImagenValida: true
  },
  {
    _id: 'default2',
    imagen: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop',
    titulo: 'Nueva Temporada',
    subtitulo: 'Descubrí lo último en tendencias',
    mostrarTexto: true,
    ctaLink: '/productos',
    esImagenValida: true
  }
];

const HeroCarousel = () => {
  const { data: apiBanners } = useGetBannersQuery(true);
  
  const slides = apiBanners && apiBanners.length > 0 
    ? apiBanners.map(b => ({
      ...b,
      esVideoValido: b.video?.trim().startsWith('http'),
      esImagenValida: b.imagen?.trim().startsWith('http'),
      mostrarTexto: b.mostrarTexto === true || b.mostrarTexto === 'true',
      mostrarBoton: b.mostrarBoton === true || b.mostrarBoton === 'true'
    })) 
    : DEFAULT_SLIDES;

  return (
    <div className="w-full relative group hero-slider">
      <style>{`
        .hero-slider .swiper-button-next,
        .hero-slider .swiper-button-prev {
          color: #DC2626 !important;
          background: rgba(242, 236, 228, 0.8);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          transition: all 0.3s;
        }
        .hero-slider .swiper-button-next:after,
        .hero-slider .swiper-button-prev:after {
          font-size: 18px;
          font-weight: bold;
        }
        .hero-slider .swiper-button-next:hover,
        .hero-slider .swiper-button-prev:hover {
          background: #DC2626;
          color: #F2ECE4 !important;
        }
        .hero-slider .swiper-pagination-bullet {
          background: #000000 !important;
          opacity: 0.3;
          width: 10px;
          height: 10px;
        }
        .hero-slider .swiper-pagination-bullet-active {
          background: #DC2626 !important;
          opacity: 1;
          width: 24px;
          border-radius: 5px;
        }
      `}</style>
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        loop={slides.length > 1}
        className="w-full aspect-[21/9] sm:aspect-[21/7]"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide._id}>
            <div className="relative w-full h-full overflow-hidden bg-natural">
              {/* Contenido Visual */}
              {slide.esVideoValido ? (
                <video
                  src={slide.video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={slide.imagen}
                  alt={slide.titulo}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Overlay y Texto */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
              
              {slide.mostrarTexto && (
                <div className="absolute inset-0 flex items-center px-8 sm:px-16 md:px-24">
                  <div className="max-w-2xl text-white">
                    <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-4 animate-slide-up">
                      {slide.titulo}
                    </h1>
                    <p className="text-lg sm:text-2xl text-natural/90 mb-8 font-medium max-w-lg">
                      {slide.subtitulo}
                    </p>
                    <Link
                      to={slide.ctaLink || '/productos'}
                      className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-black px-8 py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 uppercase tracking-widest text-sm shadow-2xl"
                    >
                      Ver Colección
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HeroCarousel;
