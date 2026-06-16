import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Wallet, CheckCircle } from 'lucide-react';
import { CartItem } from '../types';
import { FORMAT_CURRENCY } from '../data';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, onSnapshot, updateDoc, collection, addDoc } from 'firebase/firestore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart?: () => void;
}

export default function CartDrawer({ isOpen, onClose, cart, updateQuantity, removeItem, clearCart }: CartDrawerProps) {
  const [isCheckout, setIsCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment'>('cart');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWallet, setUseWallet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'sslcommerz' | 'bkash'>('cod');

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');

  useEffect(() => {
    if (!auth.currentUser) {
       return;
    }
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.creditBalance !== undefined) {
          setWalletBalance(data.creditBalance);
        }
        setShippingInfo(prev => ({
          ...prev,
          fullName: data.displayName || data.name || prev.fullName,
          phone: data.phoneNumber || data.phone || prev.phone
        }));
      }
    });

    const addressesRef = collection(db, 'users', auth.currentUser.uid, 'addresses');
    const unsubAddresses = onSnapshot(addressesRef, (snap) => {
      const addrs: any[] = [];
      snap.forEach(d => addrs.push({ id: d.id, ...d.data() }));
      setAddresses(addrs);
      if (addrs.length > 0) {
        setSelectedAddressId(addrs[0].id);
        const add = addrs[0];
        setShippingInfo(prev => ({
          ...prev,
          address: add.street,
          city: add.city
        }));
      }
    });
    
    return () => {
      unsub();
      unsubAddresses();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsCheckout(false);
        setCheckoutStep('cart');
        setOrderSuccess(false);
        setUseWallet(false);
      }, 500);
    }
  }, [isOpen]);

  const [mockGatewayType, setMockGatewayType] = useState<string | null>(null);
  const [bKashStep, setBkashStep] = useState<'account' | 'otp' | 'pin'>('account');
  const [bKashInput, setBkashInput] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.15; // 15% tax
  const total = subtotal + tax;
  
  const walletAppliedAmount = useWallet ? Math.min(walletBalance, total) : 0;
  const remainingTotal = total - walletAppliedAmount;

  let finalPaymentMethod = useWallet ? 'Wallet' : paymentMethod;
  if (remainingTotal > 0 && useWallet) {
    finalPaymentMethod = paymentMethod;
  }

  const handleCheckoutInitiate = async () => {
    setIsProcessing(true);
    
    try {
      if (['bkash', 'sslcommerz'].includes(finalPaymentMethod)) {
        // Redirect to mock gateway instead of proceeding
        setIsProcessing(false);
        setBkashStep('account');
        setBkashInput('');
        setMockGatewayType(finalPaymentMethod);
        return; 
      }
      
      await finalizeOrder();
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const finalizeOrder = async () => {
    try {
      setIsProcessing(true);
      if (useWallet && walletAppliedAmount > 0 && auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          creditBalance: walletBalance - walletAppliedAmount
        });
      }
      
      const orderData = {
        date: new Date().toISOString(),
        total: total,
        subtotal: subtotal,
        tax: tax,
        walletAppliedAmount: walletAppliedAmount,
        paidAmount: remainingTotal,
        paymentMethod: finalPaymentMethod,
        shippingInfo: shippingInfo,
        status: 'processing',
        items: cart,
        paymentStatus: finalPaymentMethod === 'cod' ? 'Pending' : 'Paid'
      };

      if (auth.currentUser) {
        const ordersRef = collection(db, 'users', auth.currentUser.uid, 'orders');
        await addDoc(ordersRef, orderData);
      } else {
        // Guest checkout order recording
        const guestOrdersRef = collection(db, 'guest_orders');
        await addDoc(guestOrdersRef, orderData);
      }

      setOrderSuccess(true);
      if (clearCart) clearCart();
      setMockGatewayType(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
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
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[110] w-full max-w-md bg-[#0a0a0a] border-l border-white/10 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-serif text-2xl italic text-white flex items-center gap-3">
                {isCheckout ? <><Wallet size={24} className="text-[#D4AF37]" /> Checkout</> : <><ShoppingBag size={24} className="text-[#D4AF37]" /> Your Bag</>}
              </h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {orderSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    <CheckCircle size={64} className="text-[#D4AF37] mb-6" />
                  </motion.div>
                  <h3 className="font-serif italic text-2xl mb-2 text-white">Order Confirmed!</h3>
                  <p className="text-gray-400 text-sm mb-8">Thank you for your purchase.</p>
                  <button onClick={onClose} className="px-8 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-all">
                    Continue Shopping
                  </button>
                </div>
              ) : isCheckout ? (
                <div className="flex-1 flex flex-col">
                  {checkoutStep === 'shipping' ? (
                    <div className="space-y-4 mb-8">
                       <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400 mb-4">Shipping Details</h3>
                       
                       {addresses.length > 0 && (
                         <div className="mb-4">
                           <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Select Address</label>
                           <div className="space-y-2">
                             {addresses.map((add, idx) => (
                               <label key={add.id || `cart-add-${idx}`} className={`flex flex-col p-3 border rounded cursor-pointer transition-colors ${selectedAddressId === add.id ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                                 <div className="flex items-center gap-2 mb-1">
                                   <input 
                                     type="radio" 
                                     name="addressSelection" 
                                     value={add.id} 
                                     checked={selectedAddressId === add.id}
                                     onChange={() => {
                                       setSelectedAddressId(add.id);
                                       setShippingInfo(prev => ({ ...prev, address: add.street, city: add.city }));
                                     }}
                                   />
                                   <span className="font-bold text-sm">{add.city}</span>
                                 </div>
                                 <span className="text-xs ml-5">{add.street}</span>
                               </label>
                             ))}
                             <label className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${selectedAddressId === 'new' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                               <input 
                                 type="radio" 
                                 name="addressSelection" 
                                 value="new" 
                                 checked={selectedAddressId === 'new'}
                                 onChange={() => setSelectedAddressId('new')}
                                 className="mr-2"
                               />
                               <span className="text-sm">Use New Address</span>
                             </label>
                           </div>
                         </div>
                       )}

                       <input 
                         type="text" 
                         placeholder="Full Name" 
                         value={shippingInfo.fullName}
                         onChange={e => setShippingInfo(p => ({ ...p, fullName: e.target.value }))}
                         className="w-full bg-[#111] border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37] text-sm"
                         required
                       />
                       <input 
                         type="tel" 
                         placeholder="Phone Number" 
                         value={shippingInfo.phone}
                         onChange={e => setShippingInfo(p => ({ ...p, phone: e.target.value }))}
                         className="w-full bg-[#111] border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37] text-sm"
                         required
                       />
                       {selectedAddressId === 'new' && (
                         <>
                           <input 
                             type="text" 
                             placeholder="City / District" 
                             value={shippingInfo.city}
                             onChange={e => setShippingInfo(p => ({ ...p, city: e.target.value }))}
                             className="w-full bg-[#111] border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37] text-sm"
                             required
                           />
                           <textarea 
                             placeholder="Full Address (House, Road, etc.)" 
                             value={shippingInfo.address}
                             onChange={e => setShippingInfo(p => ({ ...p, address: e.target.value }))}
                             className="w-full bg-[#111] border border-white/20 rounded p-3 text-white focus:outline-none focus:border-[#D4AF37] text-sm min-h-[80px]"
                             required
                           />
                         </>
                       )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400">Order Summary</h3>
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="text-gray-400">{FORMAT_CURRENCY(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        <div className="border-t border-white/10 pt-4 mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Subtotal</span>
                            <span>{FORMAT_CURRENCY(subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tax & Shipping</span>
                            <span>{FORMAT_CURRENCY(tax)}</span>
                          </div>
                          {useWallet && walletAppliedAmount > 0 && (
                            <div className="flex justify-between text-[#D4AF37]">
                              <span>Wallet Applied</span>
                              <span>-{FORMAT_CURRENCY(walletAppliedAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold pt-2 border-t border-white/10 text-lg">
                            <span>Total</span>
                            <span>{FORMAT_CURRENCY(remainingTotal)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6 space-y-3">
                         <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400">Payment Method</h3>
                         <div className="grid grid-cols-1 gap-2">
                           {(['cod', 'sslcommerz', 'bkash'] as const).map((method) => (
                             <label key={method} className="flex items-center justify-between p-3 border border-white/10 rounded cursor-pointer hover:bg-white/5 data-[active=true]:border-[#D4AF37] data-[active=true]:bg-[#D4AF37]/5 transition-colors" data-active={paymentMethod === method}>
                               <div className="flex items-center gap-3 text-sm font-bold capitalize">
                                  {method === 'cod' ? 'Cash on Delivery' : method.toUpperCase()}
                               </div>
                               <input 
                                 type="radio" 
                                 name="paymentMethod" 
                                 value={method} 
                                 checked={paymentMethod === method}
                                 onChange={() => setPaymentMethod(method)}
                                 className="opacity-0 absolute"
                               />
                               <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === method ? 'border-[#D4AF37]' : 'border-white/30'}`}>
                                 {paymentMethod === method && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                               </div>
                             </label>
                           ))}
                         </div>
                      </div>

                      {auth.currentUser && walletBalance > 0 && (
                        <div className="bg-[#111] border border-[#D4AF37]/30 rounded-xl p-4 mb-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/10 blur-xl rounded-full -mt-10 -mr-10"></div>
                          <h3 className="font-bold uppercase tracking-widest text-xs mb-3 text-white flex items-center gap-2">
                            <Wallet size={14} className="text-[#D4AF37]" /> Virtual Wallet
                          </h3>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-400">Available Balance</span>
                            <span className="font-bold text-[#D4AF37]">{FORMAT_CURRENCY(walletBalance)}</span>
                          </div>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 border border-white/30 rounded focus-within:border-[#D4AF37]">
                              <input 
                                type="checkbox" 
                                className="opacity-0 absolute inset-0 cursor-pointer"
                                checked={useWallet}
                                onChange={(e) => setUseWallet(e.target.checked)}
                              />
                              {useWallet && <CheckCircle size={12} className="text-[#D4AF37]" />}
                            </div>
                            <span className="text-sm group-hover:text-[#D4AF37] transition-colors font-bold">Apply Wallet Balance</span>
                          </label>
                        </div>
                      )}

                      {!auth.currentUser && (
                        <div className="text-xs text-gray-500 bg-white/5 p-4 rounded-lg mb-6 border border-white/5">
                          Log in to access your Virtual Wallet and faster checkout.
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <ShoppingBag size={48} className="mb-4 text-gray-500" />
                    <p className="text-gray-400 font-sans">Your bag is empty.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-white/5 bg-[#111]">
                      <img src={item.imageUrl} alt={item.name} className="w-20 h-24 object-cover rounded opacity-80 mix-blend-luminosity" />
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-serif text-white leading-tight line-clamp-2 pr-4">{item.name}</h3>
                          <button onClick={() => removeItem(item.id)} className="text-gray-500 hover:text-red-400">
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-[#D4AF37] font-bold tracking-tighter text-sm mb-auto">{FORMAT_CURRENCY(item.price)}</p>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 rounded-md bg-white/5 border border-white/10 text-white hover:bg-white/10">
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 rounded-md bg-white/5 border border-white/10 text-white hover:bg-white/10">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {cart.length > 0 && !orderSuccess && (
              <div className="p-6 border-t border-white/10 bg-[#050505]">
                {!isCheckout && (
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-400 font-sans text-sm uppercase tracking-widest font-bold">Subtotal</span>
                    <span className="font-serif text-2xl text-white italic">{FORMAT_CURRENCY(subtotal)}</span>
                  </div>
                )}
                
                {isCheckout ? (
                  checkoutStep === 'shipping' ? (
                     <button 
                       disabled={!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.city}
                       onClick={() => setCheckoutStep('payment')}
                       className="w-full py-4 bg-[#D4AF37] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#C39B26] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                       Continue to Payment <ArrowRight size={16} />
                     </button>
                  ) : (
                     <button 
                       disabled={isProcessing}
                       onClick={handleCheckoutInitiate}
                       className="w-full py-4 bg-[#D4AF37] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#C39B26] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                       {isProcessing ? 'Processing...' : remainingTotal === 0 ? 'Pay with Wallet' : 'Pay & Complete Order'}
                     </button>
                  )
                ) : (
                  <button 
                    onClick={() => { setIsCheckout(true); setCheckoutStep('shipping'); }}
                    className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-2"
                  >
                    Proceed to Checkout <ArrowRight size={16} />
                  </button>
                )}
                {!isCheckout && <p className="text-[10px] text-gray-500 text-center mt-3 uppercase tracking-widest">Taxes and shipping calculated at checkout</p>}
                {isCheckout && <button onClick={() => { if (checkoutStep === 'payment') setCheckoutStep('shipping'); else { setIsCheckout(false); setCheckoutStep('cart'); } }} className="w-full text-center mt-4 text-xs tracking-widest uppercase text-gray-500 hover:text-white">Back</button>}
              </div>
            )}

            {/* Mock Payment Gateway Overlay */}
            <AnimatePresence>
              {mockGatewayType && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className={`absolute inset-0 z-50 flex flex-col ${mockGatewayType === 'bkash' ? 'bg-white' : 'bg-white text-black items-center justify-center p-6'}`}
                >
                  {mockGatewayType === 'bkash' ? (
                    <div className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-[#e2136e] py-6 flex flex-col items-center justify-center text-white relative">
                         <div className="bg-white/20 p-2 rounded-lg mb-2">
                            <span className="font-bold text-xl tracking-wider">bKash</span>
                         </div>
                         <div className="text-center">
                           <p className="text-sm opacity-90">AURALUXE</p>
                           <p className="font-bold font-mono text-xl mt-1">৳ {remainingTotal.toLocaleString('en-US')}</p>
                         </div>
                      </div>
                      <div className="w-full max-w-sm px-6 pt-10 flex-1 flex flex-col">
                        
                        <div className="mb-8 text-center bg-gray-50 p-4 border border-dashed border-gray-300 rounded-lg">
                          <p className="text-sm font-medium text-gray-800 mb-4">
                            {bKashStep === 'account' && "Your bKash Account number"}
                            {bKashStep === 'otp' && "bKash Verification Code sent to you"}
                            {bKashStep === 'pin' && "Enter PIN of your bKash Account"}
                          </p>
                          <input 
                            type={bKashStep === 'pin' ? 'password' : 'text'}
                            value={bKashInput}
                            onChange={(e) => setBkashInput(e.target.value)}
                            placeholder={bKashStep === 'account' ? 'e.g 01XXXXXXXXX' : bKashStep === 'otp' ? 'bKash OTP' : 'bKash PIN'}
                            className="w-full text-center text-xl tracking-widest font-mono p-3 border-b-2 border-[#e2136e] bg-transparent focus:outline-none focus:border-[#c1105e] placeholder-gray-300"
                            autoFocus
                          />
                        </div>

                        <p className="text-xs text-gray-400 text-center mb-8 px-4">
                          By clicking on <b>Confirm</b>, you are agreeing to the terms & conditions
                        </p>
                        
                        <div className="flex gap-4 mt-auto mb-8">
                          <button 
                            onClick={() => setMockGatewayType(null)}
                            disabled={isProcessing}
                            className="flex-1 py-3 text-[#e2136e] font-bold uppercase tracking-widest text-sm transition-colors hover:bg-gray-50 rounded"
                          >
                            Close
                          </button>
                          <button 
                            onClick={async () => {
                              if (bKashStep === 'account') {
                                if (bKashInput.length > 10) { setBkashStep('otp'); setBkashInput(''); }
                                else alert('Enter a valid phone number');
                              } else if (bKashStep === 'otp') {
                                if (bKashInput.length >= 4) { setBkashStep('pin'); setBkashInput(''); }
                                else alert('Enter a valid OTP');
                              } else if (bKashStep === 'pin') {
                                if (bKashInput.length >= 4) {
                                  setIsProcessing(true);
                                  await new Promise(resolve => setTimeout(resolve, 1500));
                                  await finalizeOrder();
                                } else alert('Enter a valid PIN');
                              }
                            }}
                            disabled={isProcessing}
                            className={`flex-1 py-3 bg-[#e2136e] text-white font-bold uppercase tracking-widest text-sm rounded shadow transition-opacity ${isProcessing ? 'opacity-50' : 'hover:bg-[#c1105e]'}`}
                          >
                            {isProcessing ? 'Processing' : 'Confirm'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center overflow-hidden shadow-lg border border-gray-100">
                        <div className="bg-[#002f6c] w-full h-full flex items-center justify-center text-white font-bold text-[10px]">SSLCOMMERZ</div>
                      </div>
                      <h2 className="text-xl font-bold mb-2 text-center">
                        SSLCOMMERZ Secure Gateway
                      </h2>
                      <p className="text-sm text-gray-500 mb-8 font-mono">Amount to pay: {FORMAT_CURRENCY(remainingTotal)}</p>
                      
                      <div className="w-full max-w-sm space-y-4">
                        <button 
                          onClick={finalizeOrder}
                          disabled={isProcessing}
                          className={`w-full py-4 text-white font-bold rounded-lg shadow uppercase tracking-widest text-sm transition-opacity ${isProcessing ? 'opacity-50' : 'hover:opacity-90'} bg-[#002f6c]`}
                        >
                          {isProcessing ? 'Processing Payment...' : 'Simulate Successful Payment'}
                        </button>
                        <button 
                          onClick={() => setMockGatewayType(null)}
                          disabled={isProcessing}
                          className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-lg uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors"
                        >
                          Cancel & Return
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
