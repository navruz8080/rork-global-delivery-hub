import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure, createToken } from "../create-context";
import { getStore, DbUser, generateId } from "@/backend/db/store";
import { UserRole, SellerProfile } from "@/types";

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        role: z.enum(["customer", "seller"]).default("customer"),
      })
    )
    .mutation(async ({ input }) => {
      const store = getStore();
      
      const existingUser = Array.from(store.users.values()).find(
        (u) => u.email === input.email
      );
      
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const userId = generateId("user");
      const now = new Date().toISOString();
      
      const newUser: DbUser = {
        id: userId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash: hashPassword(input.password),
        addresses: [],
        favoriteProducts: [],
        notificationsEnabled: true,
        currency: "USD",
        language: "en",
        role: input.role as UserRole,
        createdAt: now,
      };

      store.users.set(userId, newUser);
      store.favorites.set(userId, []);
      store.carts.set(userId, []);

      const token = createToken(userId, input.email, input.role as UserRole);

      const { passwordHash, ...userWithoutPassword } = newUser;
      return {
        user: userWithoutPassword,
        token,
      };
    }),

  registerSeller: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        storeName: z.string().min(2),
        storeDescription: z.string().min(10),
        country: z.string().min(2),
        businessInfo: z.object({
          companyName: z.string().optional(),
          registrationNumber: z.string().optional(),
          taxId: z.string().optional(),
          address: z.string().min(5),
          phone: z.string().min(5),
          website: z.string().url().optional(),
          shippingCountries: z.array(z.string()).min(1),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const store = getStore();
      
      const existingUser = Array.from(store.users.values()).find(
        (u) => u.email === input.email
      );
      
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const userId = generateId("user");
      const sellerId = generateId("seller");
      const now = new Date().toISOString();

      const sellerProfile: SellerProfile = {
        id: sellerId,
        userId: userId,
        email: input.email,
        name: input.storeName,
        description: input.storeDescription,
        rating: 0,
        country: input.country,
        verified: false,
        productCount: 0,
        followers: 0,
        responseTime: "< 24 hours",
        joinedDate: now.split("T")[0],
        businessInfo: input.businessInfo,
        moderationStatus: "pending",
        totalSales: 0,
        totalRevenue: 0,
      };

      const newUser: DbUser = {
        id: userId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash: hashPassword(input.password),
        addresses: [],
        favoriteProducts: [],
        notificationsEnabled: true,
        currency: "USD",
        language: "en",
        role: "seller",
        sellerId: sellerId,
        createdAt: now,
      };

      store.users.set(userId, newUser);
      store.sellers.set(sellerId, sellerProfile);
      store.favorites.set(userId, []);
      store.carts.set(userId, []);

      const token = createToken(userId, input.email, "seller");

      const { passwordHash, ...userWithoutPassword } = newUser;
      return {
        user: userWithoutPassword,
        seller: sellerProfile,
        token,
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const store = getStore();
      
      const user = Array.from(store.users.values()).find(
        (u) => u.email === input.email
      );

      if (!user || user.passwordHash !== hashPassword(input.password)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      user.lastLoginAt = new Date().toISOString();
      store.users.set(user.id, user);

      const token = createToken(user.id, user.email, user.role);

      let seller: SellerProfile | undefined;
      if (user.sellerId) {
        seller = store.sellers.get(user.sellerId);
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        seller,
        token,
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const store = getStore();
    const user = store.users.get(ctx.userId);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    let seller: SellerProfile | undefined;
    if (user.sellerId) {
      seller = store.sellers.get(user.sellerId);
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      seller,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional(),
        avatar: z.string().url().optional(),
        notificationsEnabled: z.boolean().optional(),
        currency: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const updatedUser: DbUser = {
        ...user,
        ...input,
      };

      store.users.set(ctx.userId, updatedUser);

      const { passwordHash, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.passwordHash !== hashPassword(input.currentPassword)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      user.passwordHash = hashPassword(input.newPassword);
      store.users.set(ctx.userId, user);

      return { success: true };
    }),
});
