export type UserRole = 'customer' | 'seller' | 'moderator' | 'admin';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  category: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  seller: Seller;
  sellerId: string;
  specifications: Record<string, string>;
  deliveryInfo: DeliveryInfo;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  moderationStatus: ModerationStatus;
  moderationNote?: string;
  moderatedAt?: string;
  moderatedBy?: string;
}

export interface Seller {
  id: string;
  name: string;
  rating: number;
  country: string;
  verified: boolean;
}

export interface SellerProfile extends Seller {
  userId: string;
  email: string;
  description: string;
  logo?: string;
  banner?: string;
  productCount: number;
  followers: number;
  responseTime: string;
  joinedDate: string;
  businessInfo: SellerBusinessInfo;
  moderationStatus: ModerationStatus;
  moderationNote?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  totalSales: number;
  totalRevenue: number;
}

export interface SellerBusinessInfo {
  companyName?: string;
  registrationNumber?: string;
  taxId?: string;
  address: string;
  phone: string;
  website?: string;
  shippingCountries: string[];
}

export interface DeliveryInfo {
  estimatedDays: { min: number; max: number };
  shippingCost: number;
  freeShippingThreshold?: number;
  countries: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: Subcategory[];
  productCount: number;
  image: string;
}

export interface Subcategory {
  id: string;
  name: string;
  productCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  building: string;
  apartment?: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  shippingCost: number;
  currency: string;
  shippingAddress: Address;
  trackingNumber?: string;
  trackingHistory: TrackingEvent[];
  createdAt: string;
  updatedAt?: string;
  estimatedDelivery: string;
  paymentMethod: string;
  internationalShipment?: InternationalShipment;
  sellerId: string;
  sellerNote?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  priceAtPurchase: number;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface TrackingEvent {
  id: string;
  status: OrderStatus;
  location: string;
  description: string;
  timestamp: string;
  country?: string;
  city?: string;
  carrier?: string;
  customsStatus?: CustomsStatus;
}

export type CustomsStatus = 'pending' | 'processing' | 'cleared' | 'held' | 'released';

export interface InternationalShipment {
  originCountry: string;
  destinationCountry: string;
  carrier: string;
  trackingNumber: string;
  customsDeclarationNumber?: string;
  customsStatus: CustomsStatus;
  customsEvents: CustomsEvent[];
  estimatedCustomsClearance?: string;
  duties?: number;
  taxes?: number;
}

export interface CustomsEvent {
  id: string;
  status: CustomsStatus;
  location: string;
  description: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  favoriteProducts: string[];
  notificationsEnabled: boolean;
  currency: string;
  language: string;
  role: UserRole;
  sellerId?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface FilterOptions {
  categories: string[];
  priceRange: { min: number; max: number };
  rating: number;
  inStockOnly: boolean;
  freeShippingOnly: boolean;
  sortBy: 'popular' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

export interface ShippingOption {
  id: string;
  name: string;
  estimatedDays: { min: number; max: number };
  price: number;
  carrier: string;
}

export * from './notifications';
