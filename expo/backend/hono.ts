import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { initializeStore, DbUser } from "./db/store";
import { products, categories, sellers as mockSellers } from "@/mocks/products";
import { orders, mockUser, addresses } from "@/mocks/orders";
import { SellerProfile } from "@/types";

const sellerProfiles: SellerProfile[] = mockSellers.map((s) => ({
  ...s,
  userId: `user_seller_${s.id}`,
  email: `${s.name.toLowerCase().replace(/\s+/g, "")}@globalgo.com`,
  description: s.description || `Welcome to ${s.name}`,
  productCount: s.productCount || 0,
  followers: s.followers || 0,
  responseTime: s.responseTime || "< 24 hours",
  joinedDate: s.joinedDate || "2023-01-01",
  businessInfo: {
    address: `${s.country} Business District`,
    phone: "+1-555-000-0000",
    shippingCountries: ["USA", "EU", "UK", "Canada", "Australia"],
  },
  moderationStatus: "approved",
  totalSales: Math.floor(Math.random() * 1000),
  totalRevenue: Math.floor(Math.random() * 100000),
}));

const defaultUser: DbUser = {
  ...mockUser,
  passwordHash: "demo123hash",
  addresses: addresses,
  role: "customer",
  createdAt: "2024-01-01T00:00:00Z",
};

const adminUser: DbUser = {
  id: "admin1",
  email: "admin@globalgo.com",
  firstName: "Admin",
  lastName: "User",
  passwordHash: "admin123hash",
  addresses: [],
  favoriteProducts: [],
  notificationsEnabled: true,
  currency: "USD",
  language: "en",
  role: "admin",
  createdAt: "2023-01-01T00:00:00Z",
};

const moderatorUser: DbUser = {
  id: "mod1",
  email: "moderator@globalgo.com",
  firstName: "Moderator",
  lastName: "User",
  passwordHash: "mod123hash",
  addresses: [],
  favoriteProducts: [],
  notificationsEnabled: true,
  currency: "USD",
  language: "en",
  role: "moderator",
  createdAt: "2023-06-01T00:00:00Z",
};

initializeStore(
  products,
  categories,
  orders,
  [defaultUser, adminUser, moderatorUser],
  sellerProfiles
);

const app = new Hono();

app.use("*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "GlobalGo API is running",
    version: "2.0.0",
    endpoints: {
      auth: "/api/trpc/auth.*",
      products: "/api/trpc/products.*",
      categories: "/api/trpc/categories.*",
      orders: "/api/trpc/orders.*",
      cart: "/api/trpc/cart.*",
      favorites: "/api/trpc/favorites.*",
      addresses: "/api/trpc/addresses.*",
      sellers: "/api/trpc/sellers.*",
      moderation: "/api/trpc/moderation.*",
    },
  });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

export default app;
