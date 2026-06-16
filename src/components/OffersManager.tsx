import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Offer, Product } from '../types';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Image as ImageIcon, Video, Package, Tag } from 'lucide-react';

interface OffersManagerProps {
  products: Product[];
}

export default function OffersManager({ products }: OffersManagerProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Offer>>({
    title: '',
    description: '',
    type: 'product',
    targetProductIds: [],
    mediaUrl: '',
    mediaType: 'image',
    discountType: 'percentage',
    discountValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  });

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'offers'));
      const fetchedOffers: Offer[] = [];
      snap.forEach(doc => {
        fetchedOffers.push({ id: doc.id, ...doc.data() } as Offer);
      });
      setOffers(fetchedOffers);
    } catch (err) {
      console.error('Failed to fetch offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'offers', editingId), formData as any);
      } else {
        const id = 'offer_' + Date.now();
        await setDoc(doc(db, 'offers', id), { ...formData, id });
      }
      setIsAdding(false);
      setEditingId(null);
      fetchOffers();
    } catch (err) {
      console.error('Failed to save offer:', err);
      alert('Error saving offer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      await deleteDoc(doc(db, 'offers', id));
      fetchOffers();
    } catch (err) {
      console.error('Failed to delete offer:', err);
    }
  };

  const handleEdit = (offer: Offer) => {
    setFormData(offer);
    setEditingId(offer.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'product',
      targetProductIds: [],
      mediaUrl: '',
      mediaType: 'image',
      discountType: 'percentage',
      discountValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleProductSelection = (productId: string) => {
    setFormData(prev => {
      const current = prev.targetProductIds || [];
      if (current.includes(productId)) {
        return { ...prev, targetProductIds: current.filter(id => id !== productId) };
      } else {
        return { ...prev, targetProductIds: [...current, productId] };
      }
    });
  };

  if (loading) {
    return <div className="text-gray-400 py-10">Loading Offers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#111] border border-white/5 p-6 rounded-xl">
        <div>
          <h2 className="text-2xl font-serif italic text-white flex items-center gap-3">
            <Tag className="text-[#D4AF37]" size={24} /> Offers & Promotions
          </h2>
          <p className="text-gray-400 mt-1">Manage promotional campaigns, active product offers, and media packages.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#D4AF37] text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#b5952f] transition-colors rounded flex items-center gap-2"
          >
            <Plus size={16} /> New Offer
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-[#111] border border-[#D4AF37]/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">{editingId ? 'Edit Offer' : 'Create New Offer'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Offer Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  placeholder="e.g. Eid Mega Sale"
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37] min-h-[100px]"
                  placeholder="Details about the promotion..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Start Date</label>
                  <input 
                    type="date" 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">End Date</label>
                  <input 
                    type="date" 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full bg-black border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Discount Type</label>
                  <select 
                    value={formData.discountType} 
                    onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                    className="w-full bg-black border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (BDT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Discount Value</label>
                  <input 
                    type="number" 
                    value={formData.discountValue} 
                    onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})}
                    className="w-full bg-black border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                    min="0"
                  />
                </div>
              </div>

            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Offer Type</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value as any, targetProductIds: []})}
                  className="w-full bg-black border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="product">Specific Products</option>
                  <option value="package">Package / Bundle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Select Target Products</label>
                <div className="bg-black border border-white/20 rounded p-3 h-40 overflow-y-auto space-y-2">
                  {products.length === 0 && <p className="text-gray-500 text-xs text-center py-4">No products found</p>}
                  {products.map(p => (
                    <label key={p.id} className="flex items-center gap-3 text-sm text-gray-300 hover:text-white cursor-pointer px-2">
                      <input 
                        type="checkbox" 
                        checked={formData.targetProductIds?.includes(p.id) || false}
                        onChange={() => handleProductSelection(p.id)}
                        className="accent-[#D4AF37]"
                      />
                      <div className="flex items-center gap-2">
                        {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-6 h-6 object-cover rounded" />}
                        <span className="truncate">{p.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Media Type</label>
                  <select 
                    value={formData.mediaType} 
                    onChange={e => setFormData({...formData, mediaType: e.target.value as any})}
                    className="w-full bg-black border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="image">Image Banner</option>
                    <option value="video">Promotional Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Status</label>
                  <select 
                    value={formData.isActive ? 'active' : 'inactive'} 
                    onChange={e => setFormData({...formData, isActive: e.target.value === 'active'})}
                    className="w-full bg-black border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Media URL ({formData.mediaType})</label>
                <input 
                  type="text" 
                  value={formData.mediaUrl} 
                  onChange={e => setFormData({...formData, mediaUrl: e.target.value})}
                  className="w-full bg-black border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  placeholder={`https://example.com/promo.${formData.mediaType === 'image' ? 'jpg' : 'mp4'}`}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={resetForm}
                  className="flex-1 bg-white/10 text-white px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-[#D4AF37] text-black px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#b5952f] transition-colors rounded"
                >
                  {editingId ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>

            </div>
          </div>
          
        </div>
      )}

      {/* Offers List */}
      {!isAdding && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {offers.length === 0 && (
            <div className="col-span-full border border-white/10 border-dashed rounded-xl p-12 text-center">
              <Tag className="mx-auto text-gray-600 mb-4" size={32} />
              <h3 className="text-white font-bold text-lg mb-2">No Active Offers</h3>
              <p className="text-gray-400 mb-6 text-sm">Create an offer to boost your sales and promote new products.</p>
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-[#D4AF37] text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#b5952f] transition-colors rounded inline-flex items-center gap-2"
              >
                <Plus size={16} /> Create First Offer
              </button>
            </div>
          )}

          {offers.map(offer => (
            <div key={offer.id} className="bg-[#111] border border-white/10 rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-colors">
              <div className="h-48 bg-black relative">
                {offer.mediaType === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 border-b border-white/10">
                    <Video size={48} className="text-white/20" />
                    {offer.mediaUrl && <span className="absolute bottom-2 right-2 text-[10px] bg-black/80 px-2 py-1 rounded text-white font-mono truncate max-w-[200px]">{offer.mediaUrl}</span>}
                  </div>
                ) : (
                  offer.mediaUrl ? (
                    <img src={offer.mediaUrl} alt={offer.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 border-b border-white/10">
                      <ImageIcon size={48} className="text-white/20" />
                    </div>
                  )
                )}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${offer.isActive ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                  {offer.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs text-white uppercase tracking-widest font-bold flex items-center gap-2">
                  {offer.type === 'package' ? <Package size={14} /> : <Tag size={14} />}
                  {offer.type}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{offer.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{offer.description}</p>
                  </div>
                  <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-3 py-2 rounded text-center whitespace-nowrap ml-4">
                    <div className="text-sm font-bold">
                      {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `৳${offer.discountValue}`}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest opacity-80 mt-1">OFF</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 uppercase tracking-widest mb-6">
                  <div>
                    <span className="block opacity-50 mb-1">Valid From</span>
                    <span className="text-gray-300 font-mono">{offer.startDate}</span>
                  </div>
                  <div>
                    <span className="block opacity-50 mb-1">Valid Until</span>
                    <span className="text-gray-300 font-mono">{offer.endDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-sm text-gray-400">
                    <span className="text-white font-bold">{offer.targetProductIds?.length || 0}</span> products included
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(offer)}
                      className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                      title="Edit Offer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(offer.id)}
                      className="p-2 text-red-400 hover:text-white bg-red-400/10 hover:bg-red-500 rounded transition-colors"
                      title="Delete Offer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
