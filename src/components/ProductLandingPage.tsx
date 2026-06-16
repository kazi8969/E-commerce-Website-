import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Star, TrendingUp, ShieldCheck, Truck, RefreshCw, ShoppingCart, Sparkles, Check, ChevronRight, Play, Heart, Share2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Product } from '../types';
import { FORMAT_CURRENCY } from '../data';
import { useSEO } from '../hooks/useSEO';
import ProductReviews from './ProductReviews';

interface ProductLandingPageProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, options?: any) => void;
  onTryOnClick: (product: Product) => void;
  storefrontConfig?: any;
}

export default function ProductLandingPage({ product, onBack, onAddToCart, onTryOnClick, storefrontConfig }: ProductLandingPageProps) {
  useSEO({
    title: product.name,
    description: product.description.substring(0, 160),
    canonicalUrl: `${window.location.origin}/product/${product.id}`
  });

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(product.imageUrl);
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 22, seconds: 10 });

  // Mock additional images for marketing purposes
  const additionalImages = [
    product.imageUrl,
    product.imageUrl.replace('w=800', 'w=801'),
    product.imageUrl.replace('w=800', 'w=802'),
    product.imageUrl.replace('w=800', 'w=803'),
  ];

  useEffect(() => {
    // Basic countdown timer for FOMO
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else if (minutes > 0) { seconds = 59; minutes--; }
        else if (hours > 0) { seconds = 59; minutes = 59; hours--; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOptionSelect = (variantName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [variantName]: value }));
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedOptions);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D4AF37] selection:text-black pb-32">
      {/* Top Nav Breadcrumb */}
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to Store
          </button>
          <div className="flex gap-4">
            <button className="text-gray-400 hover:text-white"><Share2 size={20} /></button>
            <button className="text-gray-400 hover:text-red-500"><Heart size={20} /></button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Image Gallery Column */}
          <div className="relative">
            <div className="sticky top-24">
              <div className="aspect-[4/5] bg-white/5 rounded-2xl overflow-hidden border border-white/10 mb-4 relative group">
                {product.isNewArrival && (
                  <span className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white text-black text-xs font-bold uppercase tracking-widest rounded shadow-xl">
                    New Arrival
                  </span>
                )}
                {product.stock && product.stock <= 5 && (
                  <span className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-red-500 text-white text-xs font-bold uppercase tracking-widest rounded animate-pulse">
                    Only {product.stock} Left!
                  </span>
                )}
                <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {additionalImages.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-[#D4AF37] opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`${product.name} view ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info Column */}
          <div className="flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs uppercase tracking-widest font-bold text-[#D4AF37]">{product.category}</span>
                <span className="text-gray-600">•</span>
                <div className="flex items-center gap-1 text-sm text-gray-300">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < Math.floor(product.rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-600'} />
                    ))}
                  </div>
                  <span className="ml-1">{product.rating} ({product.reviews} reviews)</span>
                </div>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white mb-4 italic tracking-tight">{product.name}</h1>
              <div className="flex items-end gap-4 mb-6">
                <span className="font-sans font-bold text-4xl text-[#D4AF37]">{FORMAT_CURRENCY(product.price)}</span>
                {product.originalPrice && (
                  <>
                    <span className="font-sans text-xl text-gray-500 line-through mb-1">{FORMAT_CURRENCY(product.originalPrice)}</span>
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest mb-1 whitespace-nowrap text-center">
                      Save {Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  </>
                )}
              </div>
              
              <div className="bg-[#111] border border-[#D4AF37]/30 rounded-xl p-4 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Flash Sale Ending Soon</h4>
                    <p className="text-xs text-gray-400">Order now to lock in this price.</p>
                  </div>
                </div>
                <div className="flex gap-2 font-mono text-xl font-bold text-[#D4AF37]">
                  <span>{String(timeLeft.hours).padStart(2, '0')}</span>:
                  <span>{String(timeLeft.minutes).padStart(2, '0')}</span>:
                  <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            <div className="text-gray-300 text-lg leading-relaxed mb-8 space-y-4">
              {product.description.split('\n').map((paragraph, idx) => (
                <p key={idx}>
                  {paragraph}
                  {paragraph === '' && <br />}
                </p>
              ))}
            </div>

            {/* Options / Variants */}
            {product.variants && product.variants.map((variant, idx) => (
              <div key={idx} className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white">{variant.name}</h3>
                  {variant.name.toLowerCase() === 'size' && (
                    <button className="text-xs text-gray-500 underline underline-offset-4 hover:text-white">Size Guide</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {variant.values.map(val => (
                    <button 
                      key={val}
                      onClick={() => handleOptionSelect(variant.name, val)}
                      className={`px-5 py-3 border rounded text-sm font-bold uppercase tracking-widest transition-all ${selectedOptions[variant.name] === val ? 'bg-white text-black border-white' : 'bg-[#111] text-gray-400 border-white/20 hover:border-white hover:text-white'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="flex flex-col gap-4 mb-10">
              <div className="flex gap-4">
                <div className="flex items-center border border-white/20 rounded bg-[#111]">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 hover:bg-white/10">-</button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 hover:bg-white/10">+</button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-white text-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-colors rounded shadow-lg shadow-white/5 flex items-center justify-center gap-3 text-sm"
                >
                  <ShoppingCart size={18} /> Add to Cart
                </button>
              </div>
              
              {product.supportsAITryOn && (
                <button 
                  onClick={() => onTryOnClick(product)}
                  className="w-full bg-[#111] text-white px-8 py-4 font-bold uppercase tracking-widest border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors rounded flex items-center justify-center gap-3 text-sm group"
                >
                  <Sparkles size={18} className="text-[#D4AF37] group-hover:text-black" /> Virtual Try-On Experience
                </button>
              )}
            </div>

            {/* Service Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-8 mt-auto">
              <div className="flex items-center gap-3 text-gray-400">
                <Truck size={20} className="text-[#D4AF37]" />
                <span className="text-sm">Free Global Shipping</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <RefreshCw size={20} className="text-[#D4AF37]" />
                <span className="text-sm">30-Day Easy Returns</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <ShieldCheck size={20} className="text-[#D4AF37]" />
                <span className="text-sm">Secure Stripe Payments</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Check size={20} className="text-[#D4AF37]" />
                <span className="text-sm">100% Authenticity Guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing / Story Section */}
        <section className="mt-24 border-t border-white/10 pt-24 text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-5xl italic mb-6">{product.marketing?.title || storefrontConfig?.productMarketing?.title || 'Designed for Excellence'}</h2>
            <p className="text-gray-400 leading-relaxed font-sans">
              {product.marketing?.text 
                ? product.marketing.text.replace('{product.name}', product.name)
                : storefrontConfig?.productMarketing?.text 
                  ? typeof storefrontConfig.productMarketing.text === 'string' 
                     ? storefrontConfig.productMarketing.text.replace('{product.name}', product.name)
                     : ''
                  : `Every detail of the ${product.name} has been meticulously crafted to offer unparalleled quality and style. Our commitment to excellence ensures that you receive a product that not only looks stunning but stands the test of time.`}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {(product.marketing?.features && product.marketing.features.length > 0 ? product.marketing.features : storefrontConfig?.productMarketing?.features || [
              { title: 'Premium Materials', description: 'Sourced from the finest global artisans, the materials used represent the pinnacle of luxury and durability.', icon: 'Sparkles' },
              { title: 'Expert Craftsmanship', description: 'Hand-finished by master craftspeople bringing decades of experience and passion to every stitch.', icon: 'ShieldCheck' },
              { title: 'Timeless Design', description: 'A modern classic that transcends fleeting trends, becoming a staple in your personal collection.', icon: 'Play' }
            ]).map((feature: any, idx: number) => {
              const IconComponent = (LucideIcons as any)[feature.icon] || Sparkles;
              return (
                <div key={idx} className="bg-[#111] p-8 rounded-2xl border border-white/5 hover:border-white/20 transition-colors">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-6 text-[#D4AF37]">
                    <IconComponent size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <ProductReviews productId={product.id} />
      </main>

      {/* Sticky Bottom Bar for Mobile Conversion */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#050505]/95 backdrop-blur-xl border-t border-white/10 p-4 md:hidden z-50 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div>
          <p className="font-bold text-[#D4AF37]">{FORMAT_CURRENCY(product.price)}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Free Shipping</p>
        </div>
        <button 
          onClick={handleAddToCart}
          className="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest text-xs rounded hover:bg-[#D4AF37] transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
