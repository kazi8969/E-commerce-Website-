import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout, Image as ImageIcon, Save, CheckCircle, Plus, Trash2, Home, ShoppingBag, Menu, FileText, Rss, Star, X } from 'lucide-react';

export default function StorefrontManager() {
  const [activeTab, setActiveTab] = useState('Home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({
    features: [
      {
        title: 'Worldwide Delivery',
        description: 'With sites in 5 languages, we ship to over 200 countries & regions.',
        icon: 'Truck'
      },
      {
        title: 'Safe Payment',
        description: "Pay with the world's most popular and secure payment methods.",
        icon: 'CreditCard'
      },
      {
        title: '24/7 Help Center',
        description: 'Round-the-clock assistance for a smooth shopping experience.',
        icon: 'Headphones'
      }
    ],
    header: {
      storeName: 'e-come',
      logoLetter: 'e',
      tagline: 'The online digital world',
      supportPhone: '(+123) 456 789'
    },
    footer: {
      address: '45 Grand Central Terminal New York, NY 1017 United State USA',
      phone: '(+123) 456 789 - (+123) 666 888',
      copyright: '© 2026 e-come Theme. All rights reserved.'
    },
    departments: [
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
    ],
    categories: [
      {
        name: 'TV & Video',
        image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&q=80',
        items: 'Televisions,Blu-ray Players,Streaming Media Players,Home Audio'
      },
      {
        name: 'Home Audio & Theater',
        image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&q=80',
        items: 'Speakers,Streaming audio,Stereo system components,Headphones'
      },
      {
        name: 'Camera & Photo',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&q=80',
        items: 'Accessories,Lenses,Lighting & Studio,Video'
      },
      {
        name: 'Computers & Accessories',
        image: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=300&q=80',
        items: 'Tablets,Desktops,Computer Accessories,PC Gaming'
      }
    ],
    topBanner: {
      text: 'CYBER MONDAY SALE',
      badge: 'Up to 75% Off',
      buttonText: 'SHOP NOW',
      buttonLink: '#',
      visible: true
    },
    hero: {
      slides: [
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
      ],
      rightBanner1: { title: 'Playstation 4\\ngame pro', price: '29.99', image: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=300&q=80', link: '#' },
      rightBanner2: { title: 'Smart phone\\nmix 2', price: '99.99', image: 'https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=300&q=80', link: '#' }
    },
    promoBanners: [
      { id: 1, title: 'The pro stage for\\nyour home', price: '69.99', image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&q=80', link: '#' },
      { id: 2, title: 'Smart speaker for\\nmusic lovers', price: '39.99', image: 'https://images.unsplash.com/photo-1589003071515-20ac88d7f353?w=400&q=80', link: '#' }
    ],
    brands: [
      { name: 'sixbase', style: 'font-bold text-2xl tracking-widest uppercase' },
      { name: 'pelicon', style: 'font-bold text-2xl italic' },
      { name: 'SOUND))', style: 'font-bold text-3xl font-serif' },
      { name: 'VIGOR', style: 'font-bold text-2xl uppercase tracking-tighter' },
      { name: 'falsan', style: 'font-light text-2xl italic font-serif' },
      { name: 'TRULL', style: 'font-black text-2xl tracking-widest' }
    ],
    featuredBrand: {
      name: 'SOUND))',
      description: 'All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet.',
      link: '#'
    },
    bottomBanner: {
      title: 'Free Shipping on Orders $50',
      buttonText: 'Shop now',
      link: '#',
      image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=1600'
    },
    shopLayout: {
      gridColumns: 4,
      itemsPerPage: 12,
      sidebarFilters: {
        categories: true,
        priceRange: true,
        attributes: true
      },
      sorting: {
        default: true,
        price: true,
        date: true
      },
      paginationStyle: 'numbers'
    }
  });

  const [pagesList, setPagesList] = useState<any[]>([]);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);

  const handleEditPage = (page: any) => {
    setEditingPage(page);
    setIsPageModalOpen(true);
  };

  const handleCreatePage = () => {
    setEditingPage(null);
    setIsPageModalOpen(true);
  };

  const handleDeletePage = async (pageId: string) => {
    if (confirm('Are you sure you want to delete this page?')) {
      try {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'pages', pageId));
      } catch (err) {
        console.error('Error deleting page:', err);
        alert('Failed to delete page.');
      }
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'storefront'));
        if (snap.exists()) {
          setConfig(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();

    const unsubPages = onSnapshot(collection(db, 'pages'), (snapshot) => {
      const pgs: any[] = [];
      snapshot.forEach(doc => pgs.push({ id: doc.id, ...doc.data() }));
      setPagesList(pgs);
    });
    return () => unsubPages();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'storefront'), config);
      alert('Storefront configured successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save config.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 p-8">Loading configuration...</div>;

  const tabs = [
    { id: 'Home', icon: Home },
    { id: 'Shop', icon: ShoppingBag },
    { id: 'Mega Menu', icon: Menu },
    { id: 'Pages', icon: FileText },
    { id: 'Blog', icon: Rss },
    { id: 'Brands', icon: Star }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl text-gray-800 flex items-center gap-3">
          <Layout className="text-blue-600" size={32} />
          Storefront Management
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 font-bold rounded shadow hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.id}
          </button>
        ))}
      </div>

      {activeTab === 'Home' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Header & Navbar */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm col-span-1 md:col-span-2">
           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><ImageIcon size={18} className="text-blue-500" /> Header & Navbar</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Store Name</label>
                  <input type="text" value={config.header.storeName} onChange={(e) => setConfig({ ...config, header: { ...config.header, storeName: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo Letter (Icon)</label>
                  <input type="text" value={config.header.logoLetter} onChange={(e) => setConfig({ ...config, header: { ...config.header, logoLetter: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 max-w-24" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo Image URL</label>
                  <input type="text" value={config.header.logoImage || ''} onChange={(e) => setConfig({ ...config, header: { ...config.header, logoImage: e.target.value }})} placeholder="Optional: Use image instead of letter" className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tagline</label>
                  <input type="text" value={config.header.tagline} onChange={(e) => setConfig({ ...config, header: { ...config.header, tagline: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Support Phone (Navbar)</label>
                  <input type="text" value={config.header.supportPhone} onChange={(e) => setConfig({ ...config, header: { ...config.header, supportPhone: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
               </div>
             </div>
             
             <div className="space-y-4 border-l border-gray-100 pl-6">
                 <h3 className="text-sm font-bold text-gray-700">Main Navigation Menu</h3>
                 <div className="space-y-2">
                   {(config.mainMenu || [
                     { type: 'home', label: 'Home' },
                     { type: 'shop', label: 'Shop', badge: 'Sale', badgeColor: 'green' },
                     { type: 'link', label: 'Mega Menu', url: '#' },
                     { type: 'link', label: 'Pages', badge: 'New', badgeColor: 'blue', url: '#' },
                     { type: 'link', label: 'Blog', url: '#' }
                   ]).map((item: any, idx: number) => (
                     <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded text-sm relative space-y-2">
                       <button onClick={() => {
                          const newMenu = [...(config.mainMenu || [
                             { type: 'home', label: 'Home' },
                             { type: 'shop', label: 'Shop', badge: 'Sale', badgeColor: 'green' },
                             { type: 'link', label: 'Mega Menu', url: '#' },
                             { type: 'link', label: 'Pages', badge: 'New', badgeColor: 'blue', url: '#' },
                             { type: 'link', label: 'Blog', url: '#' }
                          ])];
                          newMenu.splice(idx, 1);
                          setConfig({...config, mainMenu: newMenu});
                       }} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 bg-white rounded shadow-sm"><Trash2 size={12}/></button>
                       <div className="flex gap-2 pr-6">
                         <div className="flex-1">
                           <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Label</label>
                           <input type="text" value={item.label} onChange={(e) => {
                             const newMenu = [...(config.mainMenu || [
                               { type: 'home', label: 'Home' },
                               { type: 'shop', label: 'Shop', badge: 'Sale', badgeColor: 'green' },
                               { type: 'link', label: 'Mega Menu', url: '#' },
                               { type: 'link', label: 'Pages', badge: 'New', badgeColor: 'blue', url: '#' },
                               { type: 'link', label: 'Blog', url: '#' }
                             ])];
                             newMenu[idx].label = e.target.value;
                             setConfig({...config, mainMenu: newMenu});
                           }} className="w-full bg-white border border-gray-200 rounded p-1.5 focus:border-blue-500" />
                         </div>
                         <div className="w-1/3">
                           <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Type</label>
                           <select value={item.type} onChange={(e) => {
                             const newMenu = [...(config.mainMenu || [
                               { type: 'home', label: 'Home' },
                               { type: 'shop', label: 'Shop', badge: 'Sale', badgeColor: 'green' },
                               { type: 'link', label: 'Mega Menu', url: '#' },
                               { type: 'link', label: 'Pages', badge: 'New', badgeColor: 'blue', url: '#' },
                               { type: 'link', label: 'Blog', url: '#' }
                             ])];
                             newMenu[idx].type = e.target.value;
                             setConfig({...config, mainMenu: newMenu});
                           }} className="w-full bg-white border border-gray-200 rounded p-1.5 focus:border-blue-500 text-[10px]">
                             <option value="home">Home Link</option>
                             <option value="shop">Shop Link</option>
                             <option value="link">Custom URL</option>
                             <option value="page">Page Link</option>
                           </select>
                         </div>
                       </div>
                       
                       {item.type === 'link' && (
                         <div>
                           <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">URL / Link</label>
                           <input type="text" value={item.url || ''} onChange={(e) => {
                             const newMenu = [...(config.mainMenu || [
                               { type: 'home', label: 'Home' },
                               { type: 'shop', label: 'Shop', badge: 'Sale', badgeColor: 'green' },
                               { type: 'link', label: 'Mega Menu', url: '#' },
                               { type: 'link', label: 'Pages', badge: 'New', badgeColor: 'blue', url: '#' },
                               { type: 'link', label: 'Blog', url: '#' }
                             ])];
                             newMenu[idx].url = e.target.value;
                             setConfig({...config, mainMenu: newMenu});
                           }} className="w-full bg-white border border-gray-200 rounded p-1.5 focus:border-blue-500" placeholder="https://" />
                         </div>
                       )}

                       {item.type === 'page' && (
                         <div>
                           <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Select Page</label>
                           <select value={item.url || ''} onChange={(e) => {
                             const newMenu = [...(config.mainMenu || [
                               { type: 'home', label: 'Home' },
                               { type: 'shop', label: 'Shop', badge: 'Sale', badgeColor: 'green' },
                               { type: 'link', label: 'Mega Menu', url: '#' },
                               { type: 'link', label: 'Pages', badge: 'New', badgeColor: 'blue', url: '#' },
                               { type: 'link', label: 'Blog', url: '#' }
                             ])];
                             newMenu[idx].url = e.target.value;
                             setConfig({...config, mainMenu: newMenu});
                           }} className="w-full bg-white border border-gray-200 rounded p-1.5 focus:border-blue-500 text-sm">
                             <option value="">-- Select a page --</option>
                             {pagesList.map((p) => (
                               <option key={p.id} value={`/page/${p.slug || p.id}`}>{p.title}</option>
                             ))}
                           </select>
                         </div>
                       )}

                       <div className="flex gap-2">
                         <div className="flex-1">
                           <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Badge Text (Optional)</label>
                           <input type="text" value={item.badge || ''} onChange={(e) => {
                             const newMenu = [...(config.mainMenu || [
                               { type: 'home', label: 'Home' },
                               { type: 'shop', label: 'Shop', badge: 'Sale', badgeColor: 'green' },
                               { type: 'link', label: 'Mega Menu', url: '#' },
                               { type: 'link', label: 'Pages', badge: 'New', badgeColor: 'blue', url: '#' },
                               { type: 'link', label: 'Blog', url: '#' }
                             ])];
                             newMenu[idx].badge = e.target.value;
                             setConfig({...config, mainMenu: newMenu});
                           }} className="w-full bg-white border border-gray-200 rounded p-1.5 focus:border-blue-500" placeholder="e.g. Sale, Hot" />
                         </div>
                         <div className="w-1/3">
                           <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Color</label>
                           <select value={item.badgeColor || 'blue'} onChange={(e) => {
                             const newMenu = [...(config.mainMenu || [
                               { type: 'home', label: 'Home' },
                               { type: 'shop', label: 'Shop', badge: 'Sale', badgeColor: 'green' },
                               { type: 'link', label: 'Mega Menu', url: '#' },
                               { type: 'link', label: 'Pages', badge: 'New', badgeColor: 'blue', url: '#' },
                               { type: 'link', label: 'Blog', url: '#' }
                             ])];
                             newMenu[idx].badgeColor = e.target.value;
                             setConfig({...config, mainMenu: newMenu});
                           }} className="w-full bg-white border border-gray-200 rounded p-1.5 focus:border-blue-500 text-[10px]">
                             <option value="blue">Blue</option>
                             <option value="green">Green</option>
                             <option value="red">Red</option>
                           </select>
                         </div>
                       </div>
                     </div>
                   ))}
                   <button onClick={() => {
                     const newMenu = [...(config.mainMenu || [
                       { type: 'home', label: 'Home' },
                       { type: 'shop', label: 'Shop', badge: 'Sale', badgeColor: 'green' },
                       { type: 'link', label: 'Mega Menu', url: '#' },
                       { type: 'link', label: 'Pages', badge: 'New', badgeColor: 'blue', url: '#' },
                       { type: 'link', label: 'Blog', url: '#' }
                     ])];
                     newMenu.push({ type: 'link', label: 'New Link', url: '#' });
                     setConfig({...config, mainMenu: newMenu});
                   }} className="w-full py-2 bg-gray-50 border border-dashed border-gray-300 rounded text-blue-600 font-bold hover:bg-gray-100 flex justify-center items-center gap-1 text-sm"><Plus size={16}/> Add Item</button>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm col-span-1 md:col-span-2">
           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><ImageIcon size={18} className="text-blue-500" /> Footer Details</h2>
           <div className="space-y-4 max-w-2xl">
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                 <input type="text" value={config.footer.address} onChange={(e) => setConfig({ ...config, footer: { ...config.footer, address: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                 <input type="text" value={config.footer.phone} onChange={(e) => setConfig({ ...config, footer: { ...config.footer, phone: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Copyright Text</label>
                 <input type="text" value={config.footer.copyright} onChange={(e) => setConfig({ ...config, footer: { ...config.footer, copyright: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
              </div>
           </div>
        </div>

        {/* Store Features */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm col-span-1 md:col-span-2">
           <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
             <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ImageIcon size={18} className="text-blue-500" /> Store Features (Below Hero)</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(config.features || []).map((feature: any, index: number) => (
                <div key={index} className="space-y-4 p-4 border border-gray-200 rounded bg-gray-50">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Feature {index + 1} Title</label>
                      <input type="text" value={feature.title} onChange={(e) => {
                         const newFeatures = [...(config.features || [])];
                         newFeatures[index].title = e.target.value;
                         setConfig({...config, features: newFeatures});
                      }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                      <textarea value={feature.description} onChange={(e) => {
                         const newFeatures = [...(config.features || [])];
                         newFeatures[index].description = e.target.value;
                         setConfig({...config, features: newFeatures});
                      }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 h-20" />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lucide Icon Name</label>
                      <input type="text" value={feature.icon} onChange={(e) => {
                         const newFeatures = [...(config.features || [])];
                         newFeatures[index].icon = e.target.value;
                         setConfig({...config, features: newFeatures});
                      }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Top Banner */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><ImageIcon size={18} className="text-blue-500" /> Top Promotional Banner</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={config.topBanner.visible} onChange={(e) => setConfig({ ...config, topBanner: { ...config.topBanner, visible: e.target.checked }})} className="rounded text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Display Top Banner</span>
            </label>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Main Text</label>
              <input type="text" value={config.topBanner.text} onChange={(e) => setConfig({ ...config, topBanner: { ...config.topBanner, text: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Badge Text (e.g. Up to 75% Off)</label>
              <input type="text" value={config.topBanner.badge} onChange={(e) => setConfig({ ...config, topBanner: { ...config.topBanner, badge: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Button Text</label>
              <input type="text" value={config.topBanner.buttonText} onChange={(e) => setConfig({ ...config, topBanner: { ...config.topBanner, buttonText: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Button Link</label>
              <input type="text" value={config.topBanner.buttonLink} onChange={(e) => setConfig({ ...config, topBanner: { ...config.topBanner, buttonLink: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm col-span-1 md:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><ImageIcon size={18} className="text-blue-500" /> Hero Section Center Slider</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {(config.hero.slides || []).map((slide: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded space-y-2 relative">
                     <button onClick={() => {
                        const newSlides = [...config.hero.slides];
                        newSlides.splice(index, 1);
                        setConfig({ ...config, hero: { ...config.hero, slides: newSlides } });
                     }} className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white rounded p-1"><Trash2 size={14} /></button>
                     <h3 className="text-sm font-bold text-gray-700 mb-2">Slide {index + 1}</h3>
                     <input type="text" value={slide.image || ''} placeholder="Image URL" onChange={(e) => {
                        const newSlides = [...config.hero.slides];
                        newSlides[index].image = e.target.value;
                        setConfig({ ...config, hero: { ...config.hero, slides: newSlides } });
                     }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 mb-2" />
                     <input type="text" value={slide.subtitle || ''} placeholder="Subtitle" onChange={(e) => {
                        const newSlides = [...config.hero.slides];
                        newSlides[index].subtitle = e.target.value;
                        setConfig({ ...config, hero: { ...config.hero, slides: newSlides } });
                     }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 mb-2" />
                     <input type="text" value={slide.title || ''} placeholder="Title" onChange={(e) => {
                        const newSlides = [...config.hero.slides];
                        newSlides[index].title = e.target.value;
                        setConfig({ ...config, hero: { ...config.hero, slides: newSlides } });
                     }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 mb-2" />
                     <textarea value={slide.description || ''} placeholder="Description" onChange={(e) => {
                        const newSlides = [...config.hero.slides];
                        newSlides[index].description = e.target.value;
                        setConfig({ ...config, hero: { ...config.hero, slides: newSlides } });
                     }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 mb-2" rows={2} />
                     <div className="flex gap-2 mb-2">
                        <input type="text" value={slide.buttonText || ''} placeholder="Button Text" onChange={(e) => {
                           const newSlides = [...config.hero.slides];
                           newSlides[index].buttonText = e.target.value;
                           setConfig({ ...config, hero: { ...config.hero, slides: newSlides } });
                        }} className="flex-1 bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                        <input type="text" value={slide.buttonLink || ''} placeholder="Button Link" onChange={(e) => {
                           const newSlides = [...config.hero.slides];
                           newSlides[index].buttonLink = e.target.value;
                           setConfig({ ...config, hero: { ...config.hero, slides: newSlides } });
                        }} className="flex-1 bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                     </div>
                     <input type="text" value={slide.bgColor || ''} placeholder="Background Color (e.g., #8CE6FF or bg-blue-200)" onChange={(e) => {
                        const newSlides = [...config.hero.slides];
                        newSlides[index].bgColor = e.target.value;
                        setConfig({ ...config, hero: { ...config.hero, slides: newSlides } });
                     }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
               ))}
               <div className="flex items-center justify-center p-4 border border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50" onClick={() => {
                  const newSlides = config.hero.slides ? [...config.hero.slides] : [];
                  newSlides.push({ image: '', link: '#', subtitle: '', title: '', description: '', buttonText: '', buttonLink: '', bgColor: '#f9fafb' });
                  setConfig({ ...config, hero: { ...config.hero, slides: newSlides } });
               }}>
                  <div className="flex flex-col items-center text-blue-500 font-bold text-sm">
                     <Plus size={24} className="mb-2" /> Add Slide
                  </div>
               </div>
            </div>

            <div className="pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <h3 className="text-sm font-bold text-gray-700 mb-2">Right Banner 1 (Top)</h3>
                 <input type="text" value={config.hero.rightBanner1.title} placeholder="Title (use \n for line break)" onChange={(e) => setConfig({ ...config, hero: { ...config.hero, rightBanner1: { ...config.hero.rightBanner1, title: e.target.value } }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 mb-2" />
                 <input type="text" value={config.hero.rightBanner1.price} placeholder="Price" onChange={(e) => setConfig({ ...config, hero: { ...config.hero, rightBanner1: { ...config.hero.rightBanner1, price: e.target.value } }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 mb-2" />
                 <input type="text" value={config.hero.rightBanner1.image} placeholder="Image URL" onChange={(e) => setConfig({ ...config, hero: { ...config.hero, rightBanner1: { ...config.hero.rightBanner1, image: e.target.value } }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
               </div>

               <div className="space-y-2">
                 <h3 className="text-sm font-bold text-gray-700 mb-2">Right Banner 2 (Bottom)</h3>
                 <input type="text" value={config.hero.rightBanner2.title} placeholder="Title (use \n for line break)" onChange={(e) => setConfig({ ...config, hero: { ...config.hero, rightBanner2: { ...config.hero.rightBanner2, title: e.target.value } }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 mb-2" />
                 <input type="text" value={config.hero.rightBanner2.price} placeholder="Price" onChange={(e) => setConfig({ ...config, hero: { ...config.hero, rightBanner2: { ...config.hero.rightBanner2, price: e.target.value } }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 mb-2" />
                 <input type="text" value={config.hero.rightBanner2.image} placeholder="Image URL" onChange={(e) => setConfig({ ...config, hero: { ...config.hero, rightBanner2: { ...config.hero.rightBanner2, image: e.target.value } }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
               </div>
            </div>
          </div>
        </div>

        {/* Promo Banners */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm col-span-1 md:col-span-2">
           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><ImageIcon size={18} className="text-blue-500" /> Mid-Page Promo Banners</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {config.promoBanners.map((banner: any, index: number) => (
                <div key={index} className="space-y-2 p-4 bg-gray-50 border border-gray-200 rounded">
                   <h3 className="text-sm font-bold text-gray-700 mb-2">Promo Banner {index + 1}</h3>
                   <input type="text" value={banner.title} placeholder="Title (use \n for line break)" onChange={(e) => { const newBanners = [...config.promoBanners]; newBanners[index].title = e.target.value; setConfig({ ...config, promoBanners: newBanners }); }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                   <div className="flex gap-2">
                     <input type="text" value={banner.price} placeholder="Price" onChange={(e) => { const newBanners = [...config.promoBanners]; newBanners[index].price = e.target.value; setConfig({ ...config, promoBanners: newBanners }); }} className="w-1/3 bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                     <input type="text" value={banner.link} placeholder="Link" onChange={(e) => { const newBanners = [...config.promoBanners]; newBanners[index].link = e.target.value; setConfig({ ...config, promoBanners: newBanners }); }} className="w-2/3 bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                   </div>
                   <input type="text" value={banner.image} placeholder="Image URL" onChange={(e) => { const newBanners = [...config.promoBanners]; newBanners[index].image = e.target.value; setConfig({ ...config, promoBanners: newBanners }); }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                </div>
             ))}
           </div>
        </div>

        {/* Featured Brand */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><ImageIcon size={18} className="text-blue-500" /> Featured Brand Block</h2>
           <div className="space-y-4">
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Brand Name</label>
                 <input type="text" value={config.featuredBrand.name} onChange={(e) => setConfig({ ...config, featuredBrand: { ...config.featuredBrand, name: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                 <textarea value={config.featuredBrand.description} onChange={(e) => setConfig({ ...config, featuredBrand: { ...config.featuredBrand, description: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 h-24" />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link</label>
                 <input type="text" value={config.featuredBrand.link} onChange={(e) => setConfig({ ...config, featuredBrand: { ...config.featuredBrand, link: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
              </div>
           </div>
        </div>

        {/* Bottom Banner */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><ImageIcon size={18} className="text-blue-500" /> Bottom Full-width Banner</h2>
           <div className="space-y-4">
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                 <input type="text" value={config.bottomBanner.title} onChange={(e) => setConfig({ ...config, bottomBanner: { ...config.bottomBanner, title: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Background Image URL</label>
                 <input type="text" value={config.bottomBanner.image} onChange={(e) => setConfig({ ...config, bottomBanner: { ...config.bottomBanner, image: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Button Text</label>
                   <input type="text" value={config.bottomBanner.buttonText} onChange={(e) => setConfig({ ...config, bottomBanner: { ...config.bottomBanner, buttonText: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="w-1/2">
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Button Link</label>
                   <input type="text" value={config.bottomBanner.link} onChange={(e) => setConfig({ ...config, bottomBanner: { ...config.bottomBanner, link: e.target.value }})} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
           </div>
        </div>

        {/* Departments (Hero Sidebar) */}
        {/* Removed as requested - replaced by Custom Categories view */}

        {/* Categories */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm col-span-1 md:col-span-2">
           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><ImageIcon size={18} className="text-blue-500" /> Categories Displayed on Homepage</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {config.categories.map((cat: any, index: number) => (
                <div key={index} className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded">
                   <h3 className="text-sm font-bold text-gray-700 border-b border-gray-200 pb-1">Category {index + 1}</h3>
                   <div>
                     <label className="block text-xs text-gray-500 mb-1">Name</label>
                     <input type="text" value={cat.name} onChange={(e) => { const newCats = [...config.categories]; newCats[index].name = e.target.value; setConfig({ ...config, categories: newCats }); }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                     <input type="text" value={cat.image} onChange={(e) => { const newCats = [...config.categories]; newCats[index].image = e.target.value; setConfig({ ...config, categories: newCats }); }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-500 mb-1">Sub-items (comma separated)</label>
                     <textarea value={cat.items} onChange={(e) => { const newCats = [...config.categories]; newCats[index].items = e.target.value; setConfig({ ...config, categories: newCats }); }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 h-20 leading-tight" />
                   </div>
                </div>
             ))}
           </div>
        </div>

      </div>
      )}

      {activeTab === 'Shop' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2"><ShoppingBag size={18} className="text-blue-500" /> Shop Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Grid Layout & Pagination */}
              <div className="space-y-6">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Products Grid Columns</label>
                   <select 
                     value={config.shopLayout?.gridColumns || 4} 
                     onChange={(e) => setConfig({...config, shopLayout: {...(config.shopLayout || {}), gridColumns: parseInt(e.target.value)}})}
                     className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                   >
                     <option value={2}>2 Columns</option>
                     <option value={3}>3 Columns</option>
                     <option value={4}>4 Columns</option>
                     <option value={5}>5 Columns</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Products Per Page</label>
                   <select 
                     value={config.shopLayout?.itemsPerPage || 12} 
                     onChange={(e) => setConfig({...config, shopLayout: {...(config.shopLayout || {}), itemsPerPage: parseInt(e.target.value)}})}
                     className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                   >
                     <option value={12}>12 Products</option>
                     <option value={24}>24 Products</option>
                     <option value={36}>36 Products</option>
                     <option value={48}>48 Products</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Pagination Style</label>
                   <select 
                     value={config.shopLayout?.paginationStyle || 'numbers'} 
                     onChange={(e) => setConfig({...config, shopLayout: {...(config.shopLayout || {}), paginationStyle: e.target.value}})}
                     className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                   >
                     <option value="numbers">Page Numbers (Classic)</option>
                     <option value="load-more">Load More Button</option>
                   </select>
                </div>
              </div>

              {/* Sidebar Filters & Sorting */}
              <div className="space-y-6">
                <div>
                  <h3 className="block text-sm font-bold text-gray-700 mb-4">Sidebar Filters</h3>
                  <div className="space-y-3 p-4 bg-gray-50 rounded border border-gray-200">
                     {[
                       { key: 'categories', label: 'Categories Filter' },
                       { key: 'priceRange', label: 'Price Range Filter' },
                       { key: 'attributes', label: 'Attributes/Color Filter' },
                     ].map(filter => (
                       <label key={filter.key} className="flex items-center gap-3 cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={config.shopLayout?.sidebarFilters?.[filter.key as keyof typeof config.shopLayout.sidebarFilters] ?? true}
                           onChange={(e) => setConfig({
                             ...config, 
                             shopLayout: {
                               ...(config.shopLayout || {}), 
                               sidebarFilters: {
                                 ...(config.shopLayout?.sidebarFilters || {}), 
                                 [filter.key]: e.target.checked
                               }
                             }
                           })}
                           className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                         />
                         <span className="text-sm text-gray-700">{filter.label}</span>
                       </label>
                     ))}
                  </div>
                </div>

                <div>
                  <h3 className="block text-sm font-bold text-gray-700 mb-4">Sorting Options</h3>
                  <div className="space-y-3 p-4 bg-gray-50 rounded border border-gray-200">
                     {[
                       { key: 'default', label: 'Default/Relevance Sorting' },
                       { key: 'price', label: 'Price (Low to High / High to Low)' },
                       { key: 'date', label: 'Date (Newest to Oldest)' },
                     ].map(sort => (
                       <label key={sort.key} className="flex items-center gap-3 cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={config.shopLayout?.sorting?.[sort.key as keyof typeof config.shopLayout.sorting] ?? true}
                           onChange={(e) => setConfig({
                             ...config, 
                             shopLayout: {
                               ...(config.shopLayout || {}), 
                               sorting: {
                                 ...(config.shopLayout?.sorting || {}), 
                                 [sort.key]: e.target.checked
                               }
                             }
                           })}
                           className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                         />
                         <span className="text-sm text-gray-700">{sort.label}</span>
                       </label>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2"><Star size={18} className="text-blue-500" /> Product Page Marketing</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Marketing Section Title</label>
                <input 
                  type="text" 
                  value={config.productMarketing?.title || ''} 
                  onChange={(e) => setConfig({...config, productMarketing: {...(config.productMarketing || {}), title: e.target.value}})}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. Designed for Excellence"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Marketing Main Text</label>
                <textarea 
                  value={config.productMarketing?.text || ''} 
                  onChange={(e) => setConfig({...config, productMarketing: {...(config.productMarketing || {}), text: e.target.value}})}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors h-24"
                  placeholder="Use {product.name} to insert the product's name dynamically."
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to use default. Use {'{product.name}'} variable to substitute the product name.</p>
              </div>

              <div>
                <h3 className="block text-sm font-bold text-gray-700 mb-4">Marketing Features (3 Items)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {((config.productMarketing?.features?.length ? config.productMarketing.features : null) || [
                    { title: 'Premium Materials', description: 'Sourced from the finest global artisans...', icon: 'Sparkles' },
                    { title: 'Expert Craftsmanship', description: 'Hand-finished by master craftspeople...', icon: 'ShieldCheck' },
                    { title: 'Timeless Design', description: 'A modern classic...', icon: 'Play' }
                  ]).map((feature: any, index: number) => (
                    <div key={index} className="space-y-4 p-4 border border-gray-200 rounded bg-gray-50">
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Feature {index + 1} Title</label>
                          <input type="text" value={feature.title} onChange={(e) => {
                             const newFeatures = [...(config.productMarketing?.features || [
                                { title: 'Premium Materials', description: 'Sourced from the finest global artisans...', icon: 'Sparkles' },
                                { title: 'Expert Craftsmanship', description: 'Hand-finished by master craftspeople...', icon: 'ShieldCheck' },
                                { title: 'Timeless Design', description: 'A modern classic...', icon: 'Play' }
                             ])];
                             newFeatures[index].title = e.target.value;
                             setConfig({...config, productMarketing: {...(config.productMarketing || {}), features: newFeatures}});
                          }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                          <textarea value={feature.description} onChange={(e) => {
                             const newFeatures = [...(config.productMarketing?.features || [
                                { title: 'Premium Materials', description: 'Sourced from the finest global artisans...', icon: 'Sparkles' },
                                { title: 'Expert Craftsmanship', description: 'Hand-finished by master craftspeople...', icon: 'ShieldCheck' },
                                { title: 'Timeless Design', description: 'A modern classic...', icon: 'Play' }
                             ])];
                             newFeatures[index].description = e.target.value;
                             setConfig({...config, productMarketing: {...(config.productMarketing || {}), features: newFeatures}});
                          }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500 h-24" />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lucide Icon Name</label>
                          <input type="text" value={feature.icon} onChange={(e) => {
                             const newFeatures = [...(config.productMarketing?.features || [
                                { title: 'Premium Materials', description: 'Sourced from the finest global artisans...', icon: 'Sparkles' },
                                { title: 'Expert Craftsmanship', description: 'Hand-finished by master craftspeople...', icon: 'ShieldCheck' },
                                { title: 'Timeless Design', description: 'A modern classic...', icon: 'Play' }
                             ])];
                             newFeatures[index].icon = e.target.value;
                             setConfig({...config, productMarketing: {...(config.productMarketing || {}), features: newFeatures}});
                          }} className="w-full bg-white border border-gray-200 rounded p-2 text-gray-800 text-sm focus:outline-none focus:border-blue-500" />
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Mega Menu' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2"><Menu size={18} className="text-blue-500" /> Mega Menu Builder</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Departments Vertical Menu */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800">Vertical Departments</h3>
                  <button 
                    onClick={() => setConfig({...config, departments: [...(config.departments || []), { name: 'New Department', isHot: false }]})}
                    className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add item
                  </button>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {(config.departments || []).map((dept: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 border border-gray-200 rounded bg-gray-50">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={dept.name}
                          onChange={(e) => {
                            const newDepts = [...config.departments];
                            newDepts[idx].name = e.target.value;
                            setConfig({...config, departments: newDepts});
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                        <button 
                          onClick={() => {
                            const newDepts = [...config.departments];
                            newDepts.splice(idx, 1);
                            setConfig({...config, departments: newDepts});
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dept.isHot}
                          onChange={(e) => {
                            const newDepts = [...config.departments];
                            newDepts[idx].isHot = e.target.checked;
                            setConfig({...config, departments: newDepts});
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                        Mark as "HOT"
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mega Menu Dropdowns (Categories) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800">Category Dropdowns & Promos</h3>
                  <button 
                    onClick={() => setConfig({...config, categories: [...(config.categories || []), { name: 'New Category', items: 'Sub Item 1, Sub Item 2', image: '' }]})}
                    className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Category
                  </button>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {(config.categories || []).map((cat: any, idx: number) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded bg-gray-50 flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Category Name</label>
                            <input
                              type="text"
                              value={cat.name}
                              onChange={(e) => {
                                const newCats = [...config.categories];
                                newCats[idx].name = e.target.value;
                                setConfig({...config, categories: newCats});
                              }}
                              className="w-full bg-white border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Sub-Items (Comma Separated)</label>
                            <textarea
                              value={cat.items}
                              onChange={(e) => {
                                const newCats = [...config.categories];
                                newCats[idx].items = e.target.value;
                                setConfig({...config, categories: newCats});
                              }}
                              rows={2}
                              className="w-full bg-white border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Promo Image URL</label>
                            <input
                              type="text"
                              value={cat.image}
                              onChange={(e) => {
                                const newCats = [...config.categories];
                                newCats[idx].image = e.target.value;
                                setConfig({...config, categories: newCats});
                              }}
                              placeholder="https://"
                              className="w-full bg-white border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const newCats = [...config.categories];
                            newCats.splice(idx, 1);
                            setConfig({...config, categories: newCats});
                          }}
                          className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {cat.image && (
                        <div className="mt-2 h-24 overflow-hidden rounded border border-gray-200 relative">
                           <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Pages' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileText size={18} className="text-blue-500" /> Pages Layouts Manager</h2>
               <button onClick={handleCreatePage} className="bg-blue-600 text-white px-4 py-2 text-sm font-bold rounded flex items-center gap-2 hover:bg-blue-700"><Plus size={16} /> Create New Page</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
                  <tr>
                    <th className="p-4 rounded-tl-lg">Page Title</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Last Updated</th>
                    <th className="p-4 rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagesList.map((page, i) => (
                    <tr key={page.id || i} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-800">{page.title}</td>
                      <td className="p-4 text-gray-500 text-sm font-mono">{page.slug}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${page.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{page.status}</span>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">{page.date || 'Today'}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleEditPage(page)} className="text-blue-600 hover:text-blue-800 text-sm font-bold mr-3">Edit</button>
                        <button onClick={() => handleDeletePage(page.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {pagesList.length === 0 && (
                     <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">No pages found.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Blog' && (
        <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm text-center">
          <Rss size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Blog Setting & Posts</h2>
          <p className="text-gray-500 max-w-md mx-auto">Manage your articles, categories, comments, and configure your blog's visual layout here.</p>
        </div>
      )}

      {activeTab === 'Brands' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2"><Star size={18} className="text-blue-500" /> Shop by Brand Manager</h2>
              <button 
                onClick={() => setConfig({...config, brands: [...(config.brands || []), { name: 'New Brand', logo: '' }]})}
                className="bg-blue-600 text-white px-4 py-2 text-sm font-bold rounded flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus size={16} /> Add Brand
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(config.brands || []).map((brand: any, idx: number) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Brand {idx + 1}</span>
                     <button 
                       onClick={() => {
                         const newBrands = [...(config.brands || [])];
                         newBrands.splice(idx, 1);
                         setConfig({...config, brands: newBrands});
                       }}
                       className="p-1 text-red-500 hover:bg-red-50 rounded"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                   
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Brand Name</label>
                      <input
                        type="text"
                        value={brand.name}
                        onChange={(e) => {
                          const newBrands = [...config.brands];
                          newBrands[idx].name = e.target.value;
                          setConfig({...config, brands: newBrands});
                        }}
                        placeholder="e.g. Nike"
                        className="w-full bg-white border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                   </div>

                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Brand Logo URL</label>
                      <input
                        type="text"
                        value={brand.logo}
                        onChange={(e) => {
                          const newBrands = [...config.brands];
                          newBrands[idx].logo = e.target.value;
                          setConfig({...config, brands: newBrands});
                        }}
                        placeholder="https://"
                        className="w-full bg-white border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                   </div>

                   {brand.logo && (
                     <div className="mt-2 h-20 bg-white border border-gray-200 rounded flex items-center justify-center p-2">
                        <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain" />
                     </div>
                   )}
                </div>
              ))}
              
              {(!config.brands || config.brands.length === 0) && (
                <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  No brands configured yet. Click "Add Brand" to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isPageModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold">{editingPage?.id ? 'Edit Page' : 'Create New Page'}</h2>
              <button onClick={() => setIsPageModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={editingPage?.title || ''} 
                  onChange={(e) => setEditingPage({...editingPage, title: e.target.value, slug: (editingPage?.slug || `/${e.target.value.toLowerCase().replace(/\\s+/g, '-')}`)})} 
                  className="w-full border border-gray-200 rounded p-2 focus:border-blue-500 focus:outline-none" 
                  placeholder="e.g. About Us"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Slug</label>
                  <input 
                    type="text" 
                    value={editingPage?.slug || ''} 
                    onChange={(e) => setEditingPage({...editingPage, slug: e.target.value})} 
                    className="w-full border border-gray-200 rounded p-2 focus:border-blue-500 focus:outline-none" 
                    placeholder="e.g. /about-us"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select 
                    value={editingPage?.status || 'Draft'}
                    onChange={(e) => setEditingPage({...editingPage, status: e.target.value})} 
                    className="w-full border border-gray-200 rounded p-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Content (Markdown / HTML)</label>
                <textarea 
                  value={editingPage?.content || ''} 
                  onChange={(e) => setEditingPage({...editingPage, content: e.target.value})} 
                  className="w-full border border-gray-200 rounded p-2 h-64 font-mono text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Page content goes here..."
                ></textarea>
              </div>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button 
                onClick={() => setIsPageModalOpen(false)}
                className="px-4 py-2 font-bold text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    if (editingPage?.id) {
                      await updateDoc(doc(db, 'pages', editingPage.id), {
                        ...editingPage,
                        date: new Date().toLocaleDateString()
                      });
                    } else {
                      await addDoc(collection(db, 'pages'), {
                        ...editingPage,
                        date: new Date().toLocaleDateString(),
                        status: editingPage?.status || 'Draft'
                      });
                    }
                    setIsPageModalOpen(false);
                  } catch(e) {
                    console.error("Error saving page", e);
                    alert("Error saving page");
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                Save Page
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
