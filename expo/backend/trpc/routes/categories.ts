import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { getStore } from "@/backend/db/store";

export const categoriesRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    const store = getStore();
    return store.categories;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const store = getStore();
      const category = store.categories.find((c) => c.id === input.id);

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      return category;
    }),
});
