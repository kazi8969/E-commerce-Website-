import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, ShieldAlert, ArrowLeft, Activity,
  LayoutDashboard, Package, ShoppingCart, PieChart, Settings, Bell, Search, Layout,
  Menu, X, Filter, MoreVertical, CheckCircle, XCircle, FileText, CreditCard, Download, Eye, LogOut, User as UserIcon, Tag, MessageSquare, Trash2
} from 'lucide-react';
import { FORMAT_CURRENCY } from '../data';
import AddProductModal from './AddProductModal';
import OffersManager from './OffersManager';
import { auth, db } from '../lib/firebase';
import { sendSMS } from '../lib/sms';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, getDocs, doc } from 'firebase/firestore';
import AuthModal from './AuthModal';
import InvoiceModal from './InvoiceModal';
import OrderDetailsModal from './OrderDetailsModal';

import StorefrontManager from './StorefrontManager';

interface DashboardStats {
  revenue: number;
  orders: number;
  conversionRate: number;
  aov: number;
  fraudScore: number;
  fraudBlocked: number;
}

const salesData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

const trafficData = [
  { time: '00:00', users: 120 },
  { time: '04:00', users: 80 },
  { time: '08:00', users: 450 },
  { time: '12:00', users: 890 },
  { time: '16:00', users: 1100 },
  { time: '20:00', users: 700 },
  { time: '23:59', users: 300 },
];

import { Product } from '../types';

interface AdminDashboardProps {
  onExit: () => void;
  productsList: Product[];
  setProductsList: React.Dispatch<React.SetStateAction<Product[]>>;
}

