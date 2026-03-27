import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../create-context";
import { getStore, generateId } from "@/backend/db/store";

// Order status FSM
const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "in_transit",
  "at_pvz",
  "ready_for_pickup",
  "delivered",
  "cancelled",
] as const;

const PACKAGE_STATUSES = [
  "AWAITING_IU",
  "IU_STOCK",
  "IN_TRANSIT",
  "AT_PVZ",
  "READY_FOR_PICKUP",
  "ISSUED",
  "CANCELED",
] as const;

const routeSchema = z.object({
  routeFrom: z.string(),
  routeTo: z.string(),
});

const dimensionsSchema = z.object({
  length: z.number().min(0.1),
  width: z.number().min(0.1),
  height: z.number().min(0.1),
});

const calculateInputSchema = z.object({
  routeFrom: z.string(),
  routeTo: z.string(),
  dimensions: dimensionsSchema,
  weight: z.number().min(0.1),
  quantity: z.number().min(1).default(1),
});

const createOrderInputSchema = z.object({
  routeFrom: z.string(),
  routeTo: z.string(),
  dimensions: dimensionsSchema,
  weight: z.number().min(0.1),
  quantity: z.number().min(1),
  totalWeight: z.number(),
  totalVolume: z.number(),
  price: z.number(),
  fullName: z.string().min(3),
  phoneNumber: z.string().min(7),
  bonusDebited: z.number().optional(),
});

const addPackageSchema = z.object({
  trackNumber: z.string().min(3),
  description: z.string().optional(),
});

// Price calculation based on route and dimensions
function calculatePrice(
  routeFrom: string,
  routeTo: string,
  totalWeight: number,
  totalVolume: number
): number {
  // Base prices per route (simplified - should match bot logic)
  const basePrices: Record<string, Record<string, number>> = {
    CN_URUMQI: {
      TJ_DUSHANBE: 2.5,
      TJ_KHUJAND: 2.8,
    },
    CN_IU: {
      TJ_DUSHANBE: 2.0,
      TJ_KHUJAND: 2.3,
    },
    KZ_SHYMKENT: {
      TJ_DUSHANBE: 1.8,
      TJ_KHUJAND: 2.0,
    },
    UZ_TASHKENT: {
      TJ_DUSHANBE: 1.5,
      TJ_KHUJAND: 1.7,
    },
  };

  const basePrice = basePrices[routeFrom]?.[routeTo] || 2.0;
  
  // Calculate by volume weight (1 m³ = 167 kg)
  const volumeWeight = totalVolume * 167;
  const chargeableWeight = Math.max(totalWeight, volumeWeight);
  
  return chargeableWeight * basePrice;
}

