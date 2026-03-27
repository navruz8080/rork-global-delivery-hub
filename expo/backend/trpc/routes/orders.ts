import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, sellerProcedure } from "../create-context";
import { getStore, generateId } from "@/backend/db/store";
import { Order, OrderStatus, TrackingEvent, InternationalShipment, CustomsEvent } from "@/types";

const addressSchema = z.object({
  id: z.string(),
  label: z.string(),
  fullName: z.string(),
  phone: z.string(),
  country: z.string(),
  city: z.string(),
  street: z.string(),
  building: z.string(),
  apartment: z.string().optional(),
  postalCode: z.string(),
  isDefault: z.boolean(),
});

export const ordersRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum([
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "in_transit",
          "out_for_delivery",
          "delivered",
          "cancelled",
          "returned",
        ]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const store = getStore();
      let orders = Array.from(store.orders.values()).filter(
        (o) => o.userId === ctx.userId
      );

      if (input?.status) {
        orders = orders.filter((o) => o.status === input.status);
      }

      orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const total = orders.length;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      orders = orders.slice(offset, offset + limit);

      return {
        orders,
        total,
        hasMore: offset + orders.length < total,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const store = getStore();
      const order = store.orders.get(input.id);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const user = store.users.get(ctx.userId);
      if (order.userId !== ctx.userId && order.sellerId !== user?.sellerId && ctx.userRole !== "admin" && ctx.userRole !== "moderator") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this order",
        });
      }

      return order;
    }),

  create: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().min(1),
          })
        ),
        shippingAddress: addressSchema,
        paymentMethod: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = getStore();

      const orderItems = input.items.map((item) => {
        const product = store.products.get(item.productId);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Product ${item.productId} not found`,
          });
        }
        if (!product.inStock || product.stockCount < item.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Product ${product.name} is out of stock`,
          });
        }
        return {
          product,
          quantity: item.quantity,
          priceAtPurchase: product.price,
        };
      });

      const totalAmount = orderItems.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0
      );

      const shippingCost = totalAmount >= 500 ? 0 : 15;

      const orderId = generateId("ord");
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 1000000)
      ).padStart(6, "0")}`;

      const now = new Date().toISOString();
      const estimatedDelivery = new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0];

      const trackingEvent: TrackingEvent = {
        id: generateId("trk"),
        status: "pending",
        location: "Online",
        description: "Order placed successfully",
        timestamp: now,
      };

      const sellerId = orderItems[0]?.product.sellerId || orderItems[0]?.product.seller.id;
      const seller = store.sellers.get(sellerId);
      
      const isInternational = seller && seller.country !== input.shippingAddress.country;

      let internationalShipment: InternationalShipment | undefined;
      if (isInternational && seller) {
        internationalShipment = {
          originCountry: seller.country,
          destinationCountry: input.shippingAddress.country,
          carrier: "DHL Express",
          trackingNumber: `INT${Date.now()}`,
          customsStatus: "pending",
          customsEvents: [],
        };
      }

      const order: Order = {
        id: orderId,
        orderNumber,
        userId: ctx.userId,
        items: orderItems,
        status: "pending",
        totalAmount: totalAmount + shippingCost,
        shippingCost,
        currency: "USD",
        shippingAddress: input.shippingAddress,
        trackingHistory: [trackingEvent],
        createdAt: now,
        estimatedDelivery,
        paymentMethod: input.paymentMethod,
        sellerId,
        internationalShipment,
      };

      store.orders.set(orderId, order);

      orderItems.forEach((item) => {
        const product = store.products.get(item.product.id);
        if (product) {
          product.stockCount -= item.quantity;
          product.inStock = product.stockCount > 0;
          store.products.set(product.id, product);
        }
      });

      store.carts.set(ctx.userId, []);

      if (seller) {
        seller.totalSales += 1;
        seller.totalRevenue += totalAmount;
        store.sellers.set(sellerId, seller);
      }

      return order;
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
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
          message: "You can only cancel your own orders",
        });
      }

      if (!["pending", "confirmed", "processing"].includes(order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel order in current status",
        });
      }

      const cancelEvent: TrackingEvent = {
        id: generateId("trk"),
        status: "cancelled",
        location: "Online",
        description: input.reason || "Order cancelled by customer",
        timestamp: new Date().toISOString(),
      };

      order.items.forEach((item) => {
        const product = store.products.get(item.product.id);
        if (product) {
          product.stockCount += item.quantity;
          product.inStock = true;
          store.products.set(product.id, product);
        }
      });

      const updatedOrder: Order = {
        ...order,
        status: "cancelled",
        trackingHistory: [...order.trackingHistory, cancelEvent],
        updatedAt: new Date().toISOString(),
      };

      store.orders.set(input.id, updatedOrder);

      return updatedOrder;
    }),

  getSellerOrders: sellerProcedure
    .input(
      z.object({
        status: z.enum([
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "in_transit",
          "out_for_delivery",
          "delivered",
          "cancelled",
          "returned",
        ]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);

      if (!user?.sellerId) {
        return { orders: [], total: 0, hasMore: false };
      }

      let orders = Array.from(store.orders.values()).filter(
        (o) => o.sellerId === user.sellerId
      );

      if (input?.status) {
        orders = orders.filter((o) => o.status === input.status);
      }

      orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const total = orders.length;
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      orders = orders.slice(offset, offset + limit);

      return {
        orders,
        total,
        hasMore: offset + orders.length < total,
      };
    }),

  updateStatus: sellerProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum([
          "confirmed",
          "processing",
          "shipped",
          "in_transit",
          "out_for_delivery",
          "delivered",
        ]),
        location: z.string().optional(),
        description: z.string().optional(),
        trackingNumber: z.string().optional(),
        carrier: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);
      const order = store.orders.get(input.orderId);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (order.sellerId !== user?.sellerId && ctx.userRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own orders",
        });
      }

      const statusDescriptions: Record<OrderStatus, string> = {
        pending: "Order is pending",
        confirmed: "Order confirmed by seller",
        processing: "Order is being prepared",
        shipped: "Package handed to carrier",
        in_transit: "Package in transit",
        out_for_delivery: "Out for delivery",
        delivered: "Package delivered",
        cancelled: "Order cancelled",
        returned: "Order returned",
      };

      const trackingEvent: TrackingEvent = {
        id: generateId("trk"),
        status: input.status,
        location: input.location || order.shippingAddress.city,
        description: input.description || statusDescriptions[input.status],
        timestamp: new Date().toISOString(),
        carrier: input.carrier,
      };

      const updatedOrder: Order = {
        ...order,
        status: input.status,
        trackingNumber: input.trackingNumber || order.trackingNumber,
        trackingHistory: [...order.trackingHistory, trackingEvent],
        updatedAt: new Date().toISOString(),
      };

      store.orders.set(input.orderId, updatedOrder);

      return updatedOrder;
    }),

  updateCustomsStatus: sellerProcedure
    .input(
      z.object({
        orderId: z.string(),
        customsStatus: z.enum(["pending", "processing", "cleared", "held", "released"]),
        location: z.string(),
        description: z.string(),
        duties: z.number().optional(),
        taxes: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);
      const order = store.orders.get(input.orderId);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (order.sellerId !== user?.sellerId && ctx.userRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own orders",
        });
      }

      if (!order.internationalShipment) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This is not an international order",
        });
      }

      const customsEvent: CustomsEvent = {
        id: generateId("cst"),
        status: input.customsStatus,
        location: input.location,
        description: input.description,
        timestamp: new Date().toISOString(),
      };

      const updatedShipment: InternationalShipment = {
        ...order.internationalShipment,
        customsStatus: input.customsStatus,
        customsEvents: [...order.internationalShipment.customsEvents, customsEvent],
        ...(input.duties !== undefined && { duties: input.duties }),
        ...(input.taxes !== undefined && { taxes: input.taxes }),
      };

      const updatedOrder: Order = {
        ...order,
        internationalShipment: updatedShipment,
        updatedAt: new Date().toISOString(),
      };

      store.orders.set(input.orderId, updatedOrder);

      return updatedOrder;
    }),

  addSellerNote: sellerProcedure
    .input(
      z.object({
        orderId: z.string(),
        note: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);
      const order = store.orders.get(input.orderId);

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (order.sellerId !== user?.sellerId && ctx.userRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own orders",
        });
      }

      const updatedOrder: Order = {
        ...order,
        sellerNote: input.note,
        updatedAt: new Date().toISOString(),
      };

      store.orders.set(input.orderId, updatedOrder);

      return updatedOrder;
    }),

  trackInternational: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const store = getStore();
      const order = store.orders.get(input.orderId);

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

      return {
        trackingNumber: order.trackingNumber,
        status: order.status,
        trackingHistory: order.trackingHistory,
        internationalShipment: order.internationalShipment,
        estimatedDelivery: order.estimatedDelivery,
      };
    }),
});
