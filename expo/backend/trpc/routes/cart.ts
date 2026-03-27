import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { getStore } from "@/backend/db/store";
import { CartItem } from "@/types";

export const cartRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const store = getStore();
    const cart = store.carts.get(ctx.userId) ?? [];
    return cart;
  }),

  add: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1).default(1),
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

      const cart = store.carts.get(ctx.userId) ?? [];
      const existingIndex = cart.findIndex(
        (item) => item.product.id === input.productId
      );

      let newCart: CartItem[];
      if (existingIndex >= 0) {
        newCart = cart.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + input.quantity }
            : item
        );
      } else {
        newCart = [...cart, { product, quantity: input.quantity }];
      }

      store.carts.set(ctx.userId, newCart);
      return newCart;
    }),

  update: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const cart = store.carts.get(ctx.userId) ?? [];

      let newCart: CartItem[];
      if (input.quantity <= 0) {
        newCart = cart.filter((item) => item.product.id !== input.productId);
      } else {
        newCart = cart.map((item) =>
          item.product.id === input.productId
            ? { ...item, quantity: input.quantity }
            : item
        );
      }

      store.carts.set(ctx.userId, newCart);
      return newCart;
    }),

  remove: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const cart = store.carts.get(ctx.userId) ?? [];
      const newCart = cart.filter((item) => item.product.id !== input.productId);
      store.carts.set(ctx.userId, newCart);
      return newCart;
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    const store = getStore();
    store.carts.set(ctx.userId, []);
    return [];
  }),
});