export const deliveryRouter = createTRPCRouter({
  calculate: publicProcedure
    .input(calculateInputSchema)
    .mutation(async ({ input }) => {
      const totalWeight = input.weight * input.quantity;
      const totalVolume =
        (input.dimensions.length *
          input.dimensions.width *
          input.dimensions.height *
          input.quantity) /
        1000000; // Convert cm³ to m³

      const price = calculatePrice(
        input.routeFrom,
        input.routeTo,
        totalWeight,
        totalVolume
      );

      return {
        price: Math.round(price * 100) / 100,
        totalWeight: Math.round(totalWeight * 100) / 100,
        totalVolume: Math.round(totalVolume * 1000) / 1000,
      };
    }),

  createOrder: protectedProcedure
    .input(createOrderInputSchema)
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const orderId = generateId("ord");
      const now = new Date().toISOString();

      const order = {
        id: orderId,
        userId: ctx.userId,
        routeFrom: input.routeFrom,
        routeTo: input.routeTo,
        route: `${input.routeFrom} → ${input.routeTo}`,
        dimensions: input.dimensions,
        weight: input.weight,
        quantity: input.quantity,
        totalWeight: input.totalWeight,
        totalVolume: input.totalVolume,
        price: input.price,
        finalPrice: input.price - (input.bonusDebited || 0),
        bonusDebited: input.bonusDebited || 0,
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        status: "pending" as const,
        createdAt: now,
        updatedAt: now,
      };

      if (!store.orders) {
        store.orders = new Map();
      }
      store.orders.set(orderId, order);

      return order;
    }),

  getMyOrders: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(ORDER_STATUSES).optional(),
          limit: z.number().min(1).max(50).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const store = getStore();
      if (!store.orders) {
        return { orders: [], total: 0, hasMore: false };
      }

      let orders = Array.from(store.orders.values()).filter(
        (o) => o.userId === ctx.userId
      );

      if (input?.status) {
        orders = orders.filter((o) => o.status === input.status);
      }

      orders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const total = orders.length;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      const paginatedOrders = orders.slice(offset, offset + limit);

      return {
        orders: paginatedOrders,
        total,
        hasMore: offset + paginatedOrders.length < total,
      };
    }),

  getOrderById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const store = getStore();
      if (!store.orders) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const order = store.orders.get(input.id);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (order.userId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this order",
        });
      }

      return order;
    }),

  addPackage: protectedProcedure
    .input(addPackageSchema)
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      if (!store.packages) {
        store.packages = new Map();
      }

      // Check if track number already exists
      const existing = Array.from(store.packages.values()).find(
        (p) => p.trackNumber === input.trackNumber
      );

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Track number already exists",
        });
      }

      const packageId = generateId("pkg");
      const now = new Date().toISOString();

      const pkg = {
        id: packageId,
        userId: ctx.userId,
        trackNumber: input.trackNumber,
        description: input.description || "",
        status: "AWAITING_IU" as const,
        createdAt: now,
        updatedAt: now,
        history: [
          {
            id: generateId("hist"),
            status: "AWAITING_IU",
            timestamp: now,
            description: "Package added to system",
          },
        ],
      };

      store.packages.set(packageId, pkg);

      return pkg;
    }),

  getMyPackages: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(PACKAGE_STATUSES).optional(),
          limit: z.number().min(1).max(50).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const store = getStore();
      if (!store.packages) {
        return { packages: [], total: 0, hasMore: false };
      }

      let packages = Array.from(store.packages.values()).filter(
        (p) => p.userId === ctx.userId
      );

      if (input?.status) {
        packages = packages.filter((p) => p.status === input.status);
      }

      packages.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      const total = packages.length;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      const paginatedPackages = packages.slice(offset, offset + limit);

      return {
        packages: paginatedPackages,
        total,
        hasMore: offset + paginatedPackages.length < total,
      };
    }),

  getPackageById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const store = getStore();
      if (!store.packages) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found",
        });
      }

      const pkg = store.packages.get(input.id);

      if (!pkg) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found",
        });
      }

      if (pkg.userId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this package",
        });
      }

      return pkg;
    }),

  trackPackage: publicProcedure
    .input(z.object({ trackNumber: z.string() }))
    .query(async ({ input }) => {
      const store = getStore();
      if (!store.packages) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found",
        });
      }

      const pkg = Array.from(store.packages.values()).find(
        (p) => p.trackNumber === input.trackNumber
      );

      if (!pkg) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Package not found",
        });
      }

      return {
        trackNumber: pkg.trackNumber,
        description: pkg.description,
        status: pkg.status,
        history: pkg.history || [],
        updatedAt: pkg.updatedAt,
      };
    }),

  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const store = getStore();
    const activities: any[] = [];

    // Get recent orders
    if (store.orders) {
      const recentOrders = Array.from(store.orders.values())
        .filter((o) => o.userId === ctx.userId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5);

      activities.push(
        ...recentOrders.map((order) => ({
          type: "order",
          id: order.id,
          title: `Order ${order.id}`,
          description: `Status: ${order.status}`,
          timestamp: order.updatedAt,
        }))
      );
    }

    // Get recent package updates
    if (store.packages) {
      const recentPackages = Array.from(store.packages.values())
        .filter((p) => p.userId === ctx.userId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5);

      activities.push(
        ...recentPackages.map((pkg) => ({
          type: "package",
          id: pkg.id,
          title: `Package ${pkg.trackNumber}`,
          description: `Status: ${pkg.status}`,
          timestamp: pkg.updatedAt,
        }))
      );
    }

    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);
  }),
});
