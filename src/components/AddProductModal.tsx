import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Save, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../data';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (product: any) => void;
  productToEdit?: Product | null;
  storefrontConfig?: any;
}

export default function AddProductModal({ isOpen, onClose, onSave, productToEdit, storefrontConfig }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('');
  const [weight, setWeight] = useState('');
  const [variants, setVariants] = useState<{name: string, values: string}[]>([]);
  const [marketingTitle, setMarketingTitle] = useState('');
  const [marketingText, setMarketingText] = useState('');
  const [marketingFeatures, setMarketingFeatures] = useState<{title: string, description: string, icon: string}[]>([]);
  const [storefrontDepartments, setStorefrontDepartments] = useState<any[]>([]);
  const [storefrontBrands, setStorefrontBrands] = useState<any[]>([]);

  useEffect(() => {
    import('firebase/firestore').then(({ collection, getDocs, doc, getDoc }) => {
      import('../lib/firebase').then(({ db }) => {
        getDocs(collection(db, 'categories')).then(snapshot => {
          const cats: any[] = [];
          snapshot.forEach(doc => cats.push(doc.data()));
          setStorefrontDepartments(cats);
        }).catch(err => console.error("Could not load categories:", err));

        getDoc(doc(db, 'settings', 'storefront')).then(snap => {
          if (snap.exists() && snap.data().brands) {
            setStorefrontBrands(snap.data().brands);
          }
        }).catch(err => console.error("Could not load brands:", err));
      });
    });
  }, []);

  useEffect(() => {
    if (productToEdit && isOpen) {
      setName(productToEdit.name || '');
      setPrice(productToEdit.price ? productToEdit.price.toString() : '');
      setCategory(productToEdit.category || '');
      setBrand(productToEdit.brand || '');
      setDescription(productToEdit.description || '');
      setImagePreview(productToEdit.imageUrl || null);
      setSku(productToEdit.sku || '');
      setStock(productToEdit.stock ? productToEdit.stock.toString() : '');
      setWeight(productToEdit.weight ? productToEdit.weight.toString() : '');
      setVariants(productToEdit.variants ? productToEdit.variants.map(v => ({ name: v.name, values: v.values.join(', ') })) : []);
      setMarketingTitle(productToEdit.marketing?.title || '');
      setMarketingText(productToEdit.marketing?.text || '');
      setMarketingFeatures(productToEdit.marketing?.features || []);
    } else if (isOpen) {
      setName('');
      setPrice('');
      setCategory('Fashion - Men');
      setBrand('');
      setDescription('');
      setImagePreview(null);
      setSku('');
      setStock('');
      setWeight('');
      setVariants([]);
      setMarketingTitle('');
      setMarketingText('');
      setMarketingFeatures([]);
    }
  }, [productToEdit, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 400;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          setImagePreview(dataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: productToEdit?.id,
        name,
        price: parseFloat(price) || 0,
        category,
        brand,
        description,
        imageUrl: imagePreview || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
        sku,
        stock: parseInt(stock) || 0,
        weight: parseFloat(weight) || 0,
        variants: variants.filter(v => v.name && v.values).map(v => ({
          name: v.name,
          values: v.values.split(',').map(s => s.trim()).filter(Boolean)
        })),
        marketing: (marketingTitle || marketingText || marketingFeatures.length > 0) ? {
          title: marketingTitle || null,
          text: marketingText || null,
          features: marketingFeatures.length > 0 ? marketingFeatures : null
        } : null
      });
    }
  };

  const addVariant = () => setVariants([...variants, { name: '', values: '' }]);
  const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index));
  const updateVariant = (index: number, field: 'name' | 'values', value: string) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[130] w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-serif text-2xl text-white italic">{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Product Name</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Royal Silk Panjabi" 
                        className="w-full bg-[#111] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Price (BDT)</label>
                      <input 
                        type="number" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 15000" 
                        className="w-full bg-[#111] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors rounded-lg appearance-none"
                      >
                        <option value="">Select a Category</option>
                        {storefrontDepartments.map((d: any) => (
                          <option key={d.id || d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Brand</label>
                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors rounded-lg appearance-none"
                      >
                        <option value="">Select a Brand</option>
                        {storefrontBrands.map((b: any) => (
                          <option key={b.name} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Product Image</label>
                    <label 
                      className="w-full h-full min-h-[200px] bg-[#111] border border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-[#D4AF37] transition-colors cursor-pointer group relative overflow-hidden block"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full py-12">
                          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] transition-colors">
                            <Upload size={20} />
                          </div>
                          <p className="text-sm font-medium">Click or drag image to upload</p>
                          <p className="text-xs text-gray-600 mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">SKU / Barcode</label>
                    <input 
                      type="text" 
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. BD-001" 
                      className="w-full bg-[#111] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Stock Quantity</label>
                    <input 
                      type="number" 
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="0" 
                      className="w-full bg-[#111] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Weight (kg)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 0.5" 
                      className="w-full bg-[#111] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Description</label>
                  <textarea 
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the product details, material, and care instructions..." 
                    className="w-full bg-[#111] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded-lg resize-y"
                  ></textarea>
                </div>

                <div className="border border-white/10 rounded-lg p-6 bg-[#111]/50">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">Variations (Color, Size, Options)</label>
                    <button 
                      onClick={addVariant}
                      className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] hover:text-white transition-colors"
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  </div>
                  
                  {variants.length === 0 ? (
                    <p className="text-xs text-gray-500">No variations added. (e.g. Size, Color)</p>
                  ) : (
                    <div className="space-y-4">
                      {variants.map((v, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                          <input 
                            type="text" 
                            value={v.name}
                            onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                            placeholder="e.g. Color" 
                            className="w-1/3 bg-black border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded"
                          />
                          <input 
                            type="text" 
                            value={v.values}
                            onChange={(e) => updateVariant(idx, 'values', e.target.value)}
                            placeholder="e.g. Red, Blue, Green (comma separated)" 
                            className="flex-1 bg-black border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded"
                          />
                          <button 
                            onClick={() => removeVariant(idx)}
                            className="p-2 text-gray-500 hover:text-red-500 transition-colors bg-white/5 rounded border border-white/5 hover:border-red-500/50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 border-t border-white/10 pt-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6">Product Marketing (Optional)</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Marketing Title</label>
                      <input 
                        type="text" 
                        value={marketingTitle}
                        onChange={(e) => setMarketingTitle(e.target.value)}
                        placeholder="e.g. Designed for Excellence" 
                        className="w-full bg-[#111] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Marketing Main Text</label>
                      <textarea 
                        rows={3}
                        value={marketingText}
                        onChange={(e) => setMarketingText(e.target.value)}
                        placeholder="Detailed marketing description..." 
                        className="w-full bg-[#111] border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded-lg resize-y"
                      ></textarea>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">Marketing Features (Up to 3)</label>
                        {marketingFeatures.length < 3 && (
                          <button 
                            type="button"
                            onClick={() => setMarketingFeatures([...marketingFeatures, {title: '', description: '', icon: 'Sparkles'}])}
                            className="text-[#D4AF37] hover:text-white text-xs font-bold tracking-widest uppercase transition-colors"
                          >
                            + Add Feature
                          </button>
                        )}
                      </div>

                      {marketingFeatures.length > 0 && (
                        <div className="space-y-4">
                          {marketingFeatures.map((f, idx) => (
                            <div key={idx} className="p-4 border border-white/10 rounded-lg bg-black/50 space-y-4 relative">
                              <button 
                                onClick={() => setMarketingFeatures(marketingFeatures.filter((_, i) => i !== idx))}
                                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                              
                              <div className="pr-8">
                                <label className="block text-xs text-gray-500 mb-1">Title</label>
                                <input 
                                  type="text" 
                                  value={f.title}
                                  onChange={(e) => {
                                    const newF = [...marketingFeatures];
                                    newF[idx].title = e.target.value;
                                    setMarketingFeatures(newF);
                                  }}
                                  placeholder="e.g. Premium Materials" 
                                  className="w-full bg-black border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Description</label>
                                <input 
                                  type="text" 
                                  value={f.description}
                                  onChange={(e) => {
                                    const newF = [...marketingFeatures];
                                    newF[idx].description = e.target.value;
                                    setMarketingFeatures(newF);
                                  }}
                                  placeholder="e.g. Sourced from the finest..." 
                                  className="w-full bg-black border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Lucide Icon Name</label>
                                <input 
                                  type="text" 
                                  value={f.icon}
                                  onChange={(e) => {
                                    const newF = [...marketingFeatures];
                                    newF[idx].icon = e.target.value;
                                    setMarketingFeatures(newF);
                                  }}
                                  placeholder="e.g. Sparkles, ShieldCheck, Play" 
                                  className="w-full bg-black border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors rounded"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-[#0a0a0a]">
              <button onClick={onClose} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={!name || !price}
                className="bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] disabled:opacity-50 disabled:hover:bg-white transition-colors rounded-lg flex items-center gap-2"
              >
                <Save size={16} /> Save Product
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
