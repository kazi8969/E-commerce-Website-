import React, { useState } from 'react';
import { ShoppingBag, Search, User, Heart, MapPin, Truck, ShieldCheck, HelpCircle, Smartphone, ChevronDown, Check, X } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAuthClick: () => void;
  config?: any;
  categories?: any[];
  onSearch?: (query: string, category?: string) => void;
  onCategorySelect?: (category: string) => void;
  onNavigateHome?: () => void;
  onPageLinkClick?: (url: string) => void;
  currency?: string;
  onCurrencyChange?: (c: string) => void;
}

export default function Navbar({ cartCount, onCartClick, onAuthClick, config, categories = [], onSearch, onCategorySelect, onNavigateHome, onPageLinkClick, currency = 'USD', onCurrencyChange }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInfoTopic, setActiveInfoTopic] = useState<{title: string, content: string} | null>(null);
  const [currentLang, setCurrentLang] = useState('English');
  const [isDeptsOpen, setIsDeptsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchCategory, setSearchCategory] = useState('All categories');
  const [isSearchCategoryOpen, setIsSearchCategoryOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSearch = (e?: React.FormEvent, term?: string) => {
    if (e) e.preventDefault();
    const query = term || searchQuery;
    if (onSearch && query.trim()) {
      const newRecent = [query.trim(), ...recentSearches.filter(s => s !== query.trim())].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
      onSearch(query.trim(), searchCategory === 'All categories' ? undefined : searchCategory);
      setSearchQuery(query.trim());
      setIsSearchFocused(false);
    }
  };

  return (
    <div className="w-full bg-white relative z-50">
      {/* Top Banner */}
      {config?.topBanner?.visible !== false && (
        <div className="h-12 bg-gradient-to-r from-red-600 via-pink-600 to-purple-800 text-white flex items-center justify-between px-4 lg:px-8">
          <div className="flex w-full justify-center lg:justify-between items-center max-w-7xl mx-auto">
            <div className="hidden lg:flex items-center gap-4 text-xs font-medium">
               <span className="flex items-center gap-2"><span className="animate-pulse bg-white text-red-600 px-2 py-1 rounded-full font-bold">{config?.topBanner?.badge || 'Up to 75% Off'}</span> {config?.topBanner?.text || 'CYBER MONDAY SALE'}</span>
            </div>
            <div className="text-sm font-bold tracking-widest text-center w-full lg:w-auto">{config?.topBanner?.text || 'CYBER MONDAY SALE'}</div>
            <a href={config?.topBanner?.buttonLink || '#'} className="hidden lg:flex px-4 py-1 text-xs border border-white rounded font-medium hover:bg-white hover:text-pink-600 transition-colors uppercase">{config?.topBanner?.buttonText || 'SHOP NOW'}</a>
          </div>
        </div>
      )}

      {/* Secondary Bar */}
      <div className="bg-gray-50 border-b border-gray-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-10 flex items-center justify-between text-xs text-gray-600 relative">
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveInfoTopic({title: 'Store Location', content: 'Our main store is located at 123 Commerce St. We are open Monday to Friday from 9 AM to 8 PM.'})} className="flex items-center gap-2 hover:text-blue-600 transition-colors"><MapPin size={14} /> Store Location</button>
            <button onClick={() => setActiveInfoTopic({title: 'Track Your Order', content: 'Enter your Tracking ID to monitor the status of your shipment. Tracking numbers are sent via email once your order has been dispatched.'})} className="flex items-center gap-2 hover:text-blue-600 transition-colors"><Truck size={14} /> Track Your Order</button>
          </div>
          <div className="flex items-center gap-6 relative">
            <button onClick={() => setActiveInfoTopic({title: 'Buyer Protection', content: 'We offer a robust Buyer Protection policy. If your item does not arrive or is significantly not as described, you can request a full refund within 30 days.'})} className="flex items-center gap-2 hover:text-blue-600 transition-colors"><ShieldCheck size={14} /> Buyer Protection</button>
            <button onClick={() => setActiveInfoTopic({title: 'Help Center', content: 'If you need any assistance, reach out to our fully dedicated 24/7 customer support line or explore our FAQ documentation.'})} className="flex items-center gap-2 hover:text-blue-600 transition-colors"><HelpCircle size={14} /> Help</button>
            <button onClick={() => setActiveInfoTopic({title: 'App Discount', content: 'Download our Mobile App and use code APP20 at checkout for an instant 20% discount on your next order!'})} className="flex items-center gap-2 hover:text-blue-600 transition-colors"><Smartphone size={14} /> Save big on our app!</button>
            <span className="w-px h-4 bg-gray-300"></span>
            <div className="relative group flex items-center">
              <div id="google_translate_element" className="scale-90 origin-left"></div>
            </div>
            <div className="relative group z-50">
              <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 pb-2">{currency} <ChevronDown size={12} /></div>
              <div className="absolute top-full right-0 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-32 py-2 max-h-64 overflow-y-auto z-50">
                 {Intl.supportedValuesOf('currency').map(cur => (
                    <button key={cur} onClick={() => onCurrencyChange && onCurrencyChange(cur)} className="block w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between text-xs">
                       {cur} {currency === cur && <Check size={12} className="text-blue-500" />}
                    </button>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeInfoTopic && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
             <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
               <h3 className="font-bold text-lg text-gray-800">{activeInfoTopic.title}</h3>
               <button onClick={() => setActiveInfoTopic(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
             </div>
             <p className="text-gray-600 leading-relaxed mb-6">{activeInfoTopic.content}</p>
             <button onClick={() => setActiveInfoTopic(null)} className="w-full py-2 bg-gray-100 font-bold text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Got it</button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex items-center justify-between gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={onNavigateHome}>
          {config?.header?.logoImage ? (
            <img src={config.header.logoImage} alt="Logo" className="w-10 h-10 object-contain" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">{config?.header?.logoLetter || 'e'}</div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-2xl tracking-tighter text-gray-800 leading-none">{config?.header?.storeName || 'e-come'}</span>
            <span className="text-[10px] text-gray-500 tracking-wider">{config?.header?.tagline || 'The online digital world'}</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-2xl hidden lg:flex flex-col relative z-[60]">
          <form onSubmit={handleSearch} className="flex items-center border-2 border-gray-200 rounded-full overflow-hidden bg-gray-50 h-12 w-full focus-within:border-blue-500 transition-colors relative z-[60]">
            <input 
              type="text" 
              placeholder="I'm shopping for..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="flex-1 bg-transparent px-6 outline-none text-sm text-gray-700 w-full" 
            />
            <div className="h-6 w-px bg-gray-300"></div>
            <div 
              className="px-4 text-sm text-gray-700 flex items-center gap-2 whitespace-nowrap cursor-pointer relative group"
              onMouseEnter={() => setIsSearchCategoryOpen(true)}
              onMouseLeave={() => setIsSearchCategoryOpen(false)}
            >
              {searchCategory} <ChevronDown size={14} className="text-gray-400" />
              {isSearchCategoryOpen && (
                 <div className="absolute top-[48px] right-0 bg-white border border-gray-200 rounded-lg shadow-xl w-56 py-2 z-50">
                    <button type="button" onClick={() => { setSearchCategory('All categories'); setIsSearchCategoryOpen(false); }} className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${searchCategory === 'All categories' ? 'font-bold text-blue-600' : ''}`}>All categories</button>
                    {(categories.length > 0 ? categories : [
                      { name: 'TV & Video' },
                      { name: 'Home Audio' },
                      { name: 'Computers' },
                      { name: 'Electronics' }
                    ]).map((dept: any) => (
                      <button type="button" key={dept.name} onClick={() => { setSearchCategory(dept.name); setIsSearchCategoryOpen(false); }} className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm truncate ${searchCategory === dept.name ? 'font-bold text-blue-600' : ''}`}>{dept.name}</button>
                    ))}
                 </div>
              )}
            </div>
            <button type="submit" className="h-full px-6 bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors">
              <Search size={18} />
            </button>
          </form>
          
          {isSearchFocused && recentSearches.length > 0 && (
            <div className="absolute top-[56px] left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center border-b border-gray-100 mb-1">
                Recent Searches
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRecentSearches([]); localStorage.removeItem('recentSearches'); setIsSearchFocused(false); }}
                  className="text-gray-400 hover:text-red-500 lowercase normal-case text-xs transition-colors"
                >
                  Clear All
                </button>
              </div>
              {recentSearches.map((term, i) => (
                <div 
                  key={i} 
                  className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between text-sm text-gray-700 group transition-colors"
                  onClick={() => handleSearch(undefined, term)}
                >
                  <div className="flex items-center gap-3">
                    <Search size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="font-medium">{term}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newRecent = recentSearches.filter(s => s !== term);
                      setRecentSearches(newRecent);
                      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
                      // Keep focus if we just deleted an item
                      const el = document.querySelector('input');
                      if (el) (el as HTMLInputElement).focus();
                    }}
                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 px-4">
            <span>Most searched:</span>
            {['umbrella', 'hair accessories', 'diamond', 'painting slime', 'sunglasses'].map(term => (
               <button key={term} onClick={() => handleSearch(undefined, term)} className="hover:text-blue-500 text-left transition-colors font-medium">{term}</button>
            ))}
          </div>
        </div>

        {/* Actions & Contact */}
        <div className="flex items-center gap-8 shrink-0">
          <div className="hidden xl:flex items-center gap-3">
             <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500">
               <Smartphone size={20} />
             </div>
             <div className="flex flex-col">
               <span className="text-xs text-gray-500">Call Us Free</span>
               <span className="font-bold text-lg text-gray-800">{config?.header?.supportPhone || '(+123) 456 789'}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={onAuthClick} className="p-2 text-gray-700 hover:text-blue-600 transition-colors">
              <User size={24} />
            </button>
            <button className="p-2 text-gray-700 hover:text-pink-600 transition-colors relative">
              <Heart size={24} />
            </button>
            <button onClick={onCartClick} className="flex items-center gap-2 group">
              <div className="relative">
                <ShoppingBag size={24} className="text-gray-700 group-hover:text-blue-600 transition-colors" />
                <span className="absolute -top-1 -right-2 bg-pink-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="border-t border-gray-200 border-b">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-14 flex items-center gap-8">
           {/* All Departments Dropdown */}
           <div 
             className="relative h-full flex items-center gap-3 w-64 bg-gradient-to-r from-purple-500 to-blue-400 text-white px-6 font-bold text-sm tracking-wide rounded-t-lg mt-1 cursor-pointer z-[100]"
             onClick={() => setIsDeptsOpen(!isDeptsOpen)}
           >
              <div className="flex flex-col gap-1 w-4">
                <span className="w-full h-0.5 bg-white rounded-full"></span>
                <span className="w-full h-0.5 bg-white rounded-full"></span>
                <span className="w-3/4 h-0.5 bg-white rounded-full"></span>
              </div>
              All Departments
              <ChevronDown size={16} className={`ml-auto transition-transform ${isDeptsOpen ? 'rotate-180' : ''}`} />
              <div className={`absolute top-[52px] left-0 w-full bg-white border border-gray-200 rounded-b-lg shadow-lg transition-all z-[100] ${isDeptsOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                {(categories.length > 0 ? categories : [
                  { name: 'New Arrivals', isHot: false },
                  { name: 'Top 100 Best Seller', isHot: true },
                  { name: 'TV & Video', isHot: false },
                  { name: 'Home Audio', isHot: false },
                  { name: 'Computers', isHot: false }
                ]).map((dept: any, i: number) => (
                  <div key={i} onClick={() => onCategorySelect && onCategorySelect(dept.name)} className="px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-2">
                    {dept.name}
                    {dept.isHot && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">HOT</span>}
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="p-4 text-xs text-gray-400 text-center">No categories configured</div>
                )}
              </div>
           </div>

           <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-gray-800 flex-1">
             {(config?.mainMenu || [
               { type: 'home', label: 'Home' },
               { type: 'shop', label: 'Shop', badge: 'Sale', badgeColor: 'green' },
               { type: 'link', label: 'Mega Menu', url: '#' },
               { type: 'link', label: 'Pages', badge: 'New', badgeColor: 'blue', url: '#' },
               { type: 'link', label: 'Blog', url: '#' }
             ]).map((item: any, idx: number) => {
               const badgeComponent = item.badge ? (
                 <span className={`text-[9px] text-white px-1.5 py-0.5 rounded uppercase absolute -top-5 ${item.badgeColor === 'green' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse shadow-sm`} style={{ left: 'calc(100% - 10px)' }}>{item.badge}</span>
               ) : null;

               if (item.type === 'home') {
                 return <button key={idx} onClick={onNavigateHome} className="hover:text-blue-600 relative flex items-center gap-1">{item.label}{badgeComponent}</button>
               }
               if (item.type === 'shop') {
                 return <button key={idx} onClick={() => onCategorySelect && onCategorySelect('')} className="hover:text-blue-600 relative flex items-center gap-1">{item.label}{badgeComponent}</button>
               }
               if (item.type === 'page') {
                 return <a key={idx} href={item.url || '#'} onClick={(e) => { e.preventDefault(); if (onPageLinkClick && item.url) onPageLinkClick(item.url); }} className="hover:text-blue-600 relative flex items-center gap-1">{item.label}{badgeComponent}</a>
               }
               return <a key={idx} href={item.url || '#'} className="hover:text-blue-600 relative flex items-center gap-1">{item.label}{badgeComponent}</a>
             })}
           </div>

           <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
             <ShoppingBag size={16} /> Free Shipping on Orders $100
           </div>
        </div>
      </div>
    </div>
  );
}
