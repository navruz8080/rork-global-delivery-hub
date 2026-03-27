import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, moderatorProcedure, adminProcedure } from "../create-context";
import { getStore } from "@/backend/db/store";

export const moderationRouter = createTRPCRouter({
  getPendingSellers: moderatorProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const store = getStore();
      let sellers = Array.from(store.sellers.values()).filter(
        (s) => s.moderationStatus === "pending"
      );

      const total = sellers.length;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      sellers = sellers.slice(offset, offset + limit);

      return {
        sellers,
        total,
        hasMore: offset + sellers.length < total,
      };
    }),

  getPendingProducts: moderatorProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const store = getStore();
      let products = Array.from(store.products.values()).filter(
        (p) => p.moderationStatus === "pending"
      );

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

  moderateSeller: moderatorProcedure
    .input(
      z.object({
        sellerId: z.string(),
        status: z.enum(["approved", "rejected", "suspended"]),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const seller = store.sellers.get(input.sellerId);

      if (!seller) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller not found",
        });
      }

      seller.moderationStatus = input.status;
      seller.moderationNote = input.note;
      seller.moderatedAt = new Date().toISOString();
      seller.moderatedBy = ctx.userId;

      if (input.status === "approved") {
        seller.verified = true;
      }

      store.sellers.set(input.sellerId, seller);

      return seller;
    }),

  moderateProduct: moderatorProcedure
    .input(
      z.object({
        productId: z.string(),
        status: z.enum(["approved", "rejected", "suspended"]),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const product = store.products.get(input.productId);

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      product.moderationStatus = input.status;
      product.moderationNote = input.note;
      product.moderatedAt = new Date().toISOString();
      product.moderatedBy = ctx.userId;

      store.products.set(input.productId, product);

      return product;
    }),

  getStats: moderatorProcedure.query(async () => {
    const store = getStore();

    const sellers = Array.from(store.sellers.values());
    const products = Array.from(store.products.values());
    const orders = Array.from(store.orders.values());
    const users = Array.from(store.users.values());

    return {
      sellers: {
        total: sellers.length,
        pending: sellers.filter((s) => s.moderationStatus === "pending").length,
        approved: sellers.filter((s) => s.moderationStatus === "approved").length,
        rejected: sellers.filter((s) => s.moderationStatus === "rejected").length,
        suspended: sellers.filter((s) => s.moderationStatus === "suspended").length,
      },
      products: {
        total: products.length,
        pending: products.filter((p) => p.moderationStatus === "pending").length,
        approved: products.filter((p) => p.moderationStatus === "approved").length,
        rejected: products.filter((p) => p.moderationStatus === "rejected").length,
        suspended: products.filter((p) => p.moderationStatus === "suspended").length,
      },
      orders: {
        total: orders.length,
        pending: orders.filter((o) => o.status === "pending").length,
        processing: orders.filter((o) => ["confirmed", "processing"].includes(o.status)).length,
        shipping: orders.filter((o) => ["shipped", "in_transit", "out_for_delivery"].includes(o.status)).length,
        delivered: orders.filter((o) => o.status === "delivered").length,
        cancelled: orders.filter((o) => o.status === "cancelled").length,
      },
      users: {
        total: users.length,
        customers: users.filter((u) => u.role === "customer").length,
        sellers: users.filter((u) => u.role === "seller").length,
        moderators: users.filter((u) => u.role === "moderator").length,
        admins: users.filter((u) => u.role === "admin").length,
      },
    };
  }),

  getAllUsers: adminProcedure
    .input(
      z.object({
        role: z.enum(["customer", "seller", "moderator", "admin"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const store = getStore();
      let users = Array.from(store.users.values());

      if (input?.role) {
        users = users.filter((u) => u.role === input.role);
      }

      if (input?.search) {
        const searchLower = input.search.toLowerCase();
        users = users.filter(
          (u) =>
            u.email.toLowerCase().includes(searchLower) ||
            u.firstName.toLowerCase().includes(searchLower) ||
            u.lastName.toLowerCase().includes(searchLower)
        );
      }

      const total = users.length;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      users = users.slice(offset, offset + limit);

      return {
        users: users.map(({ passwordHash, ...u }) => u),
        total,
        hasMore: offset + users.length < total,
      };
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["customer", "seller", "moderator", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const store = getStore();
      const user = store.users.get(input.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      user.role = input.role;
      store.users.set(input.userId, user);

      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }),

  suspendUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const store = getStore();
      const user = store.users.get(input.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.sellerId) {
        const seller = store.sellers.get(user.sellerId);
        if (seller) {
          seller.moderationStatus = "suspended";
          seller.moderationNote = input.reason;
          store.sellers.set(user.sellerId, seller);
        }
      }

      return { success: true };
    }),
});
