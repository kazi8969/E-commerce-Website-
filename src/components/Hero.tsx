import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { FORMAT_CURRENCY } from '../data';

export default function Hero({ config, departmentsProp, onCategorySelect, onShopNow }: { config?: any, departmentsProp?: any[], onCategorySelect?: (cat: string) => void, onShopNow?: () => void }) {
  const departments = departmentsProp || [
    { name: 'New Arrivals', isHot: false },
    { name: 'Top 100 Best Seller', isHot: true },
    { name: 'TV & Video', isHot: false },
    { name: 'Home Audi & Theater', isHot: false },
    { name: 'Camera, Photo & Video', isHot: false },
    { name: 'Cell Phones & Accessories', isHot: false },
    { name: 'Headphones', isHot: false },
    { name: 'Car Electronics', isHot: false },
    { name: 'Electronics Showcase', isHot: false },
    { name: 'All categories', isHot: false },
  ];

  const slides = config?.slides && config.slides.length > 0
     ? config.slides
     : [ 
        { 
          image: 'https://images.unsplash.com/photo-1543844605-7f9cb89c79fa?w=600&q=80', 
          link: '#',
          subtitle: 'GET UP TO 75% OFF - SHOP NOW!',
          title: 'Build Your Dream\\nStore in Seconds!',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          buttonText: 'Shop Collections',
          buttonLink: '#',
          bgColor: '#8CE6FF'
        }
       ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex gap-6 relative items-start">
          
          {/* Center Main Slider */}
          <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200 group">
             <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
                {slides.map((slide: any, i: number) => (
                  <div key={i} style={{ backgroundColor: slide.bgColor || 'transparent' }} className={`absolute inset-0 transition-opacity duration-500 overflow-hidden ${i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                    {slide.title || slide.subtitle ? (
                      <div className="w-full h-full relative p-8 md:px-16 flex flex-col justify-center">
                        {slide.image && (
                           <div 
                              className="absolute inset-0 w-full h-full object-cover bg-center bg-no-repeat bg-cover z-0" 
                              style={{ backgroundImage: `url(${slide.image})` }} 
                           />
                        )}
                        <div className="relative z-10 max-w-sm text-left">
                          {slide.subtitle && <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-2 text-gray-800">{slide.subtitle}</p>}
                          {slide.title && <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight mb-3 text-gray-900 whitespace-pre-line tracking-tight">{slide.title}</h2>}
                          {slide.description && <p className="text-xs md:text-sm text-gray-700 mb-6 leading-relaxed max-w-xs">{slide.description}</p>}
                          {(slide.buttonText || slide.buttonLink || slide.link) && (
                            <a href={slide.buttonLink || slide.link || '#'} className="inline-block px-6 py-2.5 text-xs bg-gray-900 text-white font-bold rounded shadow hover:bg-gray-800 transition-colors uppercase tracking-widest">
                              {slide.buttonText || 'Shop Collections'}
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <a href={slide.link || '#'} className="w-full h-full flex items-center justify-center">
                        <img src={slide.image} alt={`Slide ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    )}
                  </div>
                ))}

                {/* Navigation Controls */}
                {slides.length > 1 && (
                  <>
                    <button onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-800 hover:scale-110 transition-transform">
                      <ChevronLeft size={20} className="ml-[-2px] text-gray-400" />
                    </button>
                    <button onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-gray-800 hover:scale-110 transition-transform">
                      <ChevronRight size={20} className="mr-[-2px] text-gray-400" />
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                      {slides.map((_: any, i: number) => (
                        <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-blue-500 w-2' : 'bg-gray-400/50'}`}></button>
                      ))}
                    </div>
                  </>
                )}
             </div>
          </div>

          {/* Right Banners */}
          <div className="w-full lg:w-72 hidden md:flex flex-col gap-6 shrink-0">
             {/* Banner 1 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center relative overflow-hidden group hover:shadow-md transition-shadow">
                <h3 className="text-xl text-gray-800 leading-tight mb-2 z-10 self-start whitespace-pre-line">{config?.rightBanner1?.title || 'Playstation 4\\ngame pro'}</h3>
                <div className="text-red-500 text-xs font-bold self-start mb-4 z-10">From <span className="text-xl">{FORMAT_CURRENCY(parseFloat(config?.rightBanner1?.price || '29.99'))}</span></div>
                <button onClick={() => onShopNow && onShopNow()} className="self-start text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 z-10">Shop now <ChevronRight size={12} /></button>
                <img src={config?.rightBanner1?.image || "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=300&q=80"} alt="Promo" className="w-32 absolute bottom-2 right-2 object-contain group-hover:scale-105 transition-transform" />
             </div>
             
             {/* Banner 2 */}
             <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center relative overflow-hidden group hover:shadow-md transition-shadow">
                <h3 className="text-xl text-gray-800 leading-tight mb-2 z-10 self-start whitespace-pre-line">{config?.rightBanner2?.title || 'Smart phone\\nmix 2'}</h3>
                <div className="text-red-500 text-xs font-bold self-start mb-4 z-10">From <span className="text-xl">{FORMAT_CURRENCY(parseFloat(config?.rightBanner2?.price || '99.99'))}</span></div>
                <button onClick={() => onShopNow && onShopNow()} className="self-start text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 z-10">Shop now <ChevronRight size={12} /></button>
                <img src={config?.rightBanner2?.image || "https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=300&q=80"} alt="Promo" className="w-24 absolute bottom-2 right-4 object-contain group-hover:scale-105 transition-transform" />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
