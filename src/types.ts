export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  brand?: string;
  isNewArrival?: boolean;
  isAiRecommended?: boolean;
  supportsAITryOn?: boolean;
  rating: number;
  reviews: number;
  sku?: string;
  stock?: number;
  weight?: number;
  variants?: { name: string; values: string[] }[];
  marketing?: {
    title?: string;
    text?: string;
    features?: {title: string, description: string, icon: string}[];
  };
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  phoneNumber?: string;
  creditBalance?: number;
  preferences?: {
    emailNotifications: boolean;
  };
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  type: 'product' | 'package';
  targetProductIds?: string[]; // IDs of products if type is product or package
  mediaUrl: string;
  mediaType: 'image' | 'video';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  idDoc?: string;
  date: string;
  total: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: CartItem[];
  courier?: string;
  trackingId?: string;
}