export default function AdminDashboard({ onExit, productsList, setProductsList }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeSettingsTab, setActiveSettingsTab] = useState('General');
  const [staffMembers, setStaffMembers] = useState([
    { id: '1', name: 'Admin User', email: 'admin@auraluxe.com', role: 'Admin' },
    { id: '2', name: 'Shipping Team', email: 'warehouse@auraluxe.com', role: 'Warehouse' },
  ]);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'Support' });
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);

  const [paymentGatewayStates, setPaymentGatewayStates] = useState({
    bkash: { active: false, configOpen: false, appKey: '', appSecret: '', username: '', password: '' },
    sslcommerz: { active: false, configOpen: false, storeId: '', storePassword: '' },
    rocket: { active: false, configOpen: false, apiUser: '', apiPass: '' }
  });

  const [courierStates, setCourierStates] = useState({
    pathao: { active: false, configOpen: false, clientId: '', clientSecret: '', username: '', password: '', testStatus: 'idle' },
    steadfast: { active: false, configOpen: false, apiKey: '', secretKey: '', testStatus: 'idle' },
    redx: { active: false, configOpen: false, accessToken: '', storeId: '', isSandbox: true, testStatus: 'idle' },
    ecourier: { active: false, configOpen: false, apiKey: '', apiSecret: '', userId: '' },
    paperfly: { active: false, configOpen: false, username: '', password: '' }
  });

  const [smsConfig, setSmsConfig] = useState({
    active: false,
    apiKey: '',
    senderId: 'AURALUXE'
  });

  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'Aura Luxe',
    contactEmail: 'contact@auraluxe.com',
    contactPhone: '+8801700000000',
    storeAddress: 'Banani, Dhaka, Bangladesh',
    industry: 'Fashion & Apparel',
    currency: 'BDT',
    timezone: 'Asia/Dhaka'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [orders, setOrders] = useState([
    { id: '#ORD-9021', customer: 'Ahmed I.', phone: '01711223344', address: 'Banani, Dhaka, Bangladesh', product: 'Royal Panjabi Elite', date: '2 mins ago', amount: 12500, status: 'Pending Verification', paymentMethod: 'Cash on Delivery', paymentStatus: 'Unpaid', imageUrl: 'https://images.unsplash.com/photo-1594938384824-0ce4562b8eee?w=800&q=80', color: 'Black', size: '40', riskScore: 12, riskFactors: ['New device'] },
    { id: '#ORD-9020', customer: 'Sara K.', phone: '01811223344', address: 'Gulshan 2, Dhaka, Bangladesh', product: 'Silk Saree', date: '15 mins ago', amount: 24990, status: 'Shipped', courier: 'Pathao', trackingId: 'PTH-883719', paymentMethod: 'SSLCommerz', paymentStatus: 'Paid', imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80', color: 'Crimson Red', size: 'Free Size', riskScore: 5, riskFactors: [] },
    { id: '#ORD-9019', customer: 'Fahim R.', phone: '01911223344', address: 'Dhanmondi 27, Dhaka, Bangladesh', product: 'Chronograph Watch', date: '1 hour ago', amount: 4500, status: 'Delivered', courier: 'Steadfast', trackingId: 'STD-19920', paymentMethod: 'bKash', paymentStatus: 'Paid', imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80', color: 'Silver/Black', size: 'Standard', riskScore: 45, riskFactors: ['Billing zip mismatch', 'Recent password change'] },
    { id: '#ORD-9018', customer: 'Zia U.', phone: '01511223344', address: 'Uttara Sector 4, Dhaka, Bangladesh', product: 'Wireless Earbuds', date: '3 hours ago', amount: 3200, status: 'Flagged', paymentMethod: 'Credit Card', paymentStatus: 'Failed', imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80', color: 'White', size: 'One Size', riskScore: 85, riskFactors: ['Multiple failed payment attempts', 'High order velocity', 'Proxy/VPN detected'] },
  ]);

  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

  const [selectedCourierOrderId, setSelectedCourierOrderId] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string>('');

  const [fraudCheckPhone, setFraudCheckPhone] = useState('');
  const [fraudCheckResult, setFraudCheckResult] = useState<{
    score: number;
    totalOrders: number;
    successfulDeliveries: number;
    returnedOrders: number;
    courierBreakdown: {
      courier: string;
      delivered: number;
      returned: number;
      total: number;
    }[];
  } | null>(null);
  const [isCheckingFraud, setIsCheckingFraud] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
    spent: number;
    lastOrder: string;
    risk: string;
    totalOrders: number;
    courier?: string;
    trackingId?: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const [realCustomers, setRealCustomers] = useState<any[]>([]);
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAdminError, setIsAdminError] = useState(false);
  const [categories, setCategories] = useState<{id?: string, name: string, isHot?: boolean}[]>([]);
  const [isEditingCategory, setIsEditingCategory] = useState<{id?: string, name: string, isHot?: boolean} | null>(null);
  const [contactMessages, setContactMessages] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsersData = async () => {
      if (!user) return;
      setIsLoadingData(true);
      setIsAdminError(false);
      try {
        const { doc, getDoc, setDoc } = await import('firebase/firestore');

        // Scaffold / Create Database defaults for Settings and Analytics if they don't exist
        try {
          const settingsRef = doc(db, 'settings', 'store');
          const settingsSnap = await getDoc(settingsRef);
          if (!settingsSnap.exists()) {
            await setDoc(settingsRef, {
              general: { storeName: 'Aura Luxe', contactEmail: 'contact@auraluxe.com', contactPhone: '+8801700000000', storeAddress: 'Banani, Dhaka, Bangladesh', industry: 'Fashion & Apparel', currency: 'BDT', timezone: 'Asia/Dhaka' },
              paymentProviders: {
                bkash: { active: false, appKey: '', appSecret: '' },
                sslcommerz: { active: false, storeId: '', storePassword: '' },
                rocket: { active: false, apiUser: '', apiPass: '' }
              },
              shipping: { zones: [{ name: 'Inside Dhaka', rate: 60, courier: 'Pathao' }] },
              smsConfig: { active: true, provider: 'Twilio', apiKey: 'demo', senderId: 'AURALUXE' }
            });
          }

          const analyticsRef = doc(db, 'analytics', 'dailyRevenue');
          const analyticsSnap = await getDoc(analyticsRef);
          if (!analyticsSnap.exists()) {
             await setDoc(analyticsRef, {
               data: [
                 { name: 'Mon', revenue: 12500 }, { name: 'Tue', revenue: 15400 },
                 { name: 'Wed', revenue: 11000 }, { name: 'Thu', revenue: 18400 },
                 { name: 'Fri', revenue: 24990 }, { name: 'Sat', revenue: 32000 }, { name: 'Sun', revenue: 28500 }
               ]
             });
             await setDoc(doc(db, 'analytics', 'orderVolume'), {
               data: [ { name: 'Mon', orders: 45 }, { name: 'Tue', orders: 52 }, { name: 'Wed', orders: 38 }, { name: 'Thu', orders: 65 }, { name: 'Fri', orders: 89 }, { name: 'Sat', orders: 112 }, { name: 'Sun', orders: 95 } ]
             });
             await setDoc(doc(db, 'analytics', 'topCategories'), {
                data: [ { name: 'Fashion', value: 45000 }, { name: 'Electronics', value: 30000 }, { name: 'Beauty', value: 15000 }, { name: 'Home & Living', value: 10000 } ]
             });
          }
        } catch (scaffoldErr) {
          console.log("Scaffold info:", scaffoldErr);
        }

        try {
          const finalSettingsSnap = await getDoc(doc(db, 'settings', 'store'));
          if (finalSettingsSnap.exists()) {
            const sd = finalSettingsSnap.data();
            if (sd.general) setGeneralSettings(prev => ({ ...prev, ...sd.general }));
            if (sd.paymentProviders) {
              setPaymentGatewayStates(prev => ({
                bkash: { ...prev.bkash, ...sd.paymentProviders.bkash },
                sslcommerz: { ...prev.sslcommerz, ...sd.paymentProviders.sslcommerz },
                rocket: { ...prev.rocket, ...sd.paymentProviders.rocket }
              }));
            }
            if (sd.smsConfig) setSmsConfig(sd.smsConfig);
            if (sd.shipping) {
              // we don't have a simple 1:1 mapping for couriers yet but could map if needed.
            }
            if (sd.couriers) {
               setCourierStates(prev => ({
                 pathao: { ...prev.pathao, ...sd.couriers.pathao },
                 steadfast: { ...prev.steadfast, ...sd.couriers.steadfast },
                 redx: { ...prev.redx, ...sd.couriers.redx },
                 ecourier: { ...prev.ecourier, ...sd.couriers.ecourier },
                 paperfly: { ...prev.paperfly, ...sd.couriers.paperfly }
               }));
            }
          }
        } catch (e) {
          console.error("Failed to load settings:", e);
        }

        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        const customersData: any[] = [];
        const ordersData: any[] = [];
        
        try {
          const catRef = collection(db, 'categories');
          const catSnap = await getDocs(catRef);
          const catsData: any[] = [];
          catSnap.forEach(doc => catsData.push({ id: doc.id, ...doc.data() }));
          setCategories(catsData);
        } catch(e) {
          console.error("Failed to load categories:", e);
        }
        
        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          let totalSpent = 0;
          let lastOrderDate = 'N/A';
          
          const ordersRef = collection(db, 'users', userDoc.id, 'orders');
          const ordersSnap = await getDocs(ordersRef);
          
          ordersSnap.forEach((oDoc) => {
            const oData: any = oDoc.data();
            totalSpent += (oData.total || 0);
            if (!lastOrderDate || lastOrderDate === 'N/A' || new Date(oData.date) > new Date(lastOrderDate)) {
              if (oData.date) lastOrderDate = new Date(oData.date).toLocaleDateString();
            }
            ordersData.push({
              id: oDoc.id,
              userId: userDoc.id,
              customer: oData.shippingInfo?.fullName || userData.displayName || 'Unknown',
              phone: oData.shippingInfo?.phone || userData.phoneNumber || '+880 17XXXXXXX',
              address: oData.shippingInfo?.address ? `${oData.shippingInfo.address}, ${oData.shippingInfo.city || ''}` : 'No address provided',
              customerEmail: userData.email,
              amount: oData.total || 0,
              date: oData.date ? new Date(oData.date).toLocaleString() : 'N/A',
              status: oData.status === 'processing' ? 'Pending Verification' : oData.status || 'Pending Verification',
              paymentMethod: oData.paymentMethod ? (oData.paymentMethod === 'cod' ? 'Cash on Delivery' : oData.paymentMethod.charAt(0).toUpperCase() + oData.paymentMethod.slice(1)) : (oData.walletAppliedAmount ? 'Wallet' : 'Other'),
              paymentStatus: oData.paymentStatus || (oData.paymentMethod === 'cod' ? 'Pending' : 'Paid'),
              product: oData.items && oData.items.length > 0 ? `${oData.items[0].name}${oData.items.length > 1 ? ` +${oData.items.length-1} more` : ''}` : 'Order',
              imageUrl: oData.items?.[0]?.imageUrl || '',
              riskScore: 20,
              riskFactors: [],
              raw: oData
            });
          });

          customersData.push({
            id: userDoc.id,
            name: userData.displayName || 'Unknown',
            email: userData.email || 'No email',
            spent: totalSpent,
            lastOrder: lastOrderDate,
            risk: 'Low',
            raw: userData
          });
        }
        
        // Sort orders by date descending
        ordersData.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        
        setRealCustomers(customersData);
        setOrders(ordersData);

        try {
          const messagesRef = collection(db, 'contact_messages');
          const messagesSnap = await getDocs(messagesRef);
          const messagesData: any[] = [];
          messagesSnap.forEach(doc => messagesData.push({ id: doc.id, ...doc.data() }));
          messagesData.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setContactMessages(messagesData);
        } catch(e) {
          console.error("Failed to load messages", e);
        }

        const totalRev = ordersData.reduce((acc, o) => acc + (o.amount || 0), 0);
        setStats({
          revenue: totalRev || 45000,
          orders: ordersData.length || 15,
          conversionRate: 3.2,
          aov: ordersData.length ? totalRev / ordersData.length : 3000,
          fraudScore: 0.015,
          fraudBlocked: 4
        });
      } catch (e: any) {
        console.error('Failed to fetch users or orders data', e);
        if (e.code === 'permission-denied') setIsAdminError(true);
      } finally {
        setIsLoadingData(false);
        setLoading(false);
      }
    };
    
    fetchUsersData();
  }, [user]);

  const saveCouriersToDB = async (newCouriersState: any) => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      await setDoc(doc(db, 'settings', 'store'), { couriers: newCouriersState }, { merge: true });
    } catch(e) {
      console.error('Failed to auto-save courier config', e);
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      const payload = {
        general: generalSettings,
        paymentProviders: {
          bkash: paymentGatewayStates.bkash,
          sslcommerz: paymentGatewayStates.sslcommerz,
          rocket: paymentGatewayStates.rocket
        },
        couriers: {
          pathao: courierStates.pathao,
          steadfast: courierStates.steadfast,
          redx: courierStates.redx,
          ecourier: courierStates.ecourier,
          paperfly: courierStates.paperfly
        },
        smsConfig: smsConfig
      };
      
      await setDoc(doc(db, 'settings', 'store'), payload, { merge: true });
      alert('Store settings saved successfully!');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isAuthChecking) {
    return <div className="min-h-screen bg-gray-50 text-gray-800 flex items-center justify-center font-sans tracking-widest text-xs uppercase text-gray-500">Checking auth state...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 flex items-center justify-center font-sans">
        <div className="text-center p-8 border border-gray-200 rounded-2xl bg-gray-100 max-w-sm w-full">
          <ShieldAlert size={48} className="mx-auto mb-6 text-red-500/80" />
          <h2 className="font-serif text-2xl mb-2 italic">Admin Access Restricted</h2>
          <p className="text-gray-500 text-sm mb-6">You must be signed in as an administrator to access the dashboard and manage products.</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-white text-black py-3 px-6 uppercase tracking-widest text-xs font-bold w-full hover:bg-blue-600 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={onExit}
              className="bg-transparent text-gray-500 py-3 px-6 uppercase tracking-widest text-xs font-bold w-full hover:text-blue-600 transition-colors border border-gray-200"
            >
              Back to Store
            </button>
          </div>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  if (isAdminError) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 flex bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center items-center justify-center font-sans">
        <div className="absolute inset-0 bg-white text-gray-800/80 backdrop-blur-sm"></div>
        <div className="relative z-10 max-w-md w-full p-8 bg-white/80 backdrop-blur-md border border-red-500/20 rounded-2xl text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h1 className="font-serif text-3xl italic text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-500 text-sm mb-6">User {user?.email} does not have administrative privileges. Please sign out and sign in with an admin account.</p>
          <div className="flex flex-col gap-3">
             <button 
              onClick={async () => {
                try {
                  await signOut(auth);
                } catch (e) {}
              }}
              className="bg-red-600 text-gray-800 py-3 px-6 uppercase tracking-widest text-xs font-bold w-full hover:bg-red-500 transition-colors rounded"
            >
              Sign Out
            </button>
            <button 
              onClick={onExit}
              className="bg-transparent text-gray-500 py-3 px-6 uppercase tracking-widest text-xs font-bold w-full hover:text-blue-600 transition-colors border border-gray-200 rounded"
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      await deleteDoc(doc(db, 'contact_messages', messageId));
      setContactMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (e) {
      console.error("Failed to delete message", e);
      alert("Failed to delete message. Please try again.");
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'accounts', label: 'Accounts', icon: FileText },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Filter },
    { id: 'offers', label: 'Offers & Promos', icon: Tag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'fraud', label: 'Fraud Engine', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'storefront', label: 'Storefront', icon: Layout },
    { id: 'adminProfile', label: 'Admin Profile', icon: UserIcon },
  ];

  const activeItem = navItems.find(i => i.id === activeTab) || navItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex overflow-hidden font-sans">
      
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 bg-gray-100 border-r border-gray-200 h-screen flex flex-col z-20"
          >
            <div className="h-16 flex items-center px-6 border-b border-gray-200 justify-between">
              <span className="font-serif text-2xl font-black italic tracking-tighter text-gray-800">NEXUS.</span>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-blue-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-4 px-2 mt-4">Menu</div>
              <nav className="space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id 
                        ? 'bg-gray-100 text-gray-800 border border-white/5' 
                        : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={18} className={activeTab === item.id ? 'text-blue-600' : ''} />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex flex-col gap-2">
               <button 
                onClick={onExit}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors"
               >
                 <ArrowLeft size={18} />
                 Exit to Store
               </button>
               <button 
                onClick={async () => {
                  try {
                    await signOut(auth);
                  } catch (e) {
                    console.error("Sign out failed", e);
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-500 hover:text-blue-600 hover:bg-red-500 hover:border-red-500 transition-colors"
               >
                 <LogOut size={18} />
                 Sign Out
               </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-gray-100 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-blue-600">
                <Menu size={20} />
              </button>
            )}
            <div className="relative hidden md:flex items-center">
              <Search size={16} className="absolute left-3 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search orders, customers..." 
                className="bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full font-mono uppercase tracking-wider font-bold text-[10px]">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               System Nominal
            </span>
            <button className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0a0a0a]"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8a7222] border border-gray-300"></div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
           {activeTab === 'overview' && (
             <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                  <h1 className="font-serif text-3xl italic text-gray-800 flex items-center gap-3">
                    <Activity className="text-blue-600" size={28} />
                    Command Center
                  </h1>
                  <div className="hidden sm:flex items-center gap-2">
                    <button className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors">Export Report</button>
                  </div>
                </div>

                {loading || !stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="h-32 bg-gray-50 border border-gray-200 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-6 bg-white border border-gray-200 rounded-xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center justify-between mb-4 relative">
                        <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Total Revenue</h3>
                        <TrendingUp size={16} className="text-blue-600" />
                      </div>
                      <p className="text-3xl font-serif italic">{FORMAT_CURRENCY(stats.revenue)}</p>
                      <p className="text-emerald-400 text-xs mt-2 font-mono">+12.5% vs last month</p>
                    </div>
                    
                    <div className="p-6 bg-white border border-gray-200 rounded-xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center justify-between mb-4 relative">
                        <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Active Orders</h3>
                        <ShoppingBag size={16} className="text-blue-400" />
                      </div>
                      <p className="text-3xl font-serif italic">{stats.orders.toLocaleString()}</p>
                      <p className="text-emerald-400 text-xs mt-2 font-mono">+8.1% vs last month</p>
                    </div>

                    <div className="p-6 bg-white border border-gray-200 rounded-xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center justify-between mb-4 relative">
                        <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Avg Order Value</h3>
                        <Users size={16} className="text-purple-400" />
                      </div>
                      <p className="text-3xl font-serif italic">{FORMAT_CURRENCY(stats.aov)}</p>
                      <p className="text-rose-400 text-xs mt-2 font-mono">-2.4% vs last month</p>
                    </div>

                    <div className="p-6 bg-white border border-red-500/20 rounded-xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center justify-between mb-4 relative">
                        <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Fraud Blocked</h3>
                        <ShieldAlert size={16} className="text-red-400" />
                      </div>
                      <p className="text-3xl font-serif italic text-gray-800">{stats.fraudBlocked}</p>
                      <p className="text-gray-500 text-xs mt-2 font-mono">{(stats.fraudScore * 100).toFixed(1)}% of total traffic</p>
                    </div>
                  </div>
                )}

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 p-6 bg-white border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="font-serif text-xl italic text-gray-800 mb-1">Revenue Overview</h3>
                        <p className="text-xs text-gray-500 font-sans">Daily sales performance across all channels</p>
                      </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <BarChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} tickLine={false} axisLine={false} />
                          <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                          <RechartsTooltip 
                            cursor={{ fill: '#222' }}
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="sales" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-gray-200 rounded-xl flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-serif text-xl italic text-gray-800 mb-1">Recent Activity</h3>
                        <p className="text-xs text-gray-500 font-sans">Latest transactions in BD</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
                       {orders.map((order, i) => (
                         <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-white/5 hover:border-gray-200 transition-colors">
                            <div>
                               <p className="font-bold text-sm text-gray-800">
                                 <button 
                                   onClick={() => setSelectedOrderDetails(order)}
                                   className="hover:text-blue-600 hover:underline focus:outline-none transition-colors"
                                 >
                                   {order.id}
                                 </button>{' '}
                                 <span className="text-gray-500 font-normal ml-1">
                                   by{' '}
                                   <button
                                     onClick={() => {
                                       setSelectedCustomer({
                                         name: order.customer,
                                         email: order.customerEmail || `${order.customer.replace(' ', '.').toLowerCase()}@example.com`,
                                         phone: (order as any).phone || '+880 17XXXXXXX',
                                         address: (order as any).address || 'No address provided',
                                         spent: order.amount * (Math.floor(Math.random() * 3) + 1),
                                         lastOrder: order.date,
                                         risk: order.status === 'Flagged' ? 'High' : 'Low',
                                         totalOrders: Math.floor(Math.random() * 5) + 1,
                                         courier: (order as any).courier,
                                         trackingId: (order as any).trackingId
                                       });
                                     }}
                                     className="hover:text-blue-600 hover:underline transition-colors focus:outline-none"
                                   >
                                     {order.customer}
                                   </button>
                                 </span>
                               </p>
                               <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{order.product}</p>
                            </div>
                            <div className="text-right">
                               <p className="font-mono text-sm text-blue-600">{FORMAT_CURRENCY(order.amount)}</p>
                               <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${order.status === 'Flagged' ? 'text-red-400' : 'text-emerald-400'}`}>
                                 {order.paymentMethod} • {order.status}
                               </p>
                            </div>
                         </div>
                       ))}
                    </div>
                    <button className="mt-4 w-full py-2 border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-widest text-blue-600 hover:bg-gray-50 transition-colors">View All Orders</button>
                  </div>
                </div>
             </div>
           )}

           {activeTab === 'orders' && (
             <div className="space-y-6 max-w-7xl mx-auto">
               <div className="flex items-center justify-between">
                  <h1 className="font-serif text-3xl italic text-gray-800 flex items-center gap-3">
                    <ShoppingCart className="text-blue-600" size={28} />
                    Orders Management
                  </h1>
               </div>

               {/* Fraud Detection Tools in BD */}
               <div className="bg-white border border-gray-200 rounded-xl p-6">
                 <h2 className="text-sm font-serif italic text-gray-800 mb-4 border-b border-gray-200 pb-2">Integrated Fraud & Return Check Tools (Bangladesh)</h2>
                 
                 {/* Phone Number Check */}
                 <div className="mb-8 border border-gray-200 p-6 bg-white rounded">
                   <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                     <ShieldAlert size={16} className="text-blue-600" />
                     Customer Phone Number Lookup
                   </h3>
                   <div className="flex gap-4">
                     <input 
                       type="text" 
                       placeholder="e.g. 017XXXXXXX" 
                       value={fraudCheckPhone}
                       onChange={(e) => setFraudCheckPhone(e.target.value)}
                       className="flex-1 bg-white text-gray-800 border border-gray-300 rounded px-4 py-2 text-gray-800 focus:border-blue-600 outline-none font-mono"
                     />
                     <button 
                       onClick={() => {
                         if (!fraudCheckPhone) return;
                         setIsCheckingFraud(true);
                         setTimeout(() => {
                           const totalOrders = Math.floor(Math.random() * 15) + 5;
                           const successfulDeliveries = Math.floor(totalOrders * 0.7);
                           const returnedOrders = totalOrders - successfulDeliveries;
                           
                           setFraudCheckResult({
                             score: Math.floor(Math.random() * 40) + 60, // 60-100 score
                             totalOrders,
                             successfulDeliveries,
                             returnedOrders,
                             courierBreakdown: [
                               { courier: 'Steadfast', delivered: Math.floor(successfulDeliveries * 0.5), returned: Math.floor(returnedOrders * 0.6), total: Math.floor(successfulDeliveries * 0.5) + Math.floor(returnedOrders * 0.6) },
                               { courier: 'Pathao', delivered: Math.floor(successfulDeliveries * 0.3), returned: Math.floor(returnedOrders * 0.3), total: Math.floor(successfulDeliveries * 0.3) + Math.floor(returnedOrders * 0.3) },
                               { courier: 'RedX', delivered: successfulDeliveries - Math.floor(successfulDeliveries * 0.5) - Math.floor(successfulDeliveries * 0.3), returned: returnedOrders - Math.floor(returnedOrders * 0.6) - Math.floor(returnedOrders * 0.3), total: (successfulDeliveries - Math.floor(successfulDeliveries * 0.5) - Math.floor(successfulDeliveries * 0.3)) + (returnedOrders - Math.floor(returnedOrders * 0.6) - Math.floor(returnedOrders * 0.3)) }
                             ].filter(c => c.total > 0).sort((a,b) => b.total - a.total)
                           });
                           setIsCheckingFraud(false);
                         }, 1000);
                       }}
                       disabled={isCheckingFraud || !fraudCheckPhone}
                       className="bg-blue-600 text-black px-6 py-2 font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors disabled:opacity-50"
                     >
                       {isCheckingFraud ? 'Scanning...' : 'Check Risk Profile'}
                     </button>
                   </div>
                   
                   {/* Results */}
                   {fraudCheckResult && (
                     <div className="mt-6 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4">
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="border border-gray-200 p-4 bg-white text-gray-800 rounded flex flex-col justify-center items-center">
                           <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Trust Score</p>
                           <p className={`text-3xl font-bold ${fraudCheckResult.score > 80 ? 'text-emerald-500' : fraudCheckResult.score > 60 ? 'text-orange-500' : 'text-red-500'}`}>
                             {fraudCheckResult.score}
                           </p>
                         </div>
                         <div className="border border-gray-200 p-4 bg-white text-gray-800 rounded flex flex-col justify-center items-center">
                           <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Parcels</p>
                           <p className="text-xl font-bold text-gray-800">{fraudCheckResult.totalOrders}</p>
                         </div>
                         <div className="border border-emerald-500/20 p-4 bg-emerald-500/5 rounded flex flex-col justify-center items-center">
                           <p className="text-[10px] text-emerald-500 uppercase tracking-widest mb-1">Delivered</p>
                           <p className="text-xl font-bold text-emerald-400">{fraudCheckResult.successfulDeliveries}</p>
                         </div>
                         <div className="border border-red-500/20 p-4 bg-red-500/5 rounded flex flex-col justify-center items-center">
                           <p className="text-[10px] text-red-500 uppercase tracking-widest mb-1">Returned</p>
                           <p className="text-xl font-bold text-red-400">{fraudCheckResult.returnedOrders}</p>
                         </div>
                       </div>
                       
                       {/* Courier Breakdown */}
                       <div className="border border-gray-200 bg-white text-gray-800 rounded p-4">
                         <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2">Courier History Breakdown</h4>
                         <div className="space-y-2">
                           {fraudCheckResult.courierBreakdown.map((courier, idx) => (
                             <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors">
                               <p className="font-bold text-sm text-gray-800">{courier.courier}</p>
                               <div className="flex gap-4">
                                 <span className="text-xs text-gray-500"><span className="text-gray-800 font-mono">{courier.total}</span> Total</span>
                                 <span className="text-xs text-emerald-500"><span className="font-mono">{courier.delivered}</span> Delivered</span>
                                 <span className="text-xs text-red-500"><span className="font-mono">{courier.returned}</span> Returned</span>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   )}
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-gray-50 border border-gray-200 p-4 rounded hover:border-blue-600/50 transition-colors">
                     <div className="flex justify-between items-start mb-2">
                       <p className="font-bold text-gray-800 text-sm">Steadfast Auth DB</p>
                       <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>
                     </div>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest">Checks unaccepted COD history</p>
                   </div>
                   <div className="bg-gray-50 border border-gray-200 p-4 rounded hover:border-blue-600/50 transition-colors">
                     <div className="flex justify-between items-start mb-2">
                       <p className="font-bold text-gray-800 text-sm">Pathao User Trust Score</p>
                       <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>
                     </div>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest">Predicts return probability</p>
                   </div>
                   <div className="bg-gray-50 border border-gray-200 p-4 rounded hover:border-blue-600/50 transition-colors">
                     <div className="flex justify-between items-start mb-2">
                       <p className="font-bold text-gray-800 text-sm">RedX Fraud AI</p>
                       <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Disabled</span>
                     </div>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest">Cross-merchant risk analysis</p>
                   </div>
                   <div className="bg-gray-50 border border-gray-200 p-4 rounded hover:border-blue-600/50 transition-colors">
                     <div className="flex justify-between items-start mb-2">
                       <p className="font-bold text-gray-800 text-sm">SSLCommerz RMS</p>
                       <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>
                     </div>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest">Payment risk management</p>
                   </div>
                 </div>
               </div>

               <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-white border-b border-gray-200 text-xs uppercase tracking-widest text-gray-500">
                     <tr>
                       <th className="px-6 py-4 font-bold">Order ID</th>
                       <th className="px-6 py-4 font-bold">Customer</th>
                       <th className="px-6 py-4 font-bold">Product</th>
                       <th className="px-6 py-4 font-bold">Amount</th>
                       <th className="px-6 py-4 font-bold">Payment</th>
                       <th className="px-6 py-4 font-bold">Date</th>
                       <th className="px-6 py-4 font-bold">Status</th>
                       <th className="px-6 py-4 font-bold">Risk Score</th>
                       <th className="px-6 py-4 font-bold text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {orders.map((order, i) => (
                       <tr key={i} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 font-medium">
                           <button 
                             onClick={() => setSelectedOrderDetails(order)}
                             className="hover:text-blue-600 hover:underline focus:outline-none transition-colors"
                           >
                             {order.id}
                           </button>
                           {order.courier && <p className="text-[10px] text-gray-500 font-normal mt-0.5">{order.courier}: {order.trackingId}</p>}
                         </td>
                         <td className="px-6 py-4">
                           <button 
                             onClick={() => {
                               setSelectedCustomer({
                                 name: order.customer,
                                 email: order.customerEmail || `${order.customer.replace(' ', '.').toLowerCase()}@example.com`,
                                 phone: (order as any).phone || '+880 17XXXXXXX',
                                 address: (order as any).address || 'No address provided',
                                 spent: order.amount * (Math.floor(Math.random() * 3) + 1),
                                 lastOrder: order.date,
                                 risk: order.status === 'Flagged' ? 'High' : 'Low',
                                 totalOrders: Math.floor(Math.random() * 5) + 1,
                                 courier: (order as any).courier,
                                 trackingId: (order as any).trackingId
                               });
                             }}
                             className="text-gray-300 hover:text-blue-600 hover:underline transition-colors focus:outline-none"
                           >
                             {order.customer}
                           </button>
                         </td>
                         <td className="px-6 py-4 text-gray-300">{order.product}</td>
                         <td className="px-6 py-4 text-blue-600 font-mono">{FORMAT_CURRENCY(order.amount)}</td>
                         <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                             <span className="text-xs text-gray-300">{order.paymentMethod || 'N/A'}</span>
                             <span className={`text-[10px] uppercase font-bold tracking-widest ${order.paymentStatus === 'Paid' ? 'text-emerald-500' : order.paymentStatus === 'Failed' ? 'text-red-500' : 'text-orange-500'}`}>
                               {order.paymentStatus || 'Pending'}
                             </span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-gray-500">{order.date}</td>
                         <td className="px-6 py-4">
                           <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full border ${order.status === 'Flagged' ? 'bg-red-500/10 text-red-400 border-red-500/20' : order.status === 'Pending Verification' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : order.status === 'Processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                             {order.status}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           {order.riskScore !== undefined && (
                             <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] border ${order.riskScore > 70 ? 'bg-red-500/5 border-red-500/20 text-red-400' : order.riskScore > 30 ? 'bg-orange-500/5 border-orange-500/20 text-orange-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                               <div className={`w-1.5 h-1.5 rounded-full ${order.riskScore > 70 ? 'bg-red-500' : order.riskScore > 30 ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                               <span className="text-[10px] font-bold font-mono tracking-widest uppercase">
                                 {order.riskScore} / 100
                               </span>
                             </div>
                           )}
                         </td>
                         <td className="px-6 py-4 text-right">
                           {order.status === 'Pending Verification' && (
                             <button 
                               onClick={() => setSelectedCourierOrderId(order.id)}
                               className="text-[10px] bg-white text-black px-3 py-1 font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors rounded"
                             >
                               Verify & Ship
                             </button>
                           )}
                           {order.status === 'Shipped' && (
                             <button 
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 const shouldDeliver = window.confirm('Mark this order as Delivered manually?');
                                 
                                 // Add Sync Logic
                                 if (!shouldDeliver && order.trackingId && order.courier && window.confirm(`Sync live status from ${order.courier} instead?`)) {
                                      try {
                                        const stateKey = order.courier?.toLowerCase() as keyof typeof courierStates;
                                        const credentials = courierStates[stateKey];
                                        if (!credentials) return alert("No courier credentials found");

                                        const response = await fetch('/api/courier/track', {
                                           method: 'POST',
                                           headers: { 'Content-Type': 'application/json' },
                                           body: JSON.stringify({ trackingId: order.trackingId, courier: order.courier, credentials })
                                        });
                                        
                                        if (response.ok) {
                                           const data = await response.json();
                                           if (data.status) {
                                              const newStatus = data.status;
                                              if (order.userId && order.id) {
                                                  const { doc, updateDoc } = await import('firebase/firestore');
                                                  await updateDoc(doc(db, 'users', order.userId, 'orders', order.id), { status: newStatus });
                                              }
                                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1) } : o));
                                              alert(`Status synced: ${newStatus}`);
                                           }
                                        }
                                      } catch (err) {}
                                      return;
                                 }

                                 if(shouldDeliver) {
                                   setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Delivered' } : o));
                                   if (smsConfig.active) {
                                      await sendSMS(
                                        '+8801700000000', // Mock customer phone
                                        `AURALUXE: Great news! Your order ${order.id} has been delivered. Thank you form shopping with us.`,
                                        smsConfig
                                      );
                                   }
                                 }
                               }}
                               className="text-[10px] bg-emerald-500 text-black px-3 py-1 mt-1 font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors rounded"
                             >
                               Mark Delivered
                             </button>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {activeTab === 'products' && (
             <div className="space-y-6 max-w-7xl mx-auto">
               <div className="flex items-center justify-between">
                  <h1 className="font-serif text-3xl italic text-gray-800 flex items-center gap-3">
                    <Package className="text-blue-600" size={28} />
                    Products Catalog
                  </h1>
                  <button onClick={() => { setProductToEdit(null); setIsAddProductOpen(true); }} className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors rounded">
                    + Add Product
                  </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {productsList.map(product => (
                   <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col relative group p-4 gap-4">
                     <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                       <button 
                         onClick={() => { setProductToEdit(product); setIsAddProductOpen(true); }}
                         className="bg-white/90 text-black p-2 hover:bg-blue-600 transition-colors rounded"
                       >
                         <Settings size={14} />
                       </button>
                       <button 
                         onClick={async () => {
                           if (window.confirm('Are you sure you want to delete this product?')) {
                             try {
                               const { deleteDoc, doc } = await import('firebase/firestore');
                               const { db } = await import('../lib/firebase');
                               await deleteDoc(doc(db, 'products', product.id));
                             } catch (err) {
                               console.error('Failed to delete product:', err);
                             }
                           }
                         }}
                         className="bg-red-500/90 text-gray-800 p-2 hover:bg-red-600 transition-colors rounded"
                       >
                         <X size={14} />
                       </button>
                     </div>
                     <div className="flex items-center gap-4">
                       <img src={product.imageUrl} alt={product.name} className="w-20 h-24 object-cover rounded opacity-80" />
                       <div className="flex-1">
                         <h3 className="font-serif text-lg leading-tight mb-1">{product.name}</h3>
                         <p className="text-gray-500 text-xs mb-2 line-clamp-1">{product.sku ? `${product.sku} - ` : ''}{product.description}</p>
                         <div className="flex items-center justify-between">
                           <span className="text-blue-600 font-mono font-bold text-sm">{FORMAT_CURRENCY(product.price)}</span>
                           {(!product.stock || product.stock > 0) ? (
                             <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-full">{product.stock || 'In'} Stock</span>
                           ) : (
                             <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 border border-red-500/20 rounded-full">Sold Out</span>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {activeTab === 'categories' && (
             <div className="space-y-6 max-w-7xl mx-auto">
               <div className="flex items-center justify-between">
                  <h1 className="font-serif text-3xl italic text-gray-800 flex items-center gap-3">
                    <Layout className="text-blue-600" size={28} />
                    Category Management
                  </h1>
                  <button onClick={() => { setIsEditingCategory({ name: '', isHot: false }); }} className="bg-white text-black border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors rounded">
                    + Add Category
                  </button>
               </div>
               
               {isEditingCategory && (
                 <div className="bg-white p-6 border border-gray-200 rounded-xl mb-6 shadow-sm">
                   <h2 className="text-lg font-bold mb-4">{isEditingCategory.id ? 'Edit Category' : 'New Category'}</h2>
                   <div className="flex flex-col gap-4">
                     <div>
                       <label className="block text-xs text-gray-500 mb-1">Category Name</label>
                       <input 
                         type="text" 
                         value={isEditingCategory.name} 
                         onChange={(e) => setIsEditingCategory({ ...isEditingCategory, name: e.target.value })}
                         className="w-full bg-white border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500" 
                       />
                     </div>
                     <div>
                       <label className="flex items-center gap-2 cursor-pointer text-sm">
                         <input 
                           type="checkbox" 
                           checked={isEditingCategory.isHot || false} 
                           onChange={(e) => setIsEditingCategory({ ...isEditingCategory, isHot: e.target.checked })}
                           className="rounded text-red-500 focus:ring-red-500"
                         />
                         <span className="font-bold text-red-500 text-xs">Mark as HOT</span>
                       </label>
                     </div>
                     <div className="flex items-center gap-4 mt-2">
                       <button 
                         onClick={async () => {
                           if (!isEditingCategory.name.trim()) return;
                           try {
                             const { doc, addDoc, updateDoc, collection } = await import('firebase/firestore');
                             const { db } = await import('../lib/firebase');
                             if (isEditingCategory.id) {
                               const ref = doc(db, 'categories', isEditingCategory.id);
                               await updateDoc(ref, { name: isEditingCategory.name, isHot: isEditingCategory.isHot });
                               setCategories(categories.map(c => c.id === isEditingCategory.id ? isEditingCategory : c));
                             } else {
                               const res = await addDoc(collection(db, 'categories'), { name: isEditingCategory.name, isHot: isEditingCategory.isHot });
                               setCategories([...categories, { id: res.id, name: isEditingCategory.name, isHot: isEditingCategory.isHot }]);
                             }
                             setIsEditingCategory(null);
                           } catch (err) {
                             console.error("Failed to save category", err);
                           }
                         }}
                         className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-blue-700"
                       >
                         Save Category
                       </button>
                       <button onClick={() => setIsEditingCategory(null)} className="text-gray-500 text-xs uppercase hover:text-gray-800">Cancel</button>
                     </div>
                   </div>
                 </div>
               )}

               <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-white border-b border-gray-200 text-xs uppercase tracking-widest text-gray-500">
                     <tr>
                       <th className="px-6 py-4 font-bold">Category Name</th>
                       <th className="px-6 py-4 font-bold text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {categories.map((cat, i) => (
                       <tr key={cat.id || i} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 font-medium">
                           {cat.name}
                           {cat.isHot && <span className="ml-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">HOT</span>}
                         </td>
                         <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                           <button onClick={() => setIsEditingCategory(cat)} className="text-blue-500 hover:text-blue-700 text-xs font-bold uppercase">Edit</button>
                           <button 
                             onClick={async () => {
                               if(window.confirm('Delete category?')) {
                                 try {
                                   const { doc, deleteDoc } = await import('firebase/firestore');
                                   const { db } = await import('../lib/firebase');
                                   if (cat.id) await deleteDoc(doc(db, 'categories', cat.id));
                                   setCategories(categories.filter(c => c.id !== cat.id));
                                 } catch(e) { console.error('Failed to delete category', e); }
                               }
                             }} 
                             className="text-red-500 hover:text-red-700 text-xs font-bold uppercase"
                           >Delete</button>
                         </td>
                       </tr>
                     ))}
                     {categories.length === 0 && (
                       <tr>
                         <td colSpan={2} className="px-6 py-12 text-center text-gray-500">No categories found.</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {activeTab === 'offers' && (
             <OffersManager products={productsList} />
           )}

          {activeTab === 'customers' && (
             <div className="space-y-6 max-w-7xl mx-auto">
               <div className="flex items-center justify-between">
                  <h1 className="font-serif text-3xl italic text-gray-800 flex items-center gap-3">
                    <Users className="text-blue-600" size={28} />
                    Customer Directory
                  </h1>
               </div>
               <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-white border-b border-gray-200 text-xs uppercase tracking-widest text-gray-500">
                     <tr>
                       <th className="px-6 py-4 font-bold">Name</th>
                       <th className="px-6 py-4 font-bold">Email</th>
                       <th className="px-6 py-4 font-bold">Total Spent</th>
                       <th className="px-6 py-4 font-bold">Last Order</th>
                       <th className="px-6 py-4 font-bold">Risk Level</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {realCustomers.map((customer, i) => (
                       <tr key={customer.id || i} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 font-medium flex items-center gap-3 text-gray-800">
                           <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-serif text-blue-600">
                             {customer.name.charAt(0)}
                           </div>
                           {customer.name}
                         </td>
                         <td className="px-6 py-4 text-gray-500">{customer.email}</td>
                         <td className="px-6 py-4 font-mono text-gray-800">{FORMAT_CURRENCY(customer.spent)}</td>
                         <td className="px-6 py-4 text-gray-500">{customer.lastOrder}</td>
                         <td className="px-6 py-4">
                           <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full border ${customer.risk === 'High' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                             {customer.risk} Risk
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {activeTab === 'messages' && (
             <div className="space-y-6 max-w-7xl mx-auto">
               <div className="flex items-center justify-between">
                  <h1 className="font-serif text-3xl italic text-gray-800 flex items-center gap-3">
                    <MessageSquare className="text-blue-600" size={28} />
                    Customer Messages
                  </h1>
               </div>
               {contactMessages.length === 0 ? (
                 <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                   <MessageSquare className="text-gray-300 mx-auto mb-4" size={48} />
                   <h3 className="text-xl font-bold text-gray-800 mb-2">No messages yet</h3>
                   <p className="text-gray-500">When customers contact you, their messages will appear here.</p>
                 </div>
               ) : (
                 <div className="grid gap-4">
                   {contactMessages.map((msg, idx) => (
                     <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <h3 className="font-bold text-lg text-gray-800">{msg.subject}</h3>
                           <p className="text-sm text-gray-500">From: {msg.name} ({msg.email})</p>
                         </div>
                         <div className="flex items-center gap-4">
                           <div className="text-xs text-gray-400">
                             {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'N/A'}
                           </div>
                           <button 
                             onClick={() => handleDeleteMessage(msg.id)}
                             className="text-gray-400 hover:text-red-600 transition-colors"
                             title="Delete message"
                           >
                             <Trash2 size={18} />
                           </button>
                         </div>
                       </div>
                       <div className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap border border-gray-100">
                         {msg.message}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}

           {activeTab === 'fraud' && (
             <div className="space-y-6 max-w-7xl mx-auto">
               <div className="flex items-center justify-between">
                  <h1 className="font-serif text-3xl italic text-gray-800 flex items-center gap-3">
                    <ShieldAlert className="text-red-500" size={28} />
                    Fraud Engine AI
                  </h1>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <div className="bg-white border border-red-500/20 rounded-xl p-6 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>
                   <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1 relative">Blocked Transactions</h3>
                   <p className="text-4xl font-serif text-red-50 relative">{stats?.fraudBlocked || 142}</p>
                 </div>
                 <div className="bg-white border border-gray-200 rounded-xl p-6">
                   <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Risk Threshold</h3>
                   <p className="text-4xl font-serif text-gray-800">85<span className="text-xl text-gray-500">%</span></p>
                 </div>
                 <div className="bg-white border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-indigo-500/10 to-transparent">
                   <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">AI Model Confidence</h3>
                   <p className="text-4xl font-serif text-indigo-50">99.4<span className="text-xl text-indigo-400/50">%</span></p>
                 </div>
               </div>

               <h3 className="font-serif text-xl italic text-gray-800 mb-4">Recent Flagged Activity</h3>
               <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-white border-b border-gray-200 text-xs uppercase tracking-widest text-gray-500">
                     <tr>
                       <th className="px-6 py-4 font-bold">Transaction</th>
                       <th className="px-6 py-4 font-bold">User / IP</th>
                       <th className="px-6 py-4 font-bold">AI Reason</th>
                       <th className="px-6 py-4 font-bold">Score</th>
                       <th className="px-6 py-4 font-bold">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {[
                       { id: 'TXN-001', user: 'Zia U.', ip: '103.220.19.4', reason: 'Multiple failed CVV attempts', score: '98%' },
                       { id: 'TXN-002', user: 'Guest', ip: '45.12.3.88', reason: 'High-risk location IP match', score: '87%' }
                     ].map((fraud, i) => (
                       <tr key={i} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 font-medium font-mono text-gray-300">{fraud.id}</td>
                         <td className="px-6 py-4 text-gray-500">{fraud.user} <br/><span className="text-[10px] text-gray-500">{fraud.ip}</span></td>
                         <td className="px-6 py-4 text-red-300">{fraud.reason}</td>
                         <td className="px-6 py-4 font-mono text-red-500 font-bold">{fraud.score}</td>
                         <td className="px-6 py-4">
                           <div className="flex gap-2">
                             <button className="px-3 py-1 bg-white hover:bg-gray-200 text-black text-[10px] font-bold uppercase tracking-widest rounded transition-colors">Block</button>
                             <button className="px-3 py-1 border border-gray-300 hover:bg-gray-100 text-gray-800 text-[10px] font-bold uppercase tracking-widest rounded transition-colors">Allow</button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {activeTab === 'accounts' && (
             <div className="space-y-6 max-w-7xl mx-auto">
               <div className="flex items-center justify-between mb-8">
                  <h1 className="font-serif text-3xl italic text-gray-800 flex items-center gap-3">
                    <FileText className="text-blue-600" size={28} />
                    Accounts & Invoices
                  </h1>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <div className="p-6 bg-white border border-gray-200 rounded-xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4 relative">Current Balance</h3>
                   <p className="text-3xl font-serif italic text-emerald-400">{FORMAT_CURRENCY(425000)}</p>
                 </div>
                 <div className="p-6 bg-white border border-gray-200 rounded-xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4 relative">Pending Clearances</h3>
                   <p className="text-3xl font-serif italic text-blue-400">{FORMAT_CURRENCY(54000)}</p>
                 </div>
                 <div className="p-6 bg-white border border-gray-200 rounded-xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4 relative">Total Invoiced (This Month)</h3>
                   <p className="text-3xl font-serif italic text-gray-800">{FORMAT_CURRENCY(1250000)}</p>
                 </div>
               </div>

               <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                 <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                   <h3 className="font-serif italic text-gray-800 text-lg">Transaction History & Invoices</h3>
                 </div>
                 <table className="w-full text-left text-sm">
                   <thead className="bg-white text-gray-800 border-b border-gray-200 text-xs uppercase tracking-widest text-gray-500">
                     <tr>
                       <th className="px-6 py-4 font-bold">Transaction ID</th>
                       <th className="px-6 py-4 font-bold">Order Ref</th>
                       <th className="px-6 py-4 font-bold">Payment Method</th>
                       <th className="px-6 py-4 font-bold">Amount</th>
                       <th className="px-6 py-4 font-bold">Date</th>
                       <th className="px-6 py-4 font-bold">Status</th>
                       <th className="px-6 py-4 font-bold text-right">Invoice</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {orders.map((order, i) => (
                       <tr key={i} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 font-mono text-gray-300">TXN-{91000 + i}</td>
                         <td className="px-6 py-4 text-gray-500">{order.id}</td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <CreditCard size={14} className="text-gray-500" />
                             <span>{order.paymentMethod || 'Default'}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-blue-600 font-mono">{FORMAT_CURRENCY(order.amount)}</td>
                         <td className="px-6 py-4 text-gray-500">{order.date}</td>
                         <td className="px-6 py-4">
                           <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full border ${order.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : order.paymentStatus === 'Failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                             {order.paymentStatus || 'Pending'}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                           {order.paymentStatus === 'Paid' ? (
                             <button 
                               onClick={() => setInvoiceOrder(order)}
                               className="inline-flex items-center gap-2 text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-100 hover:text-blue-600 transition-colors focus:outline-none"
                             >
                               <Download size={14} />
                               Print
                             </button>
                           ) : (
                             <button 
                               onClick={() => setInvoiceOrder(order)}
                               className="inline-flex items-center gap-2 text-xs border border-gray-200 px-3 py-1.5 rounded text-gray-500 hover:text-blue-600 transition-colors focus:outline-none"
                             >
                               <Eye size={14} />
                               View
                             </button>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {activeTab === 'analytics' && (
             <div className="space-y-6 max-w-7xl mx-auto">
               <div className="flex items-center justify-between mb-8">
                  <h1 className="font-serif text-3xl italic text-gray-800 flex items-center gap-3">
                    <PieChart className="text-blue-600" size={28} />
                    Analytics & Growth
                  </h1>
               </div>
               
               {/* Advanced Charts Section in Analytics */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                 {/* Daily Revenue Trends */}
                 <div className="p-6 bg-white border border-gray-200 rounded-xl lg:col-span-2">
                   <div className="flex items-center justify-between mb-8">
                     <div>
                       <h3 className="font-serif text-xl italic text-gray-800 mb-1">Daily Revenue Trends</h3>
                       <p className="text-xs text-gray-500 font-sans">Revenue over the last 7 days</p>
                     </div>
                   </div>
                   <div className="h-80">
                     <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                       <AreaChart data={[
                         { name: 'Mon', revenue: 12500 },
                         { name: 'Tue', revenue: 15400 },
                         { name: 'Wed', revenue: 11000 },
                         { name: 'Thu', revenue: 18400 },
                         { name: 'Fri', revenue: 24990 },
                         { name: 'Sat', revenue: 32000 },
                         { name: 'Sun', revenue: 28500 }
                       ]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                         <defs>
                           <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                         <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                         <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} tickFormatter={(val) => `৳${val/1000}k`} axisLine={false} tickLine={false} />
                         <RechartsTooltip 
                           cursor={{ stroke: '#555', strokeWidth: 1, strokeDasharray: '3 3' }}
                           contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                           itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                           formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                         />
                         <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 {/* Order Volume */}
                 <div className="p-6 bg-white border border-gray-200 rounded-xl">
                   <div className="flex items-center justify-between mb-8">
                     <div>
                       <h3 className="font-serif text-xl italic text-gray-800 mb-1">Order Volume</h3>
                       <p className="text-xs text-gray-500 font-sans">Number of orders per day</p>
                     </div>
                   </div>
                   <div className="h-72">
                     <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                       <BarChart data={[
                         { name: 'Mon', orders: 45 },
                         { name: 'Tue', orders: 52 },
                         { name: 'Wed', orders: 38 },
                         { name: 'Thu', orders: 65 },
                         { name: 'Fri', orders: 89 },
                         { name: 'Sat', orders: 112 },
                         { name: 'Sun', orders: 95 }
                       ]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                         <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                         <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                         <RechartsTooltip 
                           cursor={{ fill: '#222' }}
                           contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                           itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                         />
                         <Bar dataKey="orders" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
                 
                 {/* Top Selling Categories */}
                 <div className="p-6 bg-white border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="font-serif text-xl italic text-gray-800 mb-1">Top Categories</h3>
                        <p className="text-xs text-gray-500 font-sans">Revenue distribution by category</p>
                      </div>
                    </div>
                    <div className="h-72 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <RechartsPieChart>
                          <Pie
                            data={[
                              { name: 'Fashion', value: 45000 },
                              { name: 'Electronics', value: 30000 },
                              { name: 'Beauty', value: 15000 },
                              { name: 'Home & Living', value: 10000 }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            <Cell fill="#D4AF37" />
                            <Cell fill="#60a5fa" />
                            <Cell fill="#34d399" />
                            <Cell fill="#f87171" />
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ fontWeight: 'bold' }}
                            formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-600"></div>Fashion</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#60a5fa]"></div>Electronics</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#34d399]"></div>Beauty</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f87171]"></div>Home & Living</div>
                    </div>
                 </div>
               </div>
             </div>
           )}

           {activeTab === 'storefront' && <StorefrontManager />}

           {activeTab === 'settings' && (
             <div className="space-y-6 max-w-4xl mx-auto">
               <div className="flex items-center justify-between mb-8">
                  <h1 className="font-serif text-3xl italic text-gray-800 flex items-center gap-3">
                    <Settings className="text-blue-600" size={28} />
                    Store Settings
                  </h1>
                  <button onClick={saveSettings} disabled={isSavingSettings} className="bg-blue-600 text-black px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors rounded disabled:opacity-50">
                    {isSavingSettings ? 'Saving...' : 'Save Changes'}
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {/* Sidebar Navigation for Settings */}
                 <div className="md:col-span-1 space-y-2">
                   {['General', 'Payment Providers', 'Shipping', 'Tax', 'Notifications', 'SMS Gateway', 'Staff'].map(tab => (
                     <button
                       key={tab}
                       onClick={() => setActiveSettingsTab(tab)}
                       className={`w-full text-left px-4 py-3 rounded text-sm transition-colors ${activeSettingsTab === tab ? 'bg-gray-100 text-gray-800 font-bold border-l-2 border-blue-600' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50 border-l-2 border-transparent'}`}
                     >
                       {tab}
                     </button>
                   ))}
                 </div>

                 {/* Settings Content */}
                 <div className="md:col-span-2 space-y-8">
                   {activeSettingsTab === 'General' && (
                     <>
                       <div className="bg-white border border-gray-200 rounded-xl p-6">
                         <h3 className="text-lg font-serif italic text-gray-800 mb-6 border-b border-gray-200 pb-4">Store Details</h3>
                         <div className="space-y-4">
                           <div>
                             <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Store Name</label>
                             <input type="text" value={generalSettings.storeName || ''} onChange={e => setGeneralSettings(p => ({ ...p, storeName: e.target.value }))} className="w-full bg-transparent border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-600" />
                           </div>
                           <div>
                             <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Contact Email</label>
                             <input type="email" value={generalSettings.contactEmail || ''} onChange={e => setGeneralSettings(p => ({ ...p, contactEmail: e.target.value }))} className="w-full bg-transparent border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-600" />
                           </div>
                           <div>
                             <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Contact Phone</label>
                             <input type="text" value={generalSettings.contactPhone || ''} onChange={e => setGeneralSettings(p => ({ ...p, contactPhone: e.target.value }))} className="w-full bg-transparent border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-600" />
                           </div>
                           <div>
                             <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Store Address</label>
                             <textarea value={generalSettings.storeAddress || ''} onChange={e => setGeneralSettings(p => ({ ...p, storeAddress: e.target.value }))} className="w-full bg-transparent border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-600 h-24"></textarea>
                           </div>
                           <div>
                             <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Store Industry</label>
                             <select value={generalSettings.industry} onChange={e => setGeneralSettings(p => ({ ...p, industry: e.target.value }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-600 appearance-none">
                               <option>Fashion & Apparel</option>
                               <option>Electronics</option>
                               <option>Home & Garden</option>
                               <option>Jewelry & Accessories</option>
                             </select>
                           </div>
                         </div>
                       </div>

                       <div className="bg-white border border-gray-200 rounded-xl p-6">
                         <h3 className="text-lg font-serif italic text-gray-800 mb-6 border-b border-gray-200 pb-4">Regional Formatting</h3>
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Store Currency</label>
                             <select value={generalSettings.currency} onChange={e => setGeneralSettings(p => ({ ...p, currency: e.target.value }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-600 appearance-none max-h-48 overflow-y-auto">
                               {Intl.supportedValuesOf('currency').map(c => (
                                 <option key={c} value={c}>{c}</option>
                               ))}
                             </select>
                           </div>
                           <div>
                             <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Timezone</label>
                             <select value={generalSettings.timezone} onChange={e => setGeneralSettings(p => ({ ...p, timezone: e.target.value }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-600 appearance-none max-h-48 overflow-y-auto">
                               {Intl.supportedValuesOf('timeZone').map(tz => (
                                 <option key={tz} value={tz}>{tz}</option>
                               ))}
                             </select>
                           </div>
                         </div>
                       </div>

                       <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                         <h3 className="text-lg font-serif italic text-red-500 mb-2">Danger Zone</h3>
                         <p className="text-sm text-gray-500 mb-4">Temporarily pause your store or permanently delete it.</p>
                         <div className="flex gap-4">
                           <button className="px-4 py-2 border border-red-500/50 text-red-500 text-xs font-bold uppercase tracking-widest rounded hover:bg-red-500 hover:text-blue-600 transition-colors">
                             Pause Store
                           </button>
                         </div>
                       </div>
                     </>
                   )}

                   {activeSettingsTab === 'Payment Providers' && (
                     <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-6">
                       <div>
                         <h3 className="text-lg font-serif italic text-gray-800 mb-6 border-b border-gray-200 pb-4">Payment Gateways</h3>
                         <div className="space-y-4">
                           {/* bKash */}
                           <div className="border border-gray-200 bg-gray-50 rounded p-4">
                             <div className="flex items-center justify-between mb-2">
                               <div>
                                 <p className="font-bold text-[#E2136E] mb-1 flex items-center gap-2">
                                   bKash 
                                   {paymentGatewayStates.bkash.active && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>}
                                 </p>
                                 <p className="text-sm text-gray-500">Accept mobile money payments via bKash</p>
                               </div>
                               <button 
                                 onClick={() => setPaymentGatewayStates(prev => ({ ...prev, bkash: { ...prev.bkash, configOpen: !prev.bkash.configOpen } }))}
                                 className="text-xs uppercase tracking-widest border border-gray-300 text-gray-800 px-4 py-2 font-bold hover:bg-gray-100"
                               >
                                 {paymentGatewayStates.bkash.configOpen ? 'Cancel' : (paymentGatewayStates.bkash.active ? 'Manage' : 'Configure')}
                               </button>
                             </div>
                             
                             {paymentGatewayStates.bkash.configOpen && (
                               <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">App Key</label>
                                   <input type="text" value={paymentGatewayStates.bkash.appKey} onChange={e => setPaymentGatewayStates(p => ({ ...p, bkash: { ...p.bkash, appKey: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">App Secret</label>
                                   <input type="password" value={paymentGatewayStates.bkash.appSecret} onChange={e => setPaymentGatewayStates(p => ({ ...p, bkash: { ...p.bkash, appSecret: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div className="flex gap-4">
                                   <button 
                                     onClick={() => setPaymentGatewayStates(p => ({ ...p, bkash: { ...p.bkash, active: !!p.bkash.appKey, configOpen: false } }))}
                                     className="text-xs bg-blue-600 text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-white"
                                   >
                                     Save Connection
                                   </button>
                                 </div>
                               </div>
                             )}
                           </div>

                           {/* SSLCommerz */}
                           <div className="border border-gray-200 bg-gray-50 rounded p-4">
                             <div className="flex items-center justify-between mb-2">
                               <div>
                                 <p className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                                   SSLCommerz
                                   {paymentGatewayStates.sslcommerz.active && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>}
                                 </p>
                                 <p className="text-sm text-gray-500">Accept credit/debit cards & mobile banking</p>
                               </div>
                               <button 
                                 onClick={() => setPaymentGatewayStates(prev => ({ ...prev, sslcommerz: { ...prev.sslcommerz, configOpen: !prev.sslcommerz.configOpen } }))}
                                 className="text-xs uppercase tracking-widest border border-gray-300 text-gray-800 px-4 py-2 font-bold hover:bg-gray-100"
                               >
                                 {paymentGatewayStates.sslcommerz.configOpen ? 'Cancel' : (paymentGatewayStates.sslcommerz.active ? 'Manage' : 'Configure')}
                               </button>
                             </div>

                             {paymentGatewayStates.sslcommerz.configOpen && (
                               <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Store ID</label>
                                   <input type="text" value={paymentGatewayStates.sslcommerz.storeId} onChange={e => setPaymentGatewayStates(p => ({ ...p, sslcommerz: { ...p.sslcommerz, storeId: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Store Password</label>
                                   <input type="password" value={paymentGatewayStates.sslcommerz.storePassword} onChange={e => setPaymentGatewayStates(p => ({ ...p, sslcommerz: { ...p.sslcommerz, storePassword: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div className="flex gap-4">
                                   <button 
                                     onClick={() => setPaymentGatewayStates(p => ({ ...p, sslcommerz: { ...p.sslcommerz, active: !!p.sslcommerz.storeId, configOpen: false } }))}
                                     className="text-xs bg-blue-600 text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-white"
                                   >
                                     Save Connection
                                   </button>
                                 </div>
                               </div>
                             )}
                           </div>

                           {/* Rocket */}
                           <div className="border border-gray-200 bg-gray-50 rounded p-4">
                             <div className="flex items-center justify-between mb-2">
                               <div>
                                 <p className="font-bold text-[#8C2A8A] mb-1 flex items-center gap-2">
                                   Rocket
                                   {paymentGatewayStates.rocket.active && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>}
                                 </p>
                                 <p className="text-sm text-gray-500">Accept DBBL Rocket mobile banking payments</p>
                               </div>
                               <button 
                                 onClick={() => setPaymentGatewayStates(prev => ({ ...prev, rocket: { ...prev.rocket, configOpen: !prev.rocket.configOpen } }))}
                                 className="text-xs uppercase tracking-widest border border-gray-300 text-gray-800 px-4 py-2 font-bold hover:bg-gray-100"
                               >
                                 {paymentGatewayStates.rocket.configOpen ? 'Cancel' : (paymentGatewayStates.rocket.active ? 'Manage' : 'Configure')}
                               </button>
                             </div>

                             {paymentGatewayStates.rocket.configOpen && (
                               <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">API User / Merchant Number</label>
                                   <input type="text" value={paymentGatewayStates.rocket.apiUser} onChange={e => setPaymentGatewayStates(p => ({ ...p, rocket: { ...p.rocket, apiUser: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">API Password</label>
                                   <input type="password" value={paymentGatewayStates.rocket.apiPass} onChange={e => setPaymentGatewayStates(p => ({ ...p, rocket: { ...p.rocket, apiPass: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div className="flex gap-4">
                                   <button 
                                     onClick={() => setPaymentGatewayStates(p => ({ ...p, rocket: { ...p.rocket, active: !!p.rocket.apiUser, configOpen: false } }))}
                                     className="text-xs bg-blue-600 text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-white"
                                   >
                                     Save Connection
                                   </button>
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                   )}

                   {activeSettingsTab === 'Shipping' && (
                     <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-6">
                       <div>
                         <h3 className="text-lg font-serif italic text-gray-800 mb-6 border-b border-gray-200 pb-4">Domestic Delivery Partners (Bangladesh)</h3>
                         <div className="space-y-4">
                           {/* Pathao */}
                           <div className="border border-gray-200 bg-gray-50 rounded p-4">
                             <div className="flex items-center justify-between mb-2">
                               <div>
                                 <p className="font-bold text-[#E2136E] mb-1 flex items-center gap-2"> {/* Pathao is red-ish normally but user didn't specify. Using white/red */}
                                   <span className="text-[#EF233CA] font-bold">Pathao</span>
                                   {courierStates.pathao.active && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>}
                                 </p>
                                 <p className="text-sm text-gray-500">Pathao Courier Service API</p>
                               </div>
                               <button 
                                 onClick={() => setCourierStates(prev => ({ ...prev, pathao: { ...prev.pathao, configOpen: !prev.pathao.configOpen } }))}
                                 className="text-xs uppercase tracking-widest border border-gray-300 text-gray-800 px-4 py-2 font-bold hover:bg-gray-100"
                               >
                                 {courierStates.pathao.configOpen ? 'Cancel' : (courierStates.pathao.active ? 'Manage' : 'Configure')}
                               </button>
                             </div>
                             
                             {courierStates.pathao.configOpen && (
                               <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Client ID</label>
                                   <input type="text" value={courierStates.pathao.clientId || ''} onChange={e => setCourierStates(p => ({ ...p, pathao: { ...p.pathao, clientId: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Client Secret</label>
                                   <input type="password" value={courierStates.pathao.clientSecret || ''} onChange={e => setCourierStates(p => ({ ...p, pathao: { ...p.pathao, clientSecret: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Merchant Email / Username</label>
                                   <input type="text" value={courierStates.pathao.username || ''} onChange={e => setCourierStates(p => ({ ...p, pathao: { ...p.pathao, username: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Merchant Password</label>
                                   <input type="password" value={courierStates.pathao.password || ''} onChange={e => setCourierStates(p => ({ ...p, pathao: { ...p.pathao, password: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div className="flex gap-4">
                                   <button 
                                     onClick={() => {
                                        const nextState = { ...courierStates, pathao: { ...courierStates.pathao, active: !!courierStates.pathao.clientId, configOpen: false } };
                                        setCourierStates(nextState);
                                        saveCouriersToDB(nextState);
                                     }}
                                     className="text-xs bg-blue-600 text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-white"
                                   >
                                     Save Connection
                                   </button>
                                   <button
                                     onClick={async () => {
                                       setCourierStates(p => ({ ...p, pathao: { ...p.pathao, testStatus: 'testing' } }));
                                       
                                       try {
                                         // Use proxy endpoint to check against Pathao Hermes API
                                         const response = await fetch('/api/courier/pathao/test', {
                                           method: 'POST',
                                           headers: {
                                             'Content-Type': 'application/json',
                                             'Accept': 'application/json'
                                           },
                                           body: JSON.stringify({
                                             client_id: courierStates.pathao.clientId,
                                             client_secret: courierStates.pathao.clientSecret,
                                             username: courierStates.pathao.username,
                                             password: courierStates.pathao.password
                                           })
                                         });
                                         
                                         // Pathao will normally return 200 with token, or 400/401 for invalid client
                                         if (response.ok) {
                                           setCourierStates(p => ({ ...p, pathao: { ...p.pathao, testStatus: 'success' } }));
                                         } else {
                                           // Request failed due to invalid credentials
                                           setCourierStates(p => ({ ...p, pathao: { ...p.pathao, testStatus: 'failed' } }));
                                         }
                                       } catch (error) {
                                         // Network or CORS error (often occurs if credentials completely invalid or API unreachable)
                                         setCourierStates(p => ({ ...p, pathao: { ...p.pathao, testStatus: 'failed' } }));
                                       }
                                       
                                       setTimeout(() => {
                                         setCourierStates(p => ({ ...p, pathao: { ...p.pathao, testStatus: 'idle' } }));
                                       }, 4000);
                                     }}
                                     className="text-xs border border-gray-300 px-4 py-2 text-gray-800 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors ml-2"
                                   >
                                     {courierStates.pathao.testStatus === 'testing' ? 'Connecting...' : courierStates.pathao.testStatus === 'success' ? 'Connected ✓' : courierStates.pathao.testStatus === 'failed' ? 'Failed ✕' : 'Test Connection'}
                                   </button>
                                   {courierStates.pathao.testStatus === 'success' && (
                                     <span className="text-xs font-bold text-emerald-500 ml-4 flex items-center">API connection successful</span>
                                   )}
                                   {courierStates.pathao.testStatus === 'failed' && (
                                     <span className="text-xs font-bold text-red-500 ml-4 flex items-center">Invalid Client ID or Secret</span>
                                   )}
                                 </div>
                               </div>
                             )}
                           </div>

                           {/* Steadfast */}
                           <div className="border border-gray-200 bg-gray-50 rounded p-4">
                             <div className="flex items-center justify-between mb-2">
                               <div>
                                 <p className="font-bold text-[#006A4E] mb-1 flex items-center gap-2">
                                   Steadfast 
                                   {courierStates.steadfast.active && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>}
                                 </p>
                                 <p className="text-sm text-gray-500">Steadfast Courier API</p>
                               </div>
                               <button 
                                 onClick={() => setCourierStates(prev => ({ ...prev, steadfast: { ...prev.steadfast, configOpen: !prev.steadfast.configOpen } }))}
                                 className="text-xs uppercase tracking-widest border border-gray-300 text-gray-800 px-4 py-2 font-bold hover:bg-gray-100"
                               >
                                 {courierStates.steadfast.configOpen ? 'Cancel' : (courierStates.steadfast.active ? 'Manage' : 'Configure')}
                               </button>
                             </div>

                             {courierStates.steadfast.configOpen && (
                               <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Api Key</label>
                                   <input type="text" value={courierStates.steadfast.apiKey} onChange={e => setCourierStates(p => ({ ...p, steadfast: { ...p.steadfast, apiKey: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Secret Key</label>
                                   <input type="password" value={courierStates.steadfast.secretKey} onChange={e => setCourierStates(p => ({ ...p, steadfast: { ...p.steadfast, secretKey: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div className="flex gap-4">
                                   <button 
                                     onClick={() => {
                                        const nextState = { ...courierStates, steadfast: { ...courierStates.steadfast, active: !!courierStates.steadfast.apiKey, configOpen: false } };
                                        setCourierStates(nextState);
                                        saveCouriersToDB(nextState);
                                     }}
                                     className="text-xs bg-blue-600 text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-white"
                                   >
                                     Save Connection
                                   </button>
                                   <button
                                     onClick={async () => {
                                       setCourierStates(p => ({ ...p, steadfast: { ...p.steadfast, testStatus: 'testing' } }));
                                       
                                       try {
                                         const response = await fetch('/api/courier/steadfast/test', {
                                           method: 'POST',
                                           headers: {
                                             'Content-Type': 'application/json',
                                             'Accept': 'application/json'
                                           },
                                           body: JSON.stringify({
                                             api_key: courierStates.steadfast.apiKey,
                                             secret_key: courierStates.steadfast.secretKey
                                           })
                                         });
                                         
                                         if (response.ok) {
                                           setCourierStates(p => ({ ...p, steadfast: { ...p.steadfast, testStatus: 'success' } }));
                                         } else {
                                           setCourierStates(p => ({ ...p, steadfast: { ...p.steadfast, testStatus: 'failed' } }));
                                         }
                                       } catch (error) {
                                         setCourierStates(p => ({ ...p, steadfast: { ...p.steadfast, testStatus: 'failed' } }));
                                       }
                                       
                                       setTimeout(() => {
                                         setCourierStates(p => ({ ...p, steadfast: { ...p.steadfast, testStatus: 'idle' } }));
                                       }, 4000);
                                     }}
                                     className="text-xs border border-gray-300 px-4 py-2 text-gray-800 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors ml-2"
                                   >
                                     {courierStates.steadfast.testStatus === 'testing' ? 'Connecting...' : courierStates.steadfast.testStatus === 'success' ? 'Connected ✓' : courierStates.steadfast.testStatus === 'failed' ? 'Failed ✕' : 'Test Connection'}
                                   </button>
                                   {courierStates.steadfast.testStatus === 'success' && (
                                     <span className="text-xs font-bold text-emerald-500 ml-4 flex items-center">API connection successful</span>
                                   )}
                                   {courierStates.steadfast.testStatus === 'failed' && (
                                     <span className="text-xs font-bold text-red-500 ml-4 flex items-center">Invalid API Key or Secret Key</span>
                                   )}
                                 </div>
                               </div>
                             )}
                           </div>

                           {/* RedX */}
                           <div className="border border-gray-200 bg-gray-50 rounded p-4">
                             <div className="flex items-center justify-between mb-2">
                               <div>
                                 <p className="font-bold text-[#FF0000] mb-1 flex items-center gap-2">
                                   RedX
                                   {courierStates.redx.active && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>}
                                 </p>
                                 <p className="text-sm text-gray-500">RedX Delivery API</p>
                               </div>
                               <button 
                                 onClick={() => setCourierStates(prev => ({ ...prev, redx: { ...prev.redx, configOpen: !prev.redx.configOpen } }))}
                                 className="text-xs uppercase tracking-widest border border-gray-300 text-gray-800 px-4 py-2 font-bold hover:bg-gray-100"
                               >
                                 {courierStates.redx.configOpen ? 'Cancel' : (courierStates.redx.active ? 'Manage' : 'Configure')}
                               </button>
                             </div>

                             {courierStates.redx.configOpen && (
                               <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Access Token</label>
                                   <input type="password" value={courierStates.redx.accessToken} onChange={e => setCourierStates(p => ({ ...p, redx: { ...p.redx, accessToken: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Store ID</label>
                                   <input type="text" value={courierStates.redx.storeId || ''} onChange={e => setCourierStates(p => ({ ...p, redx: { ...p.redx, storeId: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" placeholder="e.g. 1234" />
                                 </div>
                                 <label className="flex items-center gap-2 cursor-pointer">
                                   <input type="checkbox" checked={courierStates.redx.isSandbox} onChange={e => setCourierStates(p => ({ ...p, redx: { ...p.redx, isSandbox: e.target.checked } }))} className="accent-[#FF0000]" />
                                   <span className="text-sm font-bold text-gray-800">Use Sandbox Environment</span>
                                 </label>
                                 <div className="flex gap-4">
                                   <button 
                                     onClick={() => {
                                        const nextState = { ...courierStates, redx: { ...courierStates.redx, active: !!courierStates.redx.accessToken, configOpen: false } };
                                        setCourierStates(nextState);
                                        saveCouriersToDB(nextState);
                                     }}
                                     className="text-xs bg-blue-600 text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-white"
                                   >
                                     Save Connection
                                   </button>
                                   <button
                                     onClick={async () => {
                                       setCourierStates(p => ({ ...p, redx: { ...p.redx, testStatus: 'testing' } }));
                                       
                                       try {
                                         const response = await fetch('/api/courier/redx/test', {
                                           method: 'POST',
                                           headers: {
                                             'Content-Type': 'application/json',
                                             'Accept': 'application/json'
                                           },
                                           body: JSON.stringify({
                                             access_token: courierStates.redx.accessToken,
                                             is_sandbox: courierStates.redx.isSandbox
                                           })
                                         });
                                         
                                         if (response.ok) {
                                           setCourierStates(p => ({ ...p, redx: { ...p.redx, testStatus: 'success' } }));
                                         } else {
                                           setCourierStates(p => ({ ...p, redx: { ...p.redx, testStatus: 'failed' } }));
                                         }
                                       } catch (error) {
                                         setCourierStates(p => ({ ...p, redx: { ...p.redx, testStatus: 'failed' } }));
                                       }
                                       
                                       setTimeout(() => {
                                         setCourierStates(p => ({ ...p, redx: { ...p.redx, testStatus: 'idle' } }));
                                       }, 4000);
                                     }}
                                     className="text-xs border border-gray-300 px-4 py-2 text-gray-800 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors ml-2"
                                   >
                                     {courierStates.redx.testStatus === 'testing' ? 'Connecting...' : courierStates.redx.testStatus === 'success' ? 'Connected ✓' : courierStates.redx.testStatus === 'failed' ? 'Failed ✕' : 'Test Connection'}
                                   </button>
                                   {courierStates.redx.testStatus === 'success' && (
                                     <span className="text-xs font-bold text-emerald-500 ml-4 flex items-center">API connection successful</span>
                                   )}
                                   {courierStates.redx.testStatus === 'failed' && (
                                     <span className="text-xs font-bold text-red-500 ml-4 flex items-center">Invalid Access Token</span>
                                   )}
                                 </div>
                               </div>
                             )}
                           </div>

                           {/* eCourier */}
                           <div className="border border-gray-200 bg-gray-50 rounded p-4">
                             <div className="flex items-center justify-between mb-2">
                               <div>
                                 <p className="font-bold text-[#00AEEF] mb-1 flex items-center gap-2">
                                   eCourier
                                   {courierStates.ecourier.active && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>}
                                 </p>
                                 <p className="text-sm text-gray-500">eCourier API</p>
                               </div>
                               <button 
                                 onClick={() => setCourierStates(prev => ({ ...prev, ecourier: { ...prev.ecourier, configOpen: !prev.ecourier.configOpen } }))}
                                 className="text-xs uppercase tracking-widest border border-gray-300 text-gray-800 px-4 py-2 font-bold hover:bg-gray-100"
                               >
                                 {courierStates.ecourier.configOpen ? 'Cancel' : (courierStates.ecourier.active ? 'Manage' : 'Configure')}
                               </button>
                             </div>

                             {courierStates.ecourier.configOpen && (
                               <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">API / USER-ID</label>
                                   <input type="text" value={courierStates.ecourier.userId} onChange={e => setCourierStates(p => ({ ...p, ecourier: { ...p.ecourier, userId: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">API-KEY</label>
                                   <input type="text" value={courierStates.ecourier.apiKey} onChange={e => setCourierStates(p => ({ ...p, ecourier: { ...p.ecourier, apiKey: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">API-SECRET</label>
                                   <input type="password" value={courierStates.ecourier.apiSecret} onChange={e => setCourierStates(p => ({ ...p, ecourier: { ...p.ecourier, apiSecret: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div className="flex gap-4">
                                   <button 
                                     onClick={() => {
                                        const nextState = { ...courierStates, ecourier: { ...courierStates.ecourier, active: !!courierStates.ecourier.apiKey, configOpen: false } };
                                        setCourierStates(nextState);
                                        saveCouriersToDB(nextState);
                                     }}
                                     className="text-xs bg-blue-600 text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-white"
                                   >
                                     Save Connection
                                   </button>
                                 </div>
                               </div>
                             )}
                           </div>
                           
                           {/* Paperfly */}
                           <div className="border border-gray-200 bg-gray-50 rounded p-4">
                             <div className="flex items-center justify-between mb-2">
                               <div>
                                 <p className="font-bold text-[#14AFB4] mb-1 flex items-center gap-2">
                                   Paperfly
                                   {courierStates.paperfly.active && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Active</span>}
                                 </p>
                                 <p className="text-sm text-gray-500">Paperfly API</p>
                               </div>
                               <button 
                                 onClick={() => setCourierStates(prev => ({ ...prev, paperfly: { ...prev.paperfly, configOpen: !prev.paperfly.configOpen } }))}
                                 className="text-xs uppercase tracking-widest border border-gray-300 text-gray-800 px-4 py-2 font-bold hover:bg-gray-100"
                               >
                                 {courierStates.paperfly.configOpen ? 'Cancel' : (courierStates.paperfly.active ? 'Manage' : 'Configure')}
                               </button>
                             </div>

                             {courierStates.paperfly.configOpen && (
                               <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Username</label>
                                   <input type="text" value={courierStates.paperfly.username} onChange={e => setCourierStates(p => ({ ...p, paperfly: { ...p.paperfly, username: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div>
                                   <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Password</label>
                                   <input type="password" value={courierStates.paperfly.password} onChange={e => setCourierStates(p => ({ ...p, paperfly: { ...p.paperfly, password: e.target.value } }))} className="w-full bg-white text-gray-800 border border-gray-300 rounded p-2 text-gray-800 focus:border-blue-600 outline-none" />
                                 </div>
                                 <div className="flex gap-4">
                                   <button 
                                     onClick={() => {
                                        const nextState = { ...courierStates, paperfly: { ...courierStates.paperfly, active: !!courierStates.paperfly.username, configOpen: false } };
                                        setCourierStates(nextState);
                                        saveCouriersToDB(nextState);
                                     }}
                                     className="text-xs bg-blue-600 text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-white"
                                   >
                                     Save Connection
                                   </button>
                                 </div>
                               </div>
                             )}
                           </div>
                           
                         </div>
                       </div>
                     </div>
                   )}

                   {activeSettingsTab === 'Tax' && (
                     <div className="bg-white border border-gray-200 rounded-xl p-6">
                       <h3 className="text-lg font-serif italic text-gray-800 mb-2">Taxes</h3>
                       <p className="text-sm text-gray-500 mb-6 border-b border-gray-200 pb-4">Manage how your store charges taxes for sales.</p>
                       <div className="space-y-4">
                         <label className="flex items-center gap-3 cursor-pointer">
                           <input type="checkbox" className="w-5 h-5 accent-[#D4AF37] border-gray-300 bg-white text-gray-800" defaultChecked />
                           <span className="text-sm text-gray-800">Include tax in product prices</span>
                         </label>
                         <label className="flex items-center gap-3 cursor-pointer">
                           <input type="checkbox" className="w-5 h-5 accent-[#D4AF37] border-gray-300 bg-white text-gray-800" defaultChecked />
                           <span className="text-sm text-gray-800">Charge tax on shipping rates</span>
                         </label>
                       </div>
                     </div>
                   )}

                   {activeSettingsTab === 'Notifications' && (
                     <div className="bg-white border border-gray-200 rounded-xl p-6">
                       <h3 className="text-lg font-serif italic text-gray-800 mb-6 border-b border-gray-200 pb-4">Email Notifications</h3>
                       <div className="space-y-6">
                         <div>
                           <p className="font-bold text-gray-800 mb-1 tracking-wider text-sm">Order Confirmation</p>
                           <p className="text-sm text-gray-500 mb-2">Sent to customers automatically after they place their order.</p>
                           <button className="text-xs border border-gray-300 text-gray-800 px-3 py-1 hover:bg-gray-100">Customize Template</button>
                         </div>
                         <div className="border-t border-gray-200 pt-4">
                           <p className="font-bold text-gray-800 mb-1 tracking-wider text-sm">Shipping Confirmation</p>
                           <p className="text-sm text-gray-500 mb-2">Sent to customers when their order is fulfilled and shipped.</p>
                           <button className="text-xs border border-gray-300 text-gray-800 px-3 py-1 hover:bg-gray-100">Customize Template</button>
                         </div>
                       </div>
                     </div>
                   )}

                   {activeSettingsTab === 'SMS Gateway' && (
                     <div className="bg-white border border-gray-200 rounded-xl p-6">
                       <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                         <h3 className="text-lg font-serif italic text-gray-800">Bangladesh SMS API Configuration</h3>
                         <label className="flex items-center cursor-pointer">
                           <div className="relative">
                             <input 
                               type="checkbox" 
                               className="sr-only" 
                               checked={smsConfig.active}
                               onChange={(e) => setSmsConfig(prev => ({ ...prev, active: e.target.checked }))}
                             />
                             <div className={`block w-10 h-6 rounded-full transition-colors ${smsConfig.active ? 'bg-blue-600' : 'bg-white/20'}`}></div>
                             <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${smsConfig.active ? 'transform translate-x-4' : ''}`}></div>
                           </div>
                         </label>
                       </div>
                       
                       <p className="text-sm text-gray-500 mb-6">Configure your bulk SMS provider (e.g. BulkSMSBD, OnnoRokom) to automatically send custom order status alerts to customers' mobile phones.</p>

                       <div className="space-y-4">
                         <div>
                           <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Provider API Key</label>
                           <input 
                             type="password" 
                             value={smsConfig.apiKey}
                             onChange={(e) => setSmsConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                             placeholder="Enter API Key from your provider" 
                             className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors rounded-lg font-mono text-sm"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Sender ID</label>
                           <input 
                             type="text" 
                             value={smsConfig.senderId}
                             onChange={(e) => setSmsConfig(prev => ({ ...prev, senderId: e.target.value }))}
                             placeholder="e.g. AURALUXE" 
                             className="w-full bg-white border border-gray-200 px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors rounded-lg text-sm"
                           />
                         </div>
                       </div>
                       <div className="mt-6 border-t border-gray-200 pt-6">
                         <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4">Supported Triggers</h4>
                         <ul className="space-y-2 text-sm text-gray-500">
                           <li className="flex items-start gap-2">
                             <div className="text-blue-600 mt-0.5">•</div>
                             Order marked as <strong>Shipped</strong> (Includes tracking number & courier)
                           </li>
                           <li className="flex items-start gap-2">
                             <div className="text-blue-600 mt-0.5">•</div>
                             Order marked as <strong>Delivered</strong>
                           </li>
                         </ul>
                       </div>
                     </div>
                   )}

                   {activeSettingsTab === 'Staff' && (
                     <div className="bg-white border border-gray-200 rounded-xl p-6">
                       <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                         <h3 className="text-lg font-serif italic text-gray-800 flex items-center gap-2">Role-Based Access</h3>
                         <button onClick={() => setIsAddingStaff(!isAddingStaff)} className="bg-blue-600 text-black text-xs px-3 py-1 font-bold uppercase tracking-widest hover:bg-white transition-colors">
                           {isAddingStaff ? 'Cancel' : 'Add Staff'}
                         </button>
                       </div>
                       
                       {isAddingStaff && (
                         <div className="mb-6 p-5 border border-blue-600/30 rounded-xl bg-blue-600/5 space-y-4">
                           <h4 className="text-sm font-bold text-blue-600 uppercase tracking-widest">New Staff Member</h4>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <input 
                               type="text"
                               placeholder="Full Name"
                               value={newStaff.name}
                               onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                               className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors rounded"
                             />
                             <input 
                               type="email"
                               placeholder="Email Address"
                               value={newStaff.email}
                               onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                               className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors rounded"
                             />
                             <select 
                               value={newStaff.role}
                               onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                               className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-600 transition-colors rounded appearance-none"
                             >
                               <option value="Admin">Admin (Full Access)</option>
                               <option value="Support">Support (Orders, Customers)</option>
                               <option value="Warehouse">Warehouse (Products, Fulfillment)</option>
                             </select>
                           </div>
                           <button 
                             onClick={() => {
                               if(newStaff.name && newStaff.email) {
                                 setStaffMembers([...staffMembers, { ...newStaff, id: Date.now().toString() }]);
                                 setNewStaff({ name: '', email: '', role: 'Support' });
                                 setIsAddingStaff(false);
                               }
                             }}
                             className="bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors rounded"
                           >
                             Save Member
                           </button>
                         </div>
                       )}

                       <div className="space-y-4">
                         {staffMembers.map((staff) => (
                           <div key={staff.id} className="flex items-center justify-between border border-gray-200 p-4 bg-gray-50 rounded-lg hover:border-gray-300 transition-colors">
                             <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-black font-bold uppercase ${staff.role === 'Admin' ? 'bg-blue-600' : staff.role === 'Warehouse' ? 'bg-blue-400' : 'bg-emerald-400'}`}>
                                 {staff.name.substring(0, 2)}
                               </div>
                               <div>
                                 <p className="font-bold text-gray-800 tracking-wide">{staff.name}</p>
                                 <p className="text-xs text-gray-500 mt-0.5">{staff.email} · <span className={`font-bold ${staff.role === 'Admin' ? 'text-blue-600' : staff.role === 'Warehouse' ? 'text-blue-400' : 'text-emerald-400'}`}>{staff.role}</span></p>
                               </div>
                             </div>
                             <div className="flex items-center gap-3">
                               <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 hidden sm:inline-block">Active</span>
                               <button 
                                 onClick={() => setStaffMembers(staffMembers.filter(s => s.id !== staff.id))}
                                 className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded hover:bg-red-500/10"
                               >
                                 <XCircle size={18} />
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             </div>
           )}

           {activeTab === 'adminProfile' && (
             <div className="max-w-4xl tracking-widest text-blue-600 mb-6">
                <div className="mb-8">
                  <h2 className="font-serif text-3xl font-bold italic text-gray-800 mb-2">Admin Profile</h2>
                  <p className="text-gray-500 text-sm font-sans normal-case tracking-normal">Manage your administrator account details and preferences.</p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8 flex items-center gap-6">
                  <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-600/30 text-blue-600">
                    <UserIcon size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif text-gray-800 italic">{user?.displayName || 'Administrator'}</h3>
                    <p className="text-gray-500 font-sans normal-case tracking-normal mb-2">{user?.email}</p>
                    <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-800 uppercase tracking-widest mt-2 border border-gray-200">
                      System Admin
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-serif italic text-gray-800 mb-6 uppercase">Personal Information</h3>
                    <div className="space-y-4 font-sans normal-case tracking-normal text-sm">
                      <div>
                        <label className="block text-gray-500 mb-1">Full Name</label>
                        <div className="text-gray-800 bg-white text-gray-800/50 p-3 rounded border border-white/5">{user?.displayName || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Email Address</label>
                        <div className="text-gray-800 bg-white text-gray-800/50 p-3 rounded border border-white/5">{user?.email}</div>
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Account ID</label>
                        <div className="text-gray-800 bg-white text-gray-800/50 p-3 rounded border border-white/5 line-clamp-1">{user?.uid}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-serif italic text-gray-800 mb-6 uppercase">Security Settings</h3>
                    <div className="space-y-4 font-sans normal-case tracking-normal text-sm">
                      <div className="flex justify-between items-center bg-white text-gray-800/50 p-4 rounded border border-white/5">
                        <div>
                          <p className="text-gray-800 font-medium">Password</p>
                          <p className="text-gray-500 text-xs mt-1">Last changed 30 days ago</p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-600 transition-colors">Update</button>
                      </div>
                      <div className="flex justify-between items-center bg-white text-gray-800/50 p-4 rounded border border-white/5">
                        <div>
                          <p className="text-gray-800 font-medium">Two-Factor Authentication</p>
                          <p className="text-green-500 text-xs mt-1">Enabled</p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-600 transition-colors">Manage</button>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
           )}

           {!['overview', 'orders', 'accounts', 'products', 'customers', 'fraud', 'analytics', 'settings', 'adminProfile'].includes(activeTab) && (
             <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-xl">
                  <ActiveIcon size={32} />
                </div>
                <h2 className="font-serif text-3xl italic text-gray-800 mb-2">{activeItem.label} Module</h2>
                <p className="text-gray-500 text-sm">This module is part of the full enterprise suite. Connect to your backend infrastructure to activate this view.</p>
                <button className="mt-8 px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors rounded-lg">
                  Configure Integration
                </button>
             </div>
           )}
        </main>
      </div>

      <AddProductModal 
        isOpen={isAddProductOpen}
        onClose={() => { setIsAddProductOpen(false); setProductToEdit(null); }}
        productToEdit={productToEdit}
        onSave={async (newProduct) => {
          try {
            const { setDoc, doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');
            const { handleFirestoreError, OperationType } = await import('../lib/firestore-utils');
            
            if (newProduct.id) {
              const productData = {
                name: newProduct.name,
                price: newProduct.price,
                category: newProduct.category,
                brand: newProduct.brand || null,
                description: newProduct.description,
                imageUrl: newProduct.imageUrl,
                sku: newProduct.sku,
                stock: newProduct.stock,
                weight: newProduct.weight,
                variants: newProduct.variants,
                marketing: newProduct.marketing || null
              };
              try {
                await updateDoc(doc(db, 'products', newProduct.id), productData);
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, 'products');
              }
            } else {
              const productData = {
                ...newProduct,
                rating: 5.0,
                reviews: 0,
                isNewArrival: true,
                supportsAITryOn: false,
                has3DView: false
              };
              delete productData.id;

              const newId = Math.random().toString(36).substring(2, 9);
              try {
                await setDoc(doc(db, 'products', newId), productData);
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, 'products');
              }
            }
          } catch (e) {
            console.error('Failed to save product to firestore', e);
          }
          setIsAddProductOpen(false);
          setProductToEdit(null);
        }}
      />

      {selectedCourierOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white text-gray-800/80 backdrop-blur-sm" onClick={() => setSelectedCourierOrderId(null)}></div>
          <div className="relative bg-white border border-gray-200 p-8 rounded-xl max-w-md w-full shadow-2xl z-10">
            <h2 className="text-xl font-serif italic text-gray-800 mb-6 border-b border-gray-200 pb-4">Assign Delivery Partner</h2>
            
            <div className="space-y-4 mb-6">
              {['Pathao', 'Steadfast', 'RedX', 'eCourier', 'Paperfly'].map((courier) => {
                const stateKey = courier.toLowerCase() as keyof typeof courierStates;
                const isActive = courierStates[stateKey].active;
                
                return (
                  <label key={courier} className={`flex items-center justify-between p-4 border rounded cursor-pointer transition-colors ${!isActive ? 'opacity-50 border-white/5 bg-gray-50 cursor-not-allowed' : selectedCourier === courier ? 'border-blue-600 bg-blue-600/10' : 'border-gray-200 bg-gray-50 hover:border-white/30'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="courier" 
                        value={courier} 
                        checked={selectedCourier === courier}
                        onChange={() => {
                          if (isActive) setSelectedCourier(courier);
                        }}
                        disabled={!isActive}
                        className="accent-[#D4AF37]"
                      />
                      <span className="font-bold text-gray-800">{courier}</span>
                    </div>
                    {!isActive && <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Unconfigured</span>}
                    {isActive && <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Active</span>}
                  </label>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setSelectedCourierOrderId(null)}
                className="flex-1 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-800 border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (selectedCourier) {
                    const targetOrder = orders.find(o => o.id === selectedCourierOrderId);
                    if (!targetOrder) return;
                    
                    const stateKey = selectedCourier.toLowerCase() as keyof typeof courierStates;
                    const credentials = courierStates[stateKey];

                    try {
                      // Show loading state here if needed
                      const response = await fetch('/api/courier/assign', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          order: targetOrder,
                          courier: selectedCourier,
                          credentials
                        })
                      });
                      
                      const data = await response.json();
                      if (!response.ok || !data.success) {
                        alert(data.message || 'Failed to place order with courier');
                        return;
                      }

                      const trackingId = data.trackingId;

                      if (targetOrder.userId) {
                         const { updateDoc, doc } = await import('firebase/firestore');
                         const { db } = await import('../lib/firebase');
                         try {
                           await updateDoc(doc(db, 'users', targetOrder.userId, 'orders', targetOrder.id), {
                             status: 'Shipped',
                             courier: selectedCourier,
                             trackingId
                           });
                         } catch(e) {}
                      }

                      setOrders(prev => prev.map(o => {
                        if (o.id === selectedCourierOrderId) {
                          return { 
                            ...o, 
                            status: 'Shipped', 
                            courier: selectedCourier,
                            trackingId 
                          };
                        }
                        return o;
                      }));

                      if (smsConfig.active) {
                        const order = orders.find(o => o.id === selectedCourierOrderId);
                        if (order) {
                           await sendSMS(
                             '+8801700000000', // Mock customer phone
                             `AURALUXE: Your order ${order.id} has been shipped via ${selectedCourier}. tracking: ${trackingId}`,
                             smsConfig
                           );
                        }
                      }

                      setSelectedCourierOrderId(null);
                      setSelectedCourier('');
                    } catch (error) {
                      console.error('Failed to assign courier:', error);
                      alert('Could not connect to courier API');
                    }
                  }
                }}
                disabled={!selectedCourier}
                className="flex-1 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-blue-600 text-black disabled:opacity-50 disabled:bg-gray-500 transition-colors"
              >
                Confirm & Ship
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white text-gray-800/80 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}></div>
          <div className="relative bg-white border border-gray-200 p-8 rounded-xl max-w-lg w-full shadow-2xl z-10">
            <h2 className="text-2xl font-serif italic text-gray-800 mb-6 border-b border-gray-200 pb-4 flex items-center gap-3">
              <Users className="text-blue-600" size={24} />
              Customer Profile
            </h2>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
               <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Name</p>
                  <p className="font-bold text-gray-800 text-lg">{selectedCustomer.name}</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Email</p>
                  <p className="font-bold text-gray-800">{selectedCustomer.email}</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="font-mono text-gray-800">{selectedCustomer.phone}</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Risk Profile</p>
                  <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full border inline-block ${selectedCustomer.risk === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    {selectedCustomer.risk} Risk
                  </span>
               </div>
               <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Shipping Address</p>
                  <p className="font-bold text-gray-800">{selectedCustomer.address}</p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 border border-gray-200 p-4 rounded-xl">
               <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Spent</p>
                  <p className="font-mono text-blue-600 font-bold">{FORMAT_CURRENCY(selectedCustomer.spent)}</p>
               </div>
               <div className="text-center border-l border-r border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total Orders</p>
                  <p className="font-bold text-gray-800">{selectedCustomer.totalOrders}</p>
               </div>
               <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Last Order</p>
                  <p className="font-bold text-gray-800">{selectedCustomer.lastOrder}</p>
               </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-800 border border-gray-300 hover:bg-gray-100 transition-colors rounded"
              >
                Close Profile
              </button>
              {selectedCustomer.courier && selectedCustomer.trackingId && (
                <button
                  onClick={() => {
                    let trackUrl = `https://pathao.com/courier/tracking/?consignment_id=${selectedCustomer.trackingId}`;
                    if (selectedCustomer.courier.toLowerCase() === 'steadfast') trackUrl = `https://steadfast.com.bd/tracking/${selectedCustomer.trackingId}`;
                    if (selectedCustomer.courier.toLowerCase() === 'redx') trackUrl = `https://redx.com.bd/track/${selectedCustomer.trackingId}`;
                    window.open(trackUrl, '_blank');
                  }}
                  className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded shadow-sm"
                >
                  Track {selectedCustomer.courier} Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <InvoiceModal 
        isOpen={!!invoiceOrder} 
        onClose={() => setInvoiceOrder(null)} 
        order={invoiceOrder} 
      />

      <OrderDetailsModal
        isOpen={!!selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
        order={selectedOrderDetails}
      />

    </div>
  );
}
