import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, MapPin, Package, Settings, Search, Plus, Loader2, Wallet } from 'lucide-react';
import { UserProfile, Address, Order } from '../types';
import { auth, db } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import OrderTrackingModal from './OrderTrackingModal';

interface UserProfileComponentProps {
  onBack: () => void;
}

export default function UserProfileComponent({ onBack }: UserProfileComponentProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'settings' | 'wallet'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<Partial<UserProfile>>({});

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<Address>({ street: '', city: '', state: '', zip: '', country: '' });

  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [fundAmount, setFundAmount] = useState<number | ''>(5000);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bkash' | 'nagad'>('bkash');
  
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [hasSyncedOrders, setHasSyncedOrders] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (activeTab === 'orders' && orders.length > 0 && !hasSyncedOrders && currentUser) {
      setHasSyncedOrders(true);
      const syncOrders = async () => {
        try {
          const activeOrders = orders.filter(o => o.courier && o.trackingId && o.status !== 'cancelled' && o.status !== 'delivered');
          if (activeOrders.length === 0) return;

          const { getDoc, doc, updateDoc } = await import('firebase/firestore');
          const settingsSnap = await getDoc(doc(db, 'settings', 'store'));
          if (!settingsSnap.exists() || !settingsSnap.data().couriers) return;
          const couriersConfig = settingsSnap.data().couriers;

          for (const order of activeOrders) {
            const credentials = couriersConfig[order.courier.toLowerCase()];
            if (credentials) {
              const response = await fetch('/api/courier/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackingId: order.trackingId, courier: order.courier, credentials })
              });
              if (response.ok) {
                const data = await response.json();
                if (data.status && data.status !== order.status) {
                  await updateDoc(doc(db, 'users', currentUser.uid, 'orders', order.idDoc as string), {
                    status: data.status
                  });
                }
              }
            }
          }
        } catch (err) {
          console.error("Auto tracking sync error", err);
        }
      };
      syncOrders();
    }
  }, [activeTab, orders, hasSyncedOrders, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchProfile = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
          setEditProfileData(userSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            id: currentUser.uid,
            displayName: currentUser.displayName || 'User',
            preferences: { emailNotifications: true }
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
          setEditProfileData(newProfile);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const addressesRef = collection(db, 'users', currentUser.uid, 'addresses');
    const unsubAddresses = onSnapshot(addressesRef, (snap) => {
      const addrs: Address[] = [];
      snap.forEach(d => addrs.push({ id: d.id, ...d.data() } as Address));
      setAddresses(addrs);
    });

    const ordersRef = collection(db, 'users', currentUser.uid, 'orders');
    const unsubOrders = onSnapshot(ordersRef, (snap) => {
      const ords: Order[] = [];
      snap.forEach(d => ords.push({ idDoc: d.id, id: d.id, ...d.data() } as Order));
      setOrders(ords);
    });

    return () => {
      unsubAddresses();
      unsubOrders();
    };
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updatedProfile = { ...profile, ...editProfileData };
      await setDoc(userRef, updatedProfile, { merge: true });
      
      if (editProfileData.displayName && editProfileData.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: editProfileData.displayName });
      }
      
      setProfile(updatedProfile as UserProfile);
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleAddAddress = async () => {
    if (!currentUser) return;
    try {
      const addressesRef = collection(db, 'users', currentUser.uid, 'addresses');
      await addDoc(addressesRef, newAddress);
      setIsAddingAddress(false);
      setNewAddress({ street: '', city: '', state: '', zip: '', country: '' });
    } catch (err) {
      console.error('Error adding address:', err);
    }
  };

  const handleDeleteAddress = async (id?: string) => {
    if (!currentUser || !id) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'addresses', id));
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif italic tracking-wider mb-2">My Account</h1>
            <p className="text-gray-400 uppercase tracking-widest text-xs">{profile?.displayName || currentUser.email}</p>
          </div>
          <button 
            onClick={onBack}
            className="uppercase tracking-widest text-xs font-bold border border-white/20 px-6 py-3 hover:bg-white/10 transition-colors"
          >
            Return to Store
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-2">
            {[
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'orders', icon: Package, label: 'Order History' },
              { id: 'wallet', icon: Wallet, label: 'Wallet' },
              { id: 'addresses', icon: MapPin, label: 'Addresses' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 uppercase tracking-widest text-xs font-bold transition-all
                  ${activeTab === tab.id ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
            <button
               onClick={() => auth.signOut()}
               className="w-full flex items-center gap-4 px-6 py-4 uppercase tracking-widest text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'profile' && (
                  <div className="backdrop-blur-md bg-white/5 border border-white/10 p-8 shadow-xl shadow-black/50">
                    <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <h2 className="text-2xl font-serif italic">Personal Information</h2>
                    {!isEditingProfile && (
                      <button 
                        onClick={() => {
                          setEditProfileData(profile || {});
                          setIsEditingProfile(true);
                        }}
                        className="text-gray-400 hover:text-white uppercase tracking-widest text-xs"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {isEditingProfile ? (
                    <div className="space-y-6 max-w-md">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Display Name</label>
                        <input 
                          type="text" 
                          value={editProfileData.displayName || ''}
                          onChange={e => setEditProfileData({...editProfileData, displayName: e.target.value})}
                          className="w-full bg-transparent border border-white/20 p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Phone Number</label>
                        <input 
                          type="text" 
                          value={editProfileData.phoneNumber || ''}
                          onChange={e => setEditProfileData({...editProfileData, phoneNumber: e.target.value})}
                          className="w-full bg-transparent border border-white/20 p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="emailNotif"
                          checked={editProfileData.preferences?.emailNotifications || false}
                          onChange={e => setEditProfileData({
                            ...editProfileData, 
                            preferences: { emailNotifications: e.target.checked }
                          })}
                          className="w-4 h-4 bg-transparent border border-white/20 accent-[#D4AF37]"
                        />
                        <label htmlFor="emailNotif" className="text-sm text-gray-300">Receive email notifications</label>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button 
                          onClick={handleUpdateProfile}
                          className="bg-white text-black px-6 py-3 uppercase tracking-widest text-xs font-bold hover:bg-gray-200"
                        >
                          Save Changes
                        </button>
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          className="border border-white/20 text-white px-6 py-3 uppercase tracking-widest text-xs font-bold hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div>
                            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Display Name</p>
                            <p className="text-lg">{profile?.displayName || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Email</p>
                            <p className="text-lg">{currentUser.email}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Phone Number</p>
                            <p className="text-lg">{profile?.phoneNumber || 'Not provided'}</p>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="backdrop-blur-md bg-white/5 border border-white/10 p-8 shadow-xl shadow-black/50">
                  <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <h2 className="text-2xl font-serif italic">Order History</h2>
                    <button 
                      onClick={() => setIsTrackingModalOpen(true)}
                      className="uppercase tracking-widest text-xs font-bold border border-white/20 px-4 py-2 hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-black transition-colors flex items-center gap-2"
                    >
                      <Search size={14} /> Track Order
                    </button>
                  </div>
                  
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Package size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="uppercase tracking-widest text-xs">No orders found.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order, idx) => (
                        <div key={order.id || order.idDoc || `order-${idx}`} className="border border-white/10 p-6 flex flex-col gap-6 relative overflow-hidden group">
                          {/* Background Glow */}
                          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform ${order.status !== 'cancelled' ? 'block' : 'hidden'}`}></div>
                          
                          <div className="flex flex-col sm:flex-row justify-between gap-6 relative z-10">
                            <div>
                              <p className="text-gray-400 text-xs mb-1 uppercase tracking-widest font-mono">Order {order.id || order.idDoc}</p>
                              <p className="font-bold mb-2 text-lg">{new Date(order.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              <div className="flex items-center gap-3 mt-4">
                                <span className={`inline-block px-3 py-1 text-[10px] uppercase font-bold tracking-widest border ${
                                  order.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                  order.status === 'shipped' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                  order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                                {order.courier && order.trackingId && (
                                  <span className="text-[10px] text-gray-400 uppercase tracking-widest border border-white/10 px-3 py-1 flex items-center gap-2">
                                    <Package size={10} />
                                    {order.courier}: {order.trackingId}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-gray-400 text-xs mb-1 uppercase tracking-widest">Order Total</p>
                              <p className="font-serif italic text-2xl text-[#D4AF37]">${order.total.toFixed(2)}</p>
                              <p className="text-xs text-gray-500 mt-2">{order.items.length} item(s)</p>
                            </div>
                          </div>

                          {/* Tracking Timeline */}
                          {order.status !== 'cancelled' && (
                            <div className="mt-4 pt-6 border-t border-white/10 relative z-10">
                              <div className="relative mb-8 mt-4 mx-4">
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2"></div>
                                <div className={`absolute top-1/2 left-0 h-0.5 bg-[#D4AF37] shadow-[0_0_8px_#D4AF37] -translate-y-1/2 transition-all duration-1000 ${order.status === 'delivered' ? 'w-full' : order.status === 'shipped' ? 'w-1/2' : 'w-0'}`}></div>
                                
                                <div className="relative flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                                  <div className="flex flex-col items-center gap-3">
                                      <div className={`w-4 h-4 rounded-full outline outline-8 outline-[#111] z-10 transition-colors duration-500 ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'bg-gray-800'}`}></div>
                                      <span className={`absolute -bottom-6 ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'text-white' : 'text-gray-600'}`}>Processing</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-3">
                                      <div className={`w-4 h-4 rounded-full outline outline-8 outline-[#111] z-10 transition-colors duration-500 delay-150 ${['shipped', 'delivered'].includes(order.status) ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'bg-gray-800'}`}></div>
                                      <span className={`absolute -bottom-6 ${['shipped', 'delivered'].includes(order.status) ? 'text-white' : 'text-gray-600'}`}>Shipped</span>
                                  </div>
                                  <div className="flex flex-col items-center gap-3">
                                      <div className={`w-4 h-4 rounded-full outline outline-8 outline-[#111] z-10 transition-colors duration-500 delay-300 ${['delivered'].includes(order.status) ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'bg-gray-800'}`}></div>
                                      <span className={`absolute -bottom-6 ${order.status === 'delivered' ? 'text-white' : 'text-gray-600'}`}>Delivered</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="backdrop-blur-md bg-white/5 border border-white/10 p-8 shadow-xl shadow-black/50">
                  <h2 className="text-2xl font-serif italic mb-8 border-b border-white/10 pb-4">Virtual Wallet</h2>
                  
                  <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <div className="flex-1 bg-gradient-to-br from-[#111] to-[#0a0a0a] p-6 rounded-xl border border-[#D4AF37]/30 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-2 shadow-sm">Available Balance</p>
                      <p className="text-4xl font-serif italic text-[#D4AF37] mb-6">
                        {profile?.creditBalance !== undefined 
                          ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(profile.creditBalance).replace('BDT', '৳') 
                          : '৳0'}
                      </p>
                      <button 
                        onClick={() => setIsAddingFunds(true)}
                        className="px-6 py-2 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-colors rounded"
                      >
                        Add Funds
                      </button>
                    </div>
                    <div className="flex-1 bg-white/5 p-6 rounded-xl border border-white/10">
                      <h3 className="font-bold mb-4 uppercase tracking-widest text-xs">Wallet Benefits</h3>
                      <ul className="text-sm text-gray-400 space-y-3">
                        <li className="flex items-center gap-2"><Plus size={14} className="text-[#D4AF37]" /> Instant refunds on returns</li>
                        <li className="flex items-center gap-2"><Plus size={14} className="text-[#D4AF37]" /> Exclusive wallet-only discounts</li>
                        <li className="flex items-center gap-2"><Plus size={14} className="text-[#D4AF37]" /> Express checkout without card details</li>
                      </ul>
                    </div>
                  </div>

                  {isAddingFunds ? (
                    <motion.div 
                      className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <h3 className="text-xl font-serif italic mb-6">Add Funds to Wallet</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Amount (৳)</label>
                          <input 
                            type="number" 
                            min="100"
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value ? Number(e.target.value) : '')}
                            placeholder="Enter amount"
                            className="w-full max-w-sm bg-transparent border border-white/20 p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">Select Payment Method</label>
                          <div className="flex flex-wrap gap-4">
                            {(['card', 'bkash', 'nagad'] as const).map((method) => (
                              <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${paymentMethod === method ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/20 hover:border-white/50'}`}
                              >
                                {method === 'card' ? 'Credit/Debit Card' : method === 'bkash' ? 'bKash' : 'Nagad'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-white/10">
                          <button 
                            onClick={async () => {
                              if (!fundAmount || Number(fundAmount) < 100) {
                                alert("Please enter at least ৳100");
                                return;
                              }
                              setIsProcessingPayment(true);
                              
                              try {
                                // Simulate payment gateway delay
                                await new Promise(resolve => setTimeout(resolve, 1500));
                                
                                if (profile && auth.currentUser) {
                                  const amount = Number(fundAmount);
                                  const newBalance = (profile.creditBalance || 0) + amount;
                                  await setDoc(doc(db, 'users', auth.currentUser.uid), { creditBalance: newBalance }, { merge: true });
                                  setProfile({ ...profile, creditBalance: newBalance });
                                }
                                setIsAddingFunds(false);
                                setFundAmount(5000);
                              } catch (e) {
                                console.error(e);
                                alert("Failed to add funds.");
                              } finally {
                                setIsProcessingPayment(false);
                              }
                            }}
                            disabled={isProcessingPayment}
                            className="bg-[#D4AF37] text-white px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-[#b5952f] disabled:opacity-50 flex items-center gap-2"
                          >
                            {isProcessingPayment ? <><Loader2 size={16} className="animate-spin"/> Processing...</> : `Pay ৳${fundAmount}`}
                          </button>
                          <button 
                            onClick={() => {
                              setIsAddingFunds(false);
                              setFundAmount(5000);
                            }}
                            disabled={isProcessingPayment}
                            className="border border-white/20 text-white px-6 py-3 uppercase tracking-widest text-xs font-bold hover:bg-white/5 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}

                  <div>
                    <h3 className="font-bold mb-4 uppercase tracking-widest text-xs border-b border-white/5 pb-2">Recent Transactions</h3>
                    <div className="text-center py-8 text-gray-500 bg-white/5 rounded-lg border border-white/5">
                      <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-xs uppercase tracking-widest">No recent transactions</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="backdrop-blur-md bg-white/5 border border-white/10 p-8 shadow-xl shadow-black/50">
                  <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <h2 className="text-2xl font-serif italic">Saved Addresses</h2>
                    {!isAddingAddress && (
                      <button 
                        onClick={() => setIsAddingAddress(true)}
                        className="text-white hover:text-[#D4AF37] uppercase tracking-widest text-xs flex items-center gap-2"
                      >
                        <Plus size={16} /> Add New
                      </button>
                    )}
                  </div>

                  {isAddingAddress ? (
                    <div className="space-y-4 max-w-lg mb-8 p-6 border border-white/20 bg-white/5">
                      <h3 className="uppercase tracking-widest text-xs font-bold mb-4">Add a new address</h3>
                       <div className="space-y-4">
                          <input 
                            placeholder="Street Address"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                            className="w-full bg-transparent border border-white/20 p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              placeholder="City"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                              className="w-full bg-transparent border border-white/20 p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                            />
                            <input 
                              placeholder="State / Province"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                              className="w-full bg-transparent border border-white/20 p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              placeholder="Zip / Postal Code"
                              value={newAddress.zip}
                              onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})}
                              className="w-full bg-transparent border border-white/20 p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                            />
                            <input 
                              placeholder="Country"
                              value={newAddress.country}
                              onChange={(e) => setNewAddress({...newAddress, country: e.target.value})}
                              className="w-full bg-transparent border border-white/20 p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                            />
                          </div>
                       </div>
                       <div className="flex gap-4 pt-4">
                        <button 
                          onClick={handleAddAddress}
                          className="bg-white text-black px-6 py-3 uppercase tracking-widest text-xs font-bold hover:bg-gray-200"
                        >
                          Save Address
                        </button>
                        <button 
                          onClick={() => setIsAddingAddress(false)}
                          className="border border-white/20 text-white px-6 py-3 uppercase tracking-widest text-xs font-bold hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {addresses.length === 0 && !isAddingAddress ? (
                     <div className="text-center py-12 text-gray-500">
                      <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="uppercase tracking-widest text-xs">No saved addresses.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {addresses.map((address, idx) => (
                        <div key={address.id || `address-${idx}`} className="border border-white/10 p-6 relative group hover:border-white/30 transition-colors">
                          <p className="text-white mb-1">{address.street}</p>
                          <p className="text-gray-400 text-sm">{address.city}, {address.state} {address.zip}</p>
                          <p className="text-gray-400 text-sm mb-4">{address.country}</p>
                          
                          <button 
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-red-500 text-xs uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="backdrop-blur-md bg-white/5 border border-white/10 p-8 shadow-xl shadow-black/50">
                  <h2 className="text-2xl font-serif italic mb-8 border-b border-white/10 pb-4">Account Settings</h2>
                  
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2"><Settings size={16} /> Preferences</h3>
                      <div className="flex items-center justify-between border border-white/10 p-6 bg-black/20">
                        <div>
                          <p className="font-bold mb-1">Email Updates</p>
                          <p className="text-sm text-gray-400">Receive order updates and promotional offers</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={profile?.preferences?.emailNotifications || false}
                            onChange={(e) => {
                              const updated = {
                                ...profile,
                                id: profile?.id || currentUser.uid,
                                displayName: profile?.displayName || currentUser.displayName || 'User',
                                preferences: { emailNotifications: e.target.checked }
                              };
                              setProfile(updated);
                              setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
                            }}
                          />
                          <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs uppercase tracking-widest font-bold mb-4 text-red-500">Danger Zone</h3>
                      <div className="border border-red-500/20 p-6 bg-red-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="font-bold text-red-500 mb-1">Delete Account</p>
                          <p className="text-sm text-gray-400">Permanently remove your account and all associated data</p>
                        </div>
                        <button 
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                              try {
                                await currentUser.delete();
                              } catch (err: any) {
                                if (err.code === 'auth/requires-recent-login') {
                                  alert('For security reasons, please log out and sign in again before deleting your account.');
                                } else {
                                  alert('Failed to delete account. ' + err.message);
                                }
                              }
                            }
                          }}
                          className="px-6 py-3 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isTrackingModalOpen && (
          <OrderTrackingModal onClose={() => setIsTrackingModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
