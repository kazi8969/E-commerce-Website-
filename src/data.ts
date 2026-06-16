import { Product, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Fashion', imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'Beauty', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=400' },
  { id: '4', name: 'Home & Living', imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=400' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Premium Silk Jamdani Saree',
    description: 'Authentic handcrafted Jamdani saree with intricate gold motifs.',
    price: 12500,
    originalPrice: 15000,
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d61dc0?auto=format&fit=crop&q=80&w=800',
    category: 'Fashion',
    isNewArrival: true,
    supportsAITryOn: true,
    rating: 4.9,
    reviews: 128
  },
  {
    id: 'p2',
    name: 'Minimalist Chronograph Watch',
    description: 'Matte black stainless steel with sapphire crystal glass.',
    price: 4500,
    imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800',
    category: 'Fashion',
    isAiRecommended: true,
    supportsAITryOn: true,
    rating: 4.7,
    reviews: 84
  },
  {
    id: 'p3',
    name: 'Oversized Cotton T-Shirt',
    description: 'Heavyweight 100% premium cotton, drop shoulder fit.',
    price: 850,
    originalPrice: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
    category: 'Fashion',
    isNewArrival: true,
    supportsAITryOn: true,
    rating: 4.5,
    reviews: 342
  },
  {
    id: 'p4',
    name: 'Pro Wireless Earbuds ANC',
    description: 'Active noise cancellation with 30-hour battery life.',
    price: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800',
    category: 'Electronics',
    isAiRecommended: true,
    rating: 4.8,
    reviews: 512
  },
  {
    id: 'p5',
    name: 'Hydrating Face Serum',
    description: 'Hyaluronic acid with vitamin C for a natural glow.',
    price: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
    category: 'Beauty',
    rating: 4.6,
    reviews: 210
  },
  {
    id: 'p6',
    name: 'Smart Home Speaker',
    description: 'Voice controlled AI smart speaker with deep bass.',
    price: 4800,
    originalPrice: 5500,
    imageUrl: 'https://images.unsplash.com/photo-1543512214-318c7553b230?auto=format&fit=crop&q=80&w=800',
    category: 'Electronics',
    isAiRecommended: true,
    rating: 4.7,
    reviews: 89
  }
];

export let STORE_CURRENCY = 'USD';
export let BASE_CURRENCY = 'USD';

export const setStoreCurrency = (currency: string) => {
  STORE_CURRENCY = currency;
  window.dispatchEvent(new Event('currencyChange'));
};

export const setBaseCurrency = (currency: string) => {
  BASE_CURRENCY = currency;
  window.dispatchEvent(new Event('currencyChange'));
};

const getExchangeRate = (currency: string) => {
  const rates: Record<string, number> = {
    USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, AUD: 1.52, CAD: 1.36, 
    SGD: 1.35, CHF: 0.91, MYR: 4.75, JPY: 154.5, CNY: 7.24, BDT: 110.0,
    BRL: 5.15, ZAR: 18.5, MXN: 16.5, PHP: 57.0, THB: 36.8, IDR: 16000,
    VND: 25400, KRW: 1370, AED: 3.67, SAR: 3.75, TRY: 32.5, RUB: 92.4
  };
  if (rates[currency]) return rates[currency];
  
  let hash = 0;
  for (let i = 0; i < currency.length; i++) {
     hash = currency.charCodeAt(i) + ((hash << 5) - hash);
  }
  const random = Math.abs(Math.sin(hash));
  return 0.5 + (random * 50); 
};

export const FORMAT_CURRENCY = (amount: number) => {
  const visitorCurrency = STORE_CURRENCY || 'USD';
  const baseCurrency = BASE_CURRENCY || 'USD';
  
  const visitorRate = getExchangeRate(visitorCurrency);
  const baseRate = getExchangeRate(baseCurrency);
  
  // Convert from base currency to USD, then to visitor currency
  const convertedAmount = (amount / baseRate) * visitorRate;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: visitorCurrency,
  }).format(convertedAmount);
};
