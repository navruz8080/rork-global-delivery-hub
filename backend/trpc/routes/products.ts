import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, sellerProcedure } from "../create-context";
import { getStore, generateId } from "@/backend/db/store";
import { Product } from "@/types";

const deliveryInfoSchema = z.object({
  estimatedDays: z.object({
    min: z.number().min(1),
    max: z.number().min(1),
  }),
  shippingCost: z.number().min(0),
  freeShippingThreshold: z.number().optional(),
  countries: z.array(z.string()).min(1),
});

const productInputSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().min(0.01),
  originalPrice: z.number().optional(),
  currency: z.string().default("USD"),
  images: z.array(z.string().url()).min(1),
  category: z.string(),
  subcategory: z.string().optional(),
  stockCount: z.number().min(0),
  specifications: z.record(z.string(), z.string()).optional(),
  deliveryInfo: deliveryInfoSchema,
  tags: z.array(z.string()).optional(),
});

export const productsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        subcategory: z.string().optional(),
        search: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minRating: z.number().optional(),
        inStockOnly: z.boolean().optional(),
        freeShippingOnly: z.boolean().optional(),
        sortBy: z.enum(["popular", "price_asc", "price_desc", "rating", "newest"]).optional(),
        tags: z.array(z.string()).optional(),
        sellerId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const store = getStore();
      let products = Array.from(store.products.values()).filter(
        (p) => p.moderationStatus === "approved"
      );

      if (input?.category) {
        products = products.filter((p) => p.category === input.category);
      }

      if (input?.subcategory) {
        products = products.filter((p) => p.subcategory === input.subcategory);
      }

      if (input?.sellerId) {
        products = products.filter((p) => p.sellerId === input.sellerId);
      }

      if (input?.search) {
        const searchLower = input.search.toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.tags.some((t) => t.toLowerCase().includes(searchLower))
        );
      }

      if (input?.minPrice !== undefined) {
        products = products.filter((p) => p.price >= input.minPrice!);
      }

      if (input?.maxPrice !== undefined) {
        products = products.filter((p) => p.price <= input.maxPrice!);
      }

      if (input?.minRating !== undefined) {
        products = products.filter((p) => p.rating >= input.minRating!);
      }

      if (input?.inStockOnly) {
        products = products.filter((p) => p.inStock);
      }

      if (input?.freeShippingOnly) {
        products = products.filter((p) => p.deliveryInfo.shippingCost === 0);
      }

      if (input?.tags?.length) {
        products = products.filter((p) =>
          input.tags!.some((tag) => p.tags.includes(tag))
        );
      }

      const total = products.length;

      switch (input?.sortBy) {
        case "price_asc":
          products.sort((a, b) => a.price - b.price);
          break;
        case "price_desc":
          products.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          products.sort((a, b) => b.rating - a.rating);
          break;
        case "newest":
          products.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        default:
          products.sort((a, b) => b.reviewCount - a.reviewCount);
      }

      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      products = products.slice(offset, offset + limit);

      return {
        products,
        total,
        hasMore: offset + products.length < total,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const store = getStore();
      const product = store.products.get(input.id);

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return product;
    }),

  featured: publicProcedure.query(async () => {
    const store = getStore();
    const products = Array.from(store.products.values()).filter(
      (p) => p.moderationStatus === "approved"
    );
    return products
      .filter((p) => p.tags.includes("featured") || p.tags.includes("bestseller"))
      .slice(0, 10);
  }),

  deals: publicProcedure.query(async () => {
    const store = getStore();
    const products = Array.from(store.products.values()).filter(
      (p) => p.moderationStatus === "approved"
    );
    return products
      .filter((p) => p.originalPrice && p.originalPrice > p.price)
      .slice(0, 10);
  }),

  newArrivals: publicProcedure.query(async () => {
    const store = getStore();
    const products = Array.from(store.products.values()).filter(
      (p) => p.moderationStatus === "approved"
    );
    return [...products]
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 8);
  }),

  getByIds: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query(async ({ input }) => {
      const store = getStore();
      return input.ids
        .map((id) => store.products.get(id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined);
    }),

  getBySeller: publicProcedure
    .input(z.object({ sellerId: z.string() }))
    .query(async ({ input }) => {
      const store = getStore();
      const products = Array.from(store.products.values());
      return products.filter(
        (p) => p.sellerId === input.sellerId && p.moderationStatus === "approved"
      );
    }),

  create: sellerProcedure
    .input(productInputSchema)
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);

      if (!user?.sellerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must have a seller profile to create products",
        });
      }

      const seller = store.sellers.get(user.sellerId);
      if (!seller) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller profile not found",
        });
      }

      if (seller.moderationStatus !== "approved") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your seller account must be approved to create products",
        });
      }

      const productId = generateId("prod");
      const now = new Date().toISOString();

      const product: Product = {
        id: productId,
        name: input.name,
        description: input.description,
        price: input.price,
        originalPrice: input.originalPrice,
        currency: input.currency,
        images: input.images,
        category: input.category,
        subcategory: input.subcategory,
        rating: 0,
        reviewCount: 0,
        inStock: input.stockCount > 0,
        stockCount: input.stockCount,
        seller: {
          id: seller.id,
          name: seller.name,
          rating: seller.rating,
          country: seller.country,
          verified: seller.verified,
        },
        sellerId: seller.id,
        specifications: input.specifications ?? {},
        deliveryInfo: input.deliveryInfo,
        tags: input.tags ?? [],
        createdAt: now,
        moderationStatus: "pending",
      };

      store.products.set(productId, product);

      seller.productCount += 1;
      store.sellers.set(seller.id, seller);

      return product;
    }),

  update: sellerProcedure
    .input(
      z.object({
        id: z.string(),
        data: productInputSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);
      const product = store.products.get(input.id);

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      if (product.sellerId !== user?.sellerId && ctx.userRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own products",
        });
      }

      const updatedProduct: Product = {
        ...product,
        ...input.data,
        updatedAt: new Date().toISOString(),
        inStock: input.data.stockCount !== undefined ? input.data.stockCount > 0 : product.inStock,
      };

      store.products.set(input.id, updatedProduct);

      return updatedProduct;
    }),

  delete: sellerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);
      const product = store.products.get(input.id);

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      if (product.sellerId !== user?.sellerId && ctx.userRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own products",
        });
      }

      store.products.delete(input.id);

      if (user?.sellerId) {
        const seller = store.sellers.get(user.sellerId);
        if (seller) {
          seller.productCount = Math.max(0, seller.productCount - 1);
          store.sellers.set(seller.id, seller);
        }
      }

      return { success: true };
    }),

  getMyProducts: sellerProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);

      if (!user?.sellerId) {
        return { products: [], total: 0, hasMore: false };
      }

      let products = Array.from(store.products.values()).filter(
        (p) => p.sellerId === user.sellerId
      );

      if (input?.status) {
        products = products.filter((p) => p.moderationStatus === input.status);
      }

      const total = products.length;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      products = products.slice(offset, offset + limit);

      return {
        products,
        total,
        hasMore: offset + products.length < total,
      };
    }),
});
