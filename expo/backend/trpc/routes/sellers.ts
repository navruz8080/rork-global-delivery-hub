import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure, sellerProcedure } from "../create-context";
import { getStore } from "@/backend/db/store";
import { SellerProfile } from "@/types";

export const sellersRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        country: z.string().optional(),
        verified: z.boolean().optional(),
        sortBy: z.enum(["rating", "followers", "products", "newest"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const store = getStore();
      let sellers = Array.from(store.sellers.values()).filter(
        (s) => s.moderationStatus === "approved"
      );

      if (input?.search) {
        const searchLower = input.search.toLowerCase();
        sellers = sellers.filter(
          (s) =>
            s.name.toLowerCase().includes(searchLower) ||
            s.description.toLowerCase().includes(searchLower)
        );
      }

      if (input?.country) {
        sellers = sellers.filter((s) => s.country === input.country);
      }

      if (input?.verified !== undefined) {
        sellers = sellers.filter((s) => s.verified === input.verified);
      }

      const total = sellers.length;

      switch (input?.sortBy) {
        case "rating":
          sellers.sort((a, b) => b.rating - a.rating);
          break;
        case "followers":
          sellers.sort((a, b) => b.followers - a.followers);
          break;
        case "products":
          sellers.sort((a, b) => b.productCount - a.productCount);
          break;
        case "newest":
          sellers.sort(
            (a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime()
          );
          break;
        default:
          sellers.sort((a, b) => b.rating - a.rating);
      }

      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      sellers = sellers.slice(offset, offset + limit);

      return {
        sellers,
        total,
        hasMore: offset + sellers.length < total,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const store = getStore();
      const seller = store.sellers.get(input.id);

      if (!seller) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller not found",
        });
      }

      if (seller.moderationStatus !== "approved") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller not found",
        });
      }

      return seller;
    }),

  getProducts: publicProcedure
    .input(
      z.object({
        sellerId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const store = getStore();
      let products = Array.from(store.products.values()).filter(
        (p) => p.sellerId === input.sellerId && p.moderationStatus === "approved"
      );

      const total = products.length;
      products = products.slice(input.offset, input.offset + input.limit);

      return {
        products,
        total,
        hasMore: input.offset + products.length < total,
      };
    }),

  getMyProfile: sellerProcedure.query(async ({ ctx }) => {
    const store = getStore();
    const user = store.users.get(ctx.userId);

    if (!user?.sellerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Seller profile not found",
      });
    }

    const seller = store.sellers.get(user.sellerId);
    if (!seller) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Seller profile not found",
      });
    }

    return seller;
  }),

  updateProfile: sellerProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        description: z.string().min(10).optional(),
        logo: z.string().url().optional(),
        banner: z.string().url().optional(),
        businessInfo: z
          .object({
            companyName: z.string().optional(),
            registrationNumber: z.string().optional(),
            taxId: z.string().optional(),
            address: z.string().optional(),
            phone: z.string().optional(),
            website: z.string().url().optional(),
            shippingCountries: z.array(z.string()).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);

      if (!user?.sellerId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller profile not found",
        });
      }

      const seller = store.sellers.get(user.sellerId);
      if (!seller) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller profile not found",
        });
      }

      const updatedSeller: SellerProfile = {
        ...seller,
        ...(input.name && { name: input.name }),
        ...(input.description && { description: input.description }),
        ...(input.logo && { logo: input.logo }),
        ...(input.banner && { banner: input.banner }),
        ...(input.businessInfo && {
          businessInfo: { ...seller.businessInfo, ...input.businessInfo },
        }),
      };

      store.sellers.set(user.sellerId, updatedSeller);

      return updatedSeller;
    }),

  getStats: sellerProcedure.query(async ({ ctx }) => {
    const store = getStore();
    const user = store.users.get(ctx.userId);

    if (!user?.sellerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Seller profile not found",
      });
    }

    const seller = store.sellers.get(user.sellerId);
    if (!seller) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Seller profile not found",
      });
    }

    const products = Array.from(store.products.values()).filter(
      (p) => p.sellerId === user.sellerId
    );

    const orders = Array.from(store.orders.values()).filter(
      (o) => o.sellerId === user.sellerId
    );

    const pendingOrders = orders.filter(
      (o) => ["pending", "confirmed", "processing"].includes(o.status)
    );

    const completedOrders = orders.filter((o) => o.status === "delivered");

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.moderationStatus === "approved").length,
      pendingProducts: products.filter((p) => p.moderationStatus === "pending").length,
      totalOrders: orders.length,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      totalRevenue,
      followers: seller.followers,
      rating: seller.rating,
    };
  }),

  follow: protectedProcedure
    .input(z.object({ sellerId: z.string() }))
    .mutation(async ({ input }) => {
      const store = getStore();
      const seller = store.sellers.get(input.sellerId);

      if (!seller) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller not found",
        });
      }

      seller.followers += 1;
      store.sellers.set(input.sellerId, seller);

      return { followers: seller.followers };
    }),

  unfollow: protectedProcedure
    .input(z.object({ sellerId: z.string() }))
    .mutation(async ({ input }) => {
      const store = getStore();
      const seller = store.sellers.get(input.sellerId);

      if (!seller) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller not found",
        });
      }

      seller.followers = Math.max(0, seller.followers - 1);
      store.sellers.set(input.sellerId, seller);

      return { followers: seller.followers };
    }),
});
