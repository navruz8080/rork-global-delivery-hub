import * as z from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { getStore } from "@/backend/db/store";

export const favoritesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const store = getStore();
    const favoriteIds = store.favorites.get(ctx.userId) ?? [];
    const products = favoriteIds
      .map((id) => store.products.get(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
    return products;
  }),

  getIds: protectedProcedure.query(async ({ ctx }) => {
    const store = getStore();
    return store.favorites.get(ctx.userId) ?? [];
  }),

  toggle: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const favorites = store.favorites.get(ctx.userId) ?? [];

      const newFavorites = favorites.includes(input.productId)
        ? favorites.filter((id) => id !== input.productId)
        : [...favorites, input.productId];

      store.favorites.set(ctx.userId, newFavorites);

      return {
        favorites: newFavorites,
        isFavorite: newFavorites.includes(input.productId),
      };
    }),

  add: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const favorites = store.favorites.get(ctx.userId) ?? [];

      if (!favorites.includes(input.productId)) {
        const newFavorites = [...favorites, input.productId];
        store.favorites.set(ctx.userId, newFavorites);
        return newFavorites;
      }

      return favorites;
    }),

  remove: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const favorites = store.favorites.get(ctx.userId) ?? [];
      const newFavorites = favorites.filter((id) => id !== input.productId);
      store.favorites.set(ctx.userId, newFavorites);
      return newFavorites;
    }),
});
