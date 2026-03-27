import { Product, Category, Order, User, CartItem, SellerProfile } from "@/types";

export interface DbUser extends User {
  passwordHash: string;
}

export interface DeliveryOrder {
  id: string;
  userId: string;
  routeFrom: string;
  routeTo: string;
  route: string;
  dimensions: { length: number; width: number; height: number };
  weight: number;
  quantity: number;
  totalWeight: number;
  totalVolume: number;
  price: number;
  finalPrice: number;
  bonusDebited: number;
  fullName: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  userId: string;
  trackNumber: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  history: Array<{
    id: string;
    status: string;
    timestamp: string;
    description: string;
  }>;
}

export interface DbStore {
  users: Map<string, DbUser>;
  products: Map<string, Product>;
  categories: Category[];
  orders: Map<string, Order>;
  carts: Map<string, CartItem[]>;
  favorites: Map<string, string[]>;
  sellers: Map<string, SellerProfile>;
  reviews: Map<string, Review[]>;
  packages?: Map<string, Package>; // Delivery packages
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
  helpful: number;
}

const store: DbStore = {
  users: new Map(),
  products: new Map(),
  categories: [],
  orders: new Map(),
  carts: new Map(),
  favorites: new Map(),
  sellers: new Map(),
  reviews: new Map(),
  packages: new Map(), // Delivery packages
};

export function getStore(): DbStore {
  return store;
}

export function initializeStore(
  products: Product[],
  categories: Category[],
  orders: Order[],
  users: DbUser[],
  sellers?: SellerProfile[]
) {
  products.forEach((p) => {
    const productWithModeration: Product = {
      ...p,
      sellerId: p.seller.id,
      moderationStatus: p.moderationStatus || 'approved',
    };
    store.products.set(p.id, productWithModeration);
  });
  store.categories = categories;
  orders.forEach((o) => {
    const orderWithUser: Order = {
      ...o,
      userId: o.userId || 'user1',
      sellerId: o.sellerId || o.items[0]?.product.seller.id || 's1',
    };
    store.orders.set(o.id, orderWithUser);
  });
  users.forEach((u) => {
    const userWithRole: DbUser = {
      ...u,
      role: u.role || 'customer',
      createdAt: u.createdAt || new Date().toISOString(),
    };
    store.users.set(u.id, userWithRole);
  });
  if (sellers) {
    sellers.forEach((s) => store.sellers.set(s.id, s));
  }
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
