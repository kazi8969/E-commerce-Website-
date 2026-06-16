/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import AITryOnModal from './components/AITryOnModal';
import CartDrawer from './components/CartDrawer';
import FloatingChat from './components/FloatingChat';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import UserProfileComponent from './components/UserProfile';
import ProductLandingPage from './components/ProductLandingPage';
import ShopView from './components/ShopView';
import { ProductCardSkeleton, CategorySkeleton } from './components/Skeletons';
import { setStoreCurrency, setBaseCurrency, FORMAT_CURRENCY } from './data';
import { Product, CartItem, Offer } from './types';
import { Package, ShieldCheck, Zap, Sparkles, MessageSquare, Activity, Tag, Play, Truck, CreditCard, Headphones, ChevronRight, MapPin, ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { auth, db } from './lib/firebase';
import { collection, onSnapshot, doc, query, where, getDoc, setDoc, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-utils';
import { seedDatabase } from './lib/seed';

import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';

interface InfoTopic {
  title: string;
  content: string;
}

export default function App() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('visitorCart');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeInfoTopic, setActiveInfoTopic] = useState<InfoTopic | null>(null);
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);
  const [view, setView] = useState<'storefront' | 'admin' | 'profile' | 'product' | 'shop'>('storefront');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isStorefrontLoading, setIsStorefrontLoading] = useState(true);
  const [storefrontConfig, setStorefrontConfig] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [pagesList, setPagesList] = useState<any[]>([]);
  const [generalCurrency, setGeneralCurrency] = useState('USD');
  const [shopCategory, setShopCategory] = useState<string>('');
  const [shopSearch, setShopSearch] = useState<string>('');
  const [, setCurrencyUpdateTrigger] = useState(0);

  const handlePageLinkClick = (url: string) => {
    const slug = url.replace('/page/', '');
    const page = pagesList.find(p => p.slug === slug || p.id === slug);
    if (page) {
      setActiveInfoTopic({ id: page.slug?.replace('/', ''), title: page.title, content: page.content || 'Content coming soon...' });
      setView('info');
    }
  };

  useEffect(() => {
    const handleCurrencyChange = () => setCurrencyUpdateTrigger(prev => prev + 1);
    window.addEventListener('currencyChange', handleCurrencyChange);
    return () => window.removeEventListener('currencyChange', handleCurrencyChange);
  }, []);

  const navigateToShop = (category = '', search = '') => {
    setShopCategory(category);
    setShopSearch(search);
    setView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'settings', 'storefront'), (doc) => {
      if (doc.exists()) {
        setStorefrontConfig(doc.data());
      }
    });
    
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const cats: any[] = [];
      snapshot.forEach(doc => cats.push({ id: doc.id, ...doc.data() }));
      setCategoriesList(cats);
    });

    const unsubPages = onSnapshot(collection(db, 'pages'), (snapshot) => {
      const pgs: any[] = [];
      snapshot.forEach(doc => pgs.push({ id: doc.id, ...doc.data() }));
      setPagesList(pgs);
    });

    const unsubStore = onSnapshot(doc(db, 'settings', 'store'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setStoreSettings(data);
        if (data.general?.currency) {
          const storeCurrencySetting = data.general.currency;
          setBaseCurrency(storeCurrencySetting);
          const stored = localStorage.getItem('visitorCurrency');
          if (!stored) {
            setStoreCurrency(storeCurrencySetting);
            setGeneralCurrency(storeCurrencySetting);
          } else {
            setStoreCurrency(stored);
            setGeneralCurrency(stored);
          }
        }
      }
    });

    return () => {
      unsubConfig();
      unsubCats();
      unsubStore();
    };
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsStorefrontLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        if (u.email === 'mrstoursandtravelsbd@gmail.com') {
          seedDatabase();
        }
        // Load persistent cart
        try {
          const cartRef = doc(db, 'users', u.uid, 'cart', 'items');
          const snap = await getDoc(cartRef);
          if (snap.exists()) {
            const dbCart = snap.data().items || [];
            setCart(prev => {
              if (prev.length === 0) return dbCart;
              
              const merged = [...prev];
              const dbCartItemsToMerge = dbCart.filter((dbItem: any) => !merged.find(m => m.id === dbItem.id));
              return [...merged, ...dbCartItemsToMerge];
            });
          }
        } catch (e) {
          console.error("Failed to load persistent cart", e);
        }
      }
    });
    return unsubAuth;
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem('visitorCart', JSON.stringify(cart));
    } catch(e) {}

    if (user) {
      const syncCart = async () => {
        try {
          await setDoc(doc(db, 'users', user.uid, 'cart', 'items'), { items: cart });
        } catch (e) {
          console.error("Failed to sync cart", e);
        }
      };
      
      const timeoutId = setTimeout(() => {
        syncCart();
      }, 500); // debounce sync
      
      return () => clearTimeout(timeoutId);
    }
  }, [cart, user]);

  React.useEffect(() => {
    const pRef = collection(db, 'products');
    const unsubscribe = onSnapshot(pRef, (snapshot) => {
      const p: Product[] = [];
      snapshot.forEach(d => {
        p.push({ id: d.id, ...d.data() } as Product);
      });
      
      setProductsList(p);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const q = query(collection(db, 'offers'), where('isActive', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const o: Offer[] = [];
      snapshot.forEach(d => {
        o.push({ id: d.id, ...d.data() } as Offer);
      });
      setActiveOffers(o);
    }, (error) => {
      console.error('Failed to fetch offers:', error);
    });
    return () => unsubscribe();
  }, []);

  const handleAddToCart = (product: Product, quantity: number = 1, options?: any) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'admin') {
    return <AdminDashboard onExit={() => setView('storefront')} productsList={productsList} setProductsList={setProductsList} />;
  }

  if (view === 'profile' && user) {
    return <UserProfileComponent onBack={() => setView('storefront')} />;
  }

  if (view === 'shop') {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-24">
        <Navbar onPageLinkClick={handlePageLinkClick} 
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
          onCartClick={() => setIsCartOpen(true)}
          onAuthClick={() => {
            if (user) setView('profile');
            else setIsAuthOpen(true);
          }}
          config={storefrontConfig}
          categories={categoriesList}
          onSearch={(query, category) => navigateToShop(category || '', query)}
          onCategorySelect={(category) => navigateToShop(category)}
          onNavigateHome={() => setView('storefront')}
          currency={generalCurrency}
          onCurrencyChange={(c) => { setGeneralCurrency(c); setStoreCurrency(c); localStorage.setItem('visitorCurrency', c); }}
        />
        <ShopView 
          products={productsList}
          initialCategory={shopCategory}
          initialSearch={shopSearch}
          onAddToCart={handleAddToCart}
          onTryOnClick={setTryOnProduct}
          onViewProduct={handleViewProduct}
          categories={storefrontConfig?.categories || []}
        />
        {/* Modals & Drawers */}
        <AITryOnModal 
          isOpen={!!tryOnProduct} 
          product={tryOnProduct} 
          onClose={() => setTryOnProduct(null)} 
        />
        <CartDrawer 
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          updateQuantity={updateQuantity}
          removeItem={removeItem}
          clearCart={() => setCart([])}
        />
        <AuthModal 
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      </div>
    );
  }

  if (view === 'info' && activeInfoTopic) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
        <Navbar onPageLinkClick={handlePageLinkClick} 
          cartCount={cart.reduce((a,c) => a + c.quantity, 0)} 
          onCartClick={() => setIsCartOpen(true)}
          onAuthClick={() => {
            if (user) setView('profile');
            else setIsAuthOpen(true);
          }}
          config={storefrontConfig}
          categories={categoriesList}
          onSearch={(query, category) => navigateToShop(category || '', query)}
          onCategorySelect={(category) => navigateToShop(category)}
          onNavigateHome={() => setView('storefront')}
          currency={generalCurrency}
          onCurrencyChange={(c) => { setGeneralCurrency(c); setStoreCurrency(c); localStorage.setItem('visitorCurrency', c); }}
        />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
          <button onClick={() => setView('storefront')} className="text-gray-400 hover:text-white mb-8 flex items-center gap-2">
             <ArrowLeft size={16} /> Back to Store
          </button>
          <h1 className="font-serif text-4xl italic text-[#D4AF37] mb-8">{activeInfoTopic.title}</h1>
          {activeInfoTopic.title.toLowerCase() === 'contact us' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8 animate-fade-in">
              <div>
                <div className="prose prose-invert prose-gold max-w-none text-gray-300 mb-10 leading-relaxed">
                   {activeInfoTopic.content.split('\n').map((para, i) => (
                      <p key={i} className="mb-4">{para}</p>
                   ))}
                </div>
                {storeSettings?.general && (
                  <div className="space-y-8 bg-[#111] p-8 rounded-xl border border-gray-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-5 blur-[80px] rounded-full"></div>
                    <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest text-sm">Store Information</h3>
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-gray-800">
                        <MapPin size={20} className="text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Address</p>
                        <p className="text-gray-300">{storeSettings.general.storeAddress || 'Not available'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-gray-800">
                        <Headphones size={20} className="text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Phone</p>
                        <p className="text-gray-300">{storeSettings.general.contactPhone || 'Not available'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-gray-800">
                        <MessageSquare size={20} className="text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Email</p>
                        <p className="text-gray-300">{storeSettings.general.contactEmail || 'Not available'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <form 
                  onSubmit={async (e) => { 
                    e.preventDefault(); 
                    const form = e.target as HTMLFormElement;
                    try {
                      await addDoc(collection(db, 'contact_messages'), {
                        name: (form.elements.namedItem('name') as HTMLInputElement).value,
                        email: (form.elements.namedItem('email') as HTMLInputElement).value,
                        subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
                        message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
                        createdAt: new Date().toISOString()
                      });
                      alert('Message sent successfully! We will get back to you soon.'); 
                      form.reset();
                    } catch(err) {
                      console.error("Error sending message", err);
                      alert('Error sending message. Please try again.');
                    }
                  }} 
                  className="bg-[#111] border border-gray-800 p-8 rounded-xl shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
                  <h3 className="text-3xl font-serif italic text-white mb-8">Send us a Message</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Name</label>
                      <input name="name" required type="text" className="w-full bg-[#1a1a1a] border border-gray-800 rounded p-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                      <input name="email" required type="email" className="w-full bg-[#1a1a1a] border border-gray-800 rounded p-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors" placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Subject</label>
                      <input name="subject" required type="text" className="w-full bg-[#1a1a1a] border border-gray-800 rounded p-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors" placeholder="How can we help?" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>
                      <textarea name="message" required className="w-full bg-[#1a1a1a] border border-gray-800 rounded p-3 h-32 text-white focus:border-[#D4AF37] focus:outline-none transition-colors" placeholder="Your message..."></textarea>
                    </div>
                    <button type="submit" className="w-full bg-[#D4AF37] text-black font-bold py-4 rounded hover:bg-white transition-colors uppercase tracking-widest text-sm mt-6">
                      Send Message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert prose-gold max-w-none text-gray-300">
              {activeInfoTopic.content.split('\n').map((para, i) => (
                 <p key={i} className="mb-4">{para}</p>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (view === 'product' && selectedProduct) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar onPageLinkClick={handlePageLinkClick} 
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
          onCartClick={() => setIsCartOpen(true)}
          onAuthClick={() => {
            if (user) setView('profile');
            else setIsAuthOpen(true);
          }}
          config={storefrontConfig}
          categories={categoriesList}
          onSearch={(query, category) => navigateToShop(category || '', query)}
          onCategorySelect={(category) => navigateToShop(category)}
          onNavigateHome={() => setView('storefront')}
          currency={generalCurrency}
          onCurrencyChange={(c) => { setGeneralCurrency(c); setStoreCurrency(c); localStorage.setItem('visitorCurrency', c); }}
        />
        <ProductLandingPage 
          product={selectedProduct}
          onBack={() => setView('storefront')}
          onAddToCart={handleAddToCart}
          onTryOnClick={setTryOnProduct}
          storefrontConfig={storefrontConfig}
        />
        {/* Modals & Drawers */}
        <AITryOnModal 
          isOpen={!!tryOnProduct} 
          product={tryOnProduct} 
          onClose={() => setTryOnProduct(null)} 
        />
        <CartDrawer 
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          updateQuantity={updateQuantity}
          removeItem={removeItem}
          clearCart={() => setCart([])}
        />
        <AuthModal 
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
        <FloatingChat />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-blue-200 selection:text-blue-900 pb-24">
      <Navbar onPageLinkClick={handlePageLinkClick} 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => {
          if (user) {
            setView('profile');
          } else {
            setIsAuthOpen(true);
          }
        }}
        config={storefrontConfig}
        categories={categoriesList}
        onSearch={(query, category) => navigateToShop(category || '', query)}
        onCategorySelect={(category) => navigateToShop(category)}
        onNavigateHome={() => setView('storefront')}
        currency={generalCurrency}
        onCurrencyChange={(c) => { setGeneralCurrency(c); setStoreCurrency(c); localStorage.setItem('visitorCurrency', c); }}
      />
      
      <main>
        <Hero 
          config={storefrontConfig?.hero} 
          departmentsProp={categoriesList}
          onCategorySelect={(cat) => navigateToShop(cat)}
          onShopNow={() => navigateToShop()}
        />
        
        {/* Features Row */}
        <div className="border-b border-gray-100 py-10 bg-white">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
             {storefrontConfig?.features?.length > 0 ? (
               storefrontConfig.features.map((feature: any, index: number) => {
                 const IconComponent = (LucideIcons as any)[feature.icon] || LucideIcons.CheckCircle;
                 return (
                   <div key={index} className="flex-1 flex items-center gap-4 py-4 md:py-0 md:px-8 first:pl-0 last:pr-0">
                      <div className="relative">
                        <IconComponent size={36} className="text-gray-300" strokeWidth={1} />
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-gray-800">{feature.title}</h4>
                         <p className="text-xs text-gray-500">{feature.description}</p>
                      </div>
                   </div>
                 );
               })
             ) : (
               <>
                 <div className="flex-1 flex items-center gap-4 py-4 md:py-0 md:pr-8">
                    <Truck size={36} className="text-gray-300" strokeWidth={1} />
                    <div>
                       <h4 className="text-sm font-bold text-gray-800">Worldwide Delivery</h4>
                       <p className="text-xs text-gray-500">With sites in 5 languages, we ship to over 200 countries & regions.</p>
                    </div>
                 </div>
                 <div className="flex-1 flex items-center gap-4 py-4 md:py-0 md:px-8">
                    <div className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center -rotate-12"><CreditCard size={24} className="text-gray-300 transform rotate-12" strokeWidth={1} /></div>
                    <div>
                       <h4 className="text-sm font-bold text-gray-800">Safe Payment</h4>
                       <p className="text-xs text-gray-500">Pay with the world's most popular and secure payment methods.</p>
                    </div>
                 </div>
                 <div className="flex-1 flex items-center gap-4 py-4 md:py-0 md:pl-8">
                    <div className="relative"><Headphones size={36} className="text-gray-300" strokeWidth={1} /></div>
                    <div>
                       <h4 className="text-sm font-bold text-gray-800">24/7 Help Center</h4>
                       <p className="text-xs text-gray-500">Round-the-clock assistance for a smooth shopping experience.</p>
                    </div>
                 </div>
               </>
             )}
          </div>
        </div>

        {/* Tabs Row */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between mb-8 pb-4 border-b border-gray-200">
             <div className="flex gap-4 sm:gap-8 overflow-x-auto w-full sm:w-auto pb-4 sm:pb-0 scrollbar-hide">
               <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-400 text-white rounded-full text-sm font-bold shadow-md shadow-blue-500/20 whitespace-nowrap">Featured</button>
               <button className="px-6 py-2 text-gray-600 hover:text-blue-600 font-bold text-sm whitespace-nowrap">Top rated</button>
               <button className="px-6 py-2 text-gray-600 hover:text-blue-600 font-bold text-sm whitespace-nowrap">New arrivals</button>
             </div>
             <button onClick={() => navigateToShop()} className="hidden sm:flex text-sm text-gray-500 hover:text-blue-600 items-center justify-end w-32 shrink-0">Shop more <ChevronRight size={14} /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productsList.slice(0, 8).map(product => (
               <ProductCard
                 key={product.id}
                 product={product}
                 onAddToCart={handleAddToCart}
                 onTryOnClick={setTryOnProduct}
                 onViewProduct={handleViewProduct}
               />
            ))}
          </div>
        </div>

        {/* Promo Banners Row */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(storefrontConfig?.promoBanners || []).map((banner: any, i: number) => (
                 <div key={i} className="bg-gray-50 rounded-xl p-8 flex items-center justify-between border border-gray-100 group overflow-hidden cursor-pointer">
                    <div className="z-10 bg-white/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-4 md:p-0 rounded-lg">
                       <h3 className="text-2xl text-gray-800 leading-tight mb-2 whitespace-pre-line">{banner.title}</h3>
                       <div className="text-red-500 text-sm font-bold mb-4">From <span className="text-3xl">{banner.price} <sup className="text-sm">$</sup></span></div>
                       <button onClick={() => navigateToShop()} className="text-sm text-red-500 font-bold hover:underline flex items-center gap-1">Shop now <ChevronRight size={14} /></button>
                    </div>
                    <img src={banner.image} alt="Promo" className="w-48 object-contain mix-blend-multiply group-hover:scale-105 transition-transform origin-right rounded-full" />
                 </div>
              ))}
              {(!storefrontConfig?.promoBanners || storefrontConfig.promoBanners.length === 0) && (
                <>
                  <div className="bg-gray-50 rounded-xl p-8 flex items-center justify-between border border-gray-100 group overflow-hidden cursor-pointer">
                     <div className="z-10 bg-white/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-4 md:p-0 rounded-lg">
                        <h3 className="text-2xl text-gray-800 leading-tight mb-2">The pro stage for<br/>your home</h3>
                        <div className="text-red-500 text-sm font-bold mb-4">From <span className="text-3xl">{FORMAT_CURRENCY(69.99)}</span></div>
                        <button onClick={() => navigateToShop()} className="text-sm text-red-500 font-bold hover:underline flex items-center gap-1">Shop now <ChevronRight size={14} /></button>
                     </div>
                     <img src="https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&q=80" alt="Speaker" className="w-48 object-contain mix-blend-multiply group-hover:scale-105 transition-transform origin-right" />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-8 flex items-center justify-between border border-gray-100 group overflow-hidden cursor-pointer">
                     <div className="z-10 bg-white/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-4 md:p-0 rounded-lg">
                        <h3 className="text-2xl text-gray-800 leading-tight mb-2">Smart speaker for<br/>music lovers</h3>
                        <div className="text-red-500 text-sm font-bold mb-4">From <span className="text-3xl">{FORMAT_CURRENCY(39.99)}</span></div>
                        <button onClick={() => navigateToShop()} className="text-sm text-red-500 font-bold hover:underline flex items-center gap-1">Shop now <ChevronRight size={14} /></button>
                     </div>
                     <img src="https://images.unsplash.com/photo-1589003071515-20ac88d7f353?w=400&q=80" alt="Speaker" className="w-48 object-contain mix-blend-multiply group-hover:scale-105 transition-transform origin-right rounded-full" />
                  </div>
                </>
              )}
           </div>
        </div>

        {/* Categories Grid */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
           <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
              <h2 className="text-xl font-bold text-gray-800">Categories</h2>
              <button onClick={() => navigateToShop()} className="text-sm text-gray-500 hover:text-blue-600 flex items-center">Shop more <ChevronRight size={14} /></button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(storefrontConfig?.categories || []).map((cat: any, i: number) => (
                 <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-blue-500 transition-colors">
                    <img src={cat.image} className="w-full h-32 object-contain mix-blend-multiply mb-4" />
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-bold text-gray-800">{cat.name}</h3>
                       <button onClick={() => navigateToShop(cat.name)} className="px-3 py-1 bg-blue-400 text-white text-xs rounded-full cursor-pointer hover:bg-blue-500">Shop now <ChevronRight size={10} className="inline" /></button>
                    </div>
                    <ul className="text-xs text-gray-500 space-y-2">
                       {cat.items.split(',').map((item: string, j: number) => (
                          <li key={j} className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">{item.trim()}</li>
                       ))}
                    </ul>
                 </div>
              ))}
              {(!storefrontConfig?.categories || storefrontConfig.categories.length === 0) && (
                <>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-blue-500 transition-colors">
                     <img src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&q=80" className="w-full h-32 object-contain mix-blend-multiply mb-4" />
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">TV & Video</h3>
                        <button onClick={() => navigateToShop('TV & Video')} className="px-3 py-1 bg-blue-400 text-white text-xs rounded-full cursor-pointer hover:bg-blue-500">Shop now <ChevronRight size={10} className="inline" /></button>
                     </div>
                     <ul className="text-xs text-gray-500 space-y-2">
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Televisions</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Blu-ray Players</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Streaming Media Players</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Home Audio</li>
                     </ul>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-blue-500 transition-colors">
                     <img src="https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&q=80" className="w-full h-32 object-contain mix-blend-multiply mb-4" />
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">Home Audio & Theater</h3>
                        <button onClick={() => navigateToShop('Home Audio & Theater')} className="px-3 py-1 bg-blue-400 text-white text-xs rounded-full cursor-pointer hover:bg-blue-500">Shop now <ChevronRight size={10} className="inline" /></button>
                     </div>
                     <ul className="text-xs text-gray-500 space-y-2">
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Speakers</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Streaming audio</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Stereo system components</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Headphones</li>
                     </ul>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-blue-500 transition-colors">
                     <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&q=80" className="w-full h-32 object-contain mix-blend-multiply mb-4" />
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">Camera & Photo</h3>
                        <button onClick={() => navigateToShop('Camera & Photo')} className="px-3 py-1 bg-blue-400 text-white text-xs rounded-full cursor-pointer hover:bg-blue-500">Shop now <ChevronRight size={10} className="inline" /></button>
                     </div>
                     <ul className="text-xs text-gray-500 space-y-2">
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Accessories</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Lenses</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Lighting & Studio</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Video</li>
                     </ul>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-blue-500 transition-colors">
                     <img src="https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=300&q=80" className="w-full h-32 object-contain mix-blend-multiply mb-4" />
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">Computers & Accessories</h3>
                        <button onClick={() => navigateToShop('Computers & Accessories')} className="px-3 py-1 bg-blue-400 text-white text-xs rounded-full cursor-pointer hover:bg-blue-500">Shop now <ChevronRight size={10} className="inline" /></button>
                     </div>
                     <ul className="text-xs text-gray-500 space-y-2">
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Tablets</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Desktops</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">Computer Accessories</li>
                        <li className="flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full">PC Gaming</li>
                     </ul>
                  </div>
                </>
              )}
           </div>
        </div>

        {/* Shop by Brand */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
           <div className="flex items-center justify-between mb-8 pb-4">
              <h2 className="text-xl font-bold text-gray-800">Shop by brand</h2>
              <button onClick={() => navigateToShop()} className="text-sm text-gray-500 hover:text-blue-600 flex items-center">Shop more <ChevronRight size={14} /></button>
           </div>
           
           <div className="flex items-center gap-12 overflow-x-auto opacity-60 grayscale hover:grayscale-0 transition-all duration-300 pb-4 no-scrollbar">
              {(storefrontConfig?.brands || []).map((brand: any, i: number) => (
                 brand.logo ? (
                   <img key={i} src={brand.logo} alt={brand.name} className="h-12 w-auto object-contain shrink-0" title={brand.name} />
                 ) : (
                   <span key={i} className={brand.style || "font-bold text-2xl tracking-widest shrink-0"} title={brand.name}>{brand.name}</span>
                 )
              ))}
              {(!storefrontConfig?.brands || storefrontConfig.brands.length === 0) && (
                <>
                  <span className="font-bold text-2xl tracking-widest uppercase shrink-0">sixbase</span>
                  <span className="font-bold text-2xl italic shrink-0">pelicon</span>
                  <span className="font-bold text-3xl font-serif shrink-0">SOUND))</span>
                  <span className="font-bold text-2xl uppercase tracking-tighter shrink-0">VIGOR</span>
                  <span className="font-light text-2xl italic font-serif shrink-0">falsan</span>
                  <span className="font-black text-2xl tracking-widest shrink-0">TRULL</span>
                </>
              )}
           </div>

           <div className="flex flex-col lg:flex-row gap-6 mt-8">
              <div className="w-full lg:w-1/3 bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center p-12 hover:border-blue-500 transition-colors">
                 <span className="font-bold text-4xl font-serif mb-8">{storefrontConfig?.featuredBrand?.name || 'SOUND))'}</span>
                 <p className="text-center text-xs text-gray-500 mb-8 max-w-[200px]">{storefrontConfig?.featuredBrand?.description || 'All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet.'}</p>
                 <button onClick={() => navigateToShop()} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-400 text-white rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-shadow">Shop this brand <ChevronRight size={14} className="inline" /></button>
              </div>
              <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[1,2,3,4].map(idx => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:border-gray-200 cursor-pointer">
                       <img src="https://images.unsplash.com/photo-1545454675-3531b543be5d?w=100&q=80" className="w-20 h-20 object-contain mix-blend-multiply" />
                       <div className="flex-1">
                          <p className="text-[10px] text-gray-400">Audio Speakers</p>
                          <h4 className="text-sm font-bold text-gray-800 line-clamp-1">Harman Kardon Onyx Studio</h4>
                          <p className="text-sm font-bold text-red-500 mt-1">$1,215.00</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Recently Added */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
           <h2 className="text-xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-200">Recently Added</h2>
           
           <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[1,2,3,4].map(idx => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:border-gray-200 cursor-pointer">
                       <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80" className="w-20 h-20 object-contain mix-blend-multiply" />
                       <div className="flex-1">
                          <p className="text-[10px] text-gray-400">Audio Speakers</p>
                          <h4 className="text-sm font-bold text-gray-800 line-clamp-1">Harman Kardon Onyx Studio</h4>
                          <p className="text-sm font-bold text-red-500 mt-1">$1,215.00</p>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="w-full lg:w-1/3 bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 relative overflow-hidden group hover:border-blue-500 transition-colors">
                 <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold w-10 h-10 rounded-full flex items-center justify-center">-30%</div>
                 <img src="https://images.unsplash.com/photo-1546435770-a3e426fbcf5f?w=300&q=80" className="w-48 h-48 object-contain mix-blend-multiply mb-4 group-hover:scale-105 transition-transform" />
                 <p className="text-[10px] text-gray-400">Head Phones</p>
                 <h4 className="text-sm font-bold text-gray-800 text-center mb-2">Esonstyle Rose Golden Bluetooth Headphone</h4>
                 <div className="flex items-center justify-center gap-4 text-xs font-bold w-full mb-4">
                    <span className="text-red-500 text-xl">$79.00</span>
                    <span className="text-gray-400 line-through">$99.00</span>
                 </div>
                 <div className="w-full text-xs text-gray-500 flex justify-between mb-2">
                   <span>19% already claimed</span>
                   <span>Available: <b>22</b></span>
                 </div>
                 <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div className="w-[19%] h-full bg-gradient-to-r from-purple-500 to-blue-400"></div>
                 </div>
                 <p className="text-xs text-gray-600">Deal ends in: <span className="font-bold text-red-500">Expired</span></p>
              </div>
           </div>
        </div>

        {/* Bottom Banner */}
        <div className="w-full h-64 relative mt-10">
           <img src={storefrontConfig?.bottomBanner?.image || "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=1600"} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center px-4">
              <h2 className="text-4xl text-white font-light tracking-tight mb-4 text-shadow-md">{storefrontConfig?.bottomBanner?.title || 'Free Shipping on Orders $50'}</h2>
              <button onClick={() => navigateToShop()} className="text-white hover:text-blue-200 uppercase tracking-widest font-bold border-b border-white hover:border-blue-200 pb-1 transition-colors">{storefrontConfig?.bottomBanner?.buttonText || 'Shop now'}</button>
           </div>
        </div>

        {/* 3 Columns */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Col 1 */}
              <div>
                 <h3 className="font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">Featured Products</h3>
                 <div className="flex flex-col gap-4">
                    {[1,2,3].map(idx => (
                       <div key={'f'+idx} className="flex gap-4 cursor-pointer group">
                          <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-lg p-2 flex shrink-0 items-center justify-center group-hover:border-blue-300">
                             <img src={`https://images.unsplash.com/photo-${['1505740420928-5e560c06d30e','1546435770-a3e426fbcf5f','1486401899868-0e435ed85128'][idx-1]}?w=100&q=80`} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="flex flex-col justify-center">
                             <h4 className="text-xs font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">Epson Home Cinema 5040UB</h4>
                             <p className="text-xs text-gray-500 mb-1">United State USA</p>
                             <p className="text-sm font-bold text-gray-800">{FORMAT_CURRENCY(780.00)}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Col 2 */}
              <div>
                 <h3 className="font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">Top Rated Products</h3>
                 <div className="flex flex-col gap-4">
                    {[1,2,3].map(idx => (
                       <div key={'tr'+idx} className="flex gap-4 cursor-pointer group">
                          <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-lg p-2 flex shrink-0 items-center justify-center group-hover:border-blue-300">
                             <img src={`https://images.unsplash.com/photo-${['1598327105666-5b89351cb31b','1608043152269-423dbba4e7e1','1545454675-3531b543be5d'][idx-1]}?w=100&q=80`} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="flex flex-col justify-center">
                             <h4 className="text-xs font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">Epson Home Cinema 5040UB</h4>
                             <p className="text-sm font-bold text-gray-800">{FORMAT_CURRENCY(780.00)}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Col 3 */}
              <div>
                 <h3 className="font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">Top Selling Products</h3>
                 <div className="flex flex-col gap-4">
                    {[1,2,3].map(idx => (
                       <div key={'ts'+idx} className="flex gap-4 cursor-pointer group">
                          <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-lg p-2 flex shrink-0 items-center justify-center group-hover:border-blue-300">
                             <img src={`https://images.unsplash.com/photo-${['1505740420928-5e560c06d30e','1598327105666-5b89351cb31b','1486401899868-0e435ed85128'][idx-1]}?w=100&q=80`} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="flex flex-col justify-center">
                             <h4 className="text-xs font-bold text-gray-800 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">Epson Home Cinema 5040UB</h4>
                             <p className="text-sm font-bold text-gray-800">{FORMAT_CURRENCY(780.00)}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </main>

      {/* Footer minimal version */}
      <footer className="border-t border-gray-200 pt-16 pb-8 bg-gray-50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
           <div>
             <div className="flex items-center gap-2 shrink-0 mb-6">
                {storefrontConfig?.header?.logoImage ? (
                  <img src={storefrontConfig.header.logoImage} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">{storefrontConfig?.header?.logoLetter || 'e'}</div>
                )}
                <div className="flex flex-col">
                   <span className="font-bold text-xl tracking-tighter text-gray-800 leading-none">{storefrontConfig?.header?.storeName || 'e-come'}</span>
                   <span className="text-[8px] text-gray-500 tracking-wider">{storefrontConfig?.header?.tagline || 'The online digital world'}</span>
                </div>
             </div>
             <p className="text-sm text-gray-600 mb-2 flex items-start gap-2"><MapPin size={16} className="shrink-0 mt-0.5"/> {storefrontConfig?.footer?.address || '45 Grand Central Terminal New York, NY 1017 United State USA'}</p>
             <p className="text-sm text-gray-600 mb-2 flex items-center gap-2"><Headphones size={16} className="shrink-0"/> {storefrontConfig?.footer?.phone || '(+123) 456 789 - (+123) 666 888'}</p>
           </div>

           <div>
              <h4 className="font-bold text-gray-800 mb-6">Quick menu</h4>
              <ul className="text-sm text-gray-600 space-y-3">
                 {pagesList.map((p, i) => (
                   <li key={i}><button onClick={() => { setActiveInfoTopic({ id: p.slug?.replace('/', ''), title: p.title, content: p.content || 'Content coming soon...' }); setView('info'); }} className="hover:text-blue-500">{p.title}</button></li>
                 ))}
                 {pagesList.length === 0 && (
                   <>
                     <li><a href="#" className="hover:text-blue-500">TV & Video</a></li>
                     <li><a href="#" className="hover:text-blue-500">Home Audio & Theater</a></li>
                     <li><a href="#" className="hover:text-blue-500">Camera, Photo & Video</a></li>
                     <li><a href="#" className="hover:text-blue-500">Cell Phones & Accessories</a></li>
                   </>
                 )}
              </ul>
           </div>

           <div>
              <h4 className="font-bold text-gray-800 mb-6">Customer Service</h4>
              <ul className="text-sm text-gray-600 space-y-3">
                 <li><button onClick={() => { if (user) setView('profile'); else setIsAuthOpen(true); }} className="hover:text-blue-500">My Account</button></li>
                 <li><button onClick={() => setActiveInfoTopic({title: 'Track your Order', content: 'Enter your Tracking ID to monitor the status of your shipment. Tracking numbers are sent via email once your order has been dispatched.'})} className="hover:text-blue-500">Track your Order</button></li>
                 <li><button onClick={() => setActiveInfoTopic({title: 'Returns/Exchange', content: 'We accept returns within 30 days of purchase. Please ensure items are in their original condition.'})} className="hover:text-blue-500">Returns/Exchange</button></li>
                 <li><button onClick={() => setActiveInfoTopic({title: 'FAQs', content: 'Explore our FAQ section to find answers to our most commonly asked questions regarding shipping, returns, and product care.'})} className="hover:text-blue-500">FAQs</button></li>
              </ul>
           </div>

           <div>
             <h4 className="font-bold text-gray-800 mb-6">Subscription</h4>
             <p className="text-sm text-gray-600 mb-4">Register now to get updates on promotions and coupons.</p>
             <div className="flex">
                <input type="email" placeholder="Enter your email address" className="bg-white border border-gray-300 rounded-l-md px-4 py-2 text-sm w-full focus:outline-none focus:border-blue-500" />
                <button className="bg-blue-400 text-white px-4 py-2 text-sm rounded-r-md font-bold hover:bg-blue-500">Subscribe</button>
             </div>
           </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between border-t border-gray-200 pt-8">
           <p className="text-xs text-gray-500 mb-4 md:mb-0">{storefrontConfig?.footer?.copyright || '© 2026 e-come Theme. All rights reserved.'}</p>
           <button 
            onClick={() => setView('admin')}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 border border-gray-300 px-4 py-2 rounded-full hover:border-blue-400 transition-colors"
          >
            <ShieldCheck size={14} /> Admin Dashboard
          </button>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <AITryOnModal 
        isOpen={!!tryOnProduct} 
        product={tryOnProduct} 
        onClose={() => setTryOnProduct(null)} 
      />
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
        clearCart={() => setCart([])}
      />
      
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
      
      {activeInfoTopic && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in relative">
             <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
               <h3 className="font-bold text-lg text-gray-800">{activeInfoTopic.title}</h3>
               <button onClick={() => setActiveInfoTopic(null)} className="text-gray-400 hover:text-gray-600">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
               </button>
             </div>
             <p className="text-gray-600 leading-relaxed mb-6">{activeInfoTopic.content}</p>
             <button onClick={() => setActiveInfoTopic(null)} className="w-full py-2 bg-gray-100 font-bold text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}

