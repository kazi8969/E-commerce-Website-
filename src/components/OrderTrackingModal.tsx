import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Package, Search, X, Loader2, MapPin, Truck, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderTrackingModalProps {
  onClose: () => void;
  initialTrackingId?: string;
}

export default function OrderTrackingModal({ onClose, initialTrackingId = '' }: OrderTrackingModalProps) {
  const [trackingId, setTrackingId] = useState(initialTrackingId);
  const [loading, setLoading] = useState(false);
  const [orderDocs, setOrderDocs] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTrackingId) {
      handleSearch(initialTrackingId);
    }
  }, [initialTrackingId]);

  const handleSearch = async (searchVal = trackingId) => {
    if (!searchVal.trim()) return;
    setSearched(true);
    setLoading(true);
    setError(null);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("Please sign in to track your orders.");
      setLoading(false);
      return;
    }

    try {
      const ordersRef = collection(db, 'users', currentUser.uid, 'orders');
      
      const unsubscribe = onSnapshot(ordersRef, async (snapshot) => {
        const matches: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (
            (data.id && data.id.toLowerCase() === searchVal.toLowerCase()) || 
            (data.trackingId && data.trackingId.toLowerCase() === searchVal.toLowerCase())
          ) {
            matches.push({ idDoc: doc.id, ...data });
          }
        });

        if (matches.length > 0) {
          const foundOrder = matches[0];

          // Auto-sync status with couriers
          if (foundOrder.courier && foundOrder.trackingId && foundOrder.status !== 'cancelled' && foundOrder.status !== 'delivered') {
            try {
              const { getDoc, doc } = await import('firebase/firestore');
              const settingsSnap = await getDoc(doc(db, 'settings', 'store'));
              let credentials = null;
              if (settingsSnap.exists() && settingsSnap.data().couriers) {
                credentials = settingsSnap.data().couriers[foundOrder.courier.toLowerCase()];
              }

              if (credentials) {
                const response = await fetch('/api/courier/track', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    trackingId: foundOrder.trackingId,
                    courier: foundOrder.courier,
                    credentials
                  })
                });

                if (response.ok) {
                  const data = await response.json();
                  if (data.status && data.status !== foundOrder.status) {
                    const { updateDoc } = await import('firebase/firestore');
                    await updateDoc(doc(db, 'users', currentUser.uid, 'orders', foundOrder.idDoc), {
                      status: data.status
                    });
                    // This update will trigger onSnapshot again and update UI
                    return; 
                  }
                }
              }
            } catch (syncErr) {
              console.error("Failed to sync live tracking:", syncErr);
            }
          }
        }
        
        setOrderDocs(matches);
        setLoading(false);
      }, (err) => {
        console.error(err);
        setError("Failed to fetch order status. Please try again.");
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setError("An error occurred while tracking the order.");
      setLoading(false);
    }
  };

  const currentOrder = orderDocs.length > 0 ? orderDocs[0] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-[#111] border border-[#D4AF37]/30 p-8 max-w-lg w-full z-10 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-serif italic text-white mb-6 flex items-center gap-3">
          <Package className="text-[#D4AF37]" />
          Track Order
        </h2>

        <div className="flex gap-2 mb-8">
          <input 
            type="text" 
            placeholder="Enter Order ID or Courier Tracking ID..."
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-black border border-white/20 p-3 text-white focus:outline-none focus:border-[#D4AF37]"
          />
          <button 
            onClick={() => handleSearch()}
            className="bg-[#D4AF37] text-black px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-[#b5952f] transition-colors flex items-center gap-2"
          >
            <Search size={16} /> Track
          </button>
        </div>

        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
            </div>
          ) : error ? (
            <p className="text-red-500 text-center py-8 text-sm">{error}</p>
          ) : searched && orderDocs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm uppercase tracking-widest">No order found with that ID.</p>
            </div>
          ) : currentOrder ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-white/5 border border-white/10 p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Order Details</p>
                    <p className="font-bold text-white text-lg">{currentOrder.id}</p>
                    {currentOrder.courier && currentOrder.trackingId && (
                      <p className="text-xs text-gray-400 mt-1">
                        {currentOrder.courier}: <span className="text-white">{currentOrder.trackingId}</span>
                      </p>
                    )}
                  </div>
                  <div className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest border ${
                    currentOrder.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                    currentOrder.status === 'shipped' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    currentOrder.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {currentOrder.status}
                  </div>
                </div>
                {currentOrder.date && (
                  <p className="text-sm text-gray-400 mb-2">
                    Placed on: {new Date(currentOrder.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </p>
                )}
                {currentOrder.total !== undefined && (
                  <p className="text-sm text-gray-400 mb-4">
                    Total: <span className="text-[#D4AF37] font-serif italic">${currentOrder.total.toFixed(2)}</span>
                  </p>
                )}

                {/* Items preview */}
                {currentOrder.items && currentOrder.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Package Contents</p>
                     <div className="space-y-2">
                       {currentOrder.items.map((item: any, idx: number) => (
                         <div key={idx} className="flex justify-between text-sm text-gray-300">
                           <span className="truncate pr-4">{item.quantity}x {item.name}</span>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div className="relative pl-6 pb-4">
                {currentOrder.status !== 'cancelled' ? (
                  <>
                    <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-white/10" />
                    
                    {/* Order Placed */}
                    <div className="relative mb-8">
                      <div className="absolute -left-6 bg-[#111] p-1 border-2 border-[#D4AF37] text-[#D4AF37] rounded-full">
                         <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                      </div>
                      <p className="font-bold text-white mb-1">Order Confirmed</p>
                      <p className="text-xs text-gray-400">Your order has been received and is being processed.</p>
                    </div>

                    {/* Processing */}
                    <div className={`relative mb-8 ${['processing', 'shipped', 'delivered'].includes(currentOrder.status) ? '' : 'opacity-40'}`}>
                      <div className={`absolute -left-6 bg-[#111] p-1 border-2 ${['processing', 'shipped', 'delivered'].includes(currentOrder.status) ? 'border-[#D4AF37]' : 'border-gray-600'} rounded-full`}>
                         <div className={`w-2 h-2 rounded-full ${['shipped', 'delivered'].includes(currentOrder.status) ? 'bg-[#D4AF37]' : currentOrder.status === 'processing' ? 'bg-[#D4AF37] animate-pulse' : 'bg-gray-600'}`} />
                      </div>
                      <p className="font-bold text-white mb-1">Processing</p>
                      <p className="text-xs text-gray-400">Item is being packaged securely at our facility.</p>
                    </div>

                    {/* Shipped */}
                    <div className={`relative mb-8 ${['shipped', 'delivered'].includes(currentOrder.status) ? '' : 'opacity-40'}`}>
                      <div className={`absolute -left-6 bg-[#111] p-1 border-2 ${['shipped', 'delivered'].includes(currentOrder.status) ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-600 text-gray-600'} rounded-full`}>
                         <Truck size={8} className="m-[2px]" />
                      </div>
                      <p className="font-bold text-white mb-1">Shipped</p>
                      <p className="text-xs text-gray-400">Order handed over to courier partner {currentOrder.courier ? `(${currentOrder.courier})` : ''}.</p>
                    </div>

                    {/* Delivered */}
                    <div className={`relative ${currentOrder.status === 'delivered' ? '' : 'opacity-40'}`}>
                      <div className={`absolute -left-[26px] bg-[#111] border-2 ${currentOrder.status === 'delivered' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-600 text-gray-600'} rounded-full p-0.5`}>
                         <CheckCircle size={14} />
                      </div>
                      <p className="font-bold text-white mb-1">Delivered</p>
                      <p className="text-xs text-gray-400">Order successfully delivered to your address.</p>
                    </div>
                  </>
                ) : (
                  <div className="relative">
                      <div className="absolute -left-[26px] bg-[#111] p-1 border-2 border-red-500 text-red-500 rounded-full">
                         <X size={12} />
                      </div>
                      <p className="font-bold text-red-500 mb-1">Order Cancelled</p>
                      <p className="text-xs text-gray-400">This order has been cancelled.</p>
                  </div>
                )}
              </div>

              {currentOrder.courier && currentOrder.trackingId && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <button
                    onClick={() => {
                      let trackUrl = `https://pathao.com/courier/tracking/?consignment_id=${currentOrder.trackingId}`;
                      if (currentOrder.courier.toLowerCase() === 'steadfast') trackUrl = `https://steadfast.com.bd/tracking/${currentOrder.trackingId}`;
                      if (currentOrder.courier.toLowerCase() === 'redx') trackUrl = `https://redx.com.bd/track/${currentOrder.trackingId}`;
                      window.open(trackUrl, '_blank');
                    }}
                    className="w-full bg-white/5 border border-white/20 text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all flex justify-center items-center gap-2"
                  >
                    Track Live on {currentOrder.courier}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
