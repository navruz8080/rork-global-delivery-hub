import * as z from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { getStore } from "@/backend/db/store";
import { Address } from "@/types";

const addressSchema = z.object({
  label: z.string().min(1),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  country: z.string().min(1),
  city: z.string().min(1),
  street: z.string().min(1),
  building: z.string().min(1),
  apartment: z.string().optional(),
  postalCode: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const addressesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const store = getStore();
    const user = store.users.get(ctx.userId);
    return user?.addresses ?? [];
  }),

  add: protectedProcedure
    .input(addressSchema)
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const newAddress: Address = {
        id: `addr_${Date.now()}`,
        ...input,
        apartment: input.apartment ?? undefined,
        isDefault: input.isDefault ?? user.addresses.length === 0,
      };

      if (newAddress.isDefault) {
        user.addresses = user.addresses.map((a) => ({ ...a, isDefault: false }));
      }

      user.addresses.push(newAddress);
      store.users.set(ctx.userId, user);

      return newAddress;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: addressSchema.partial(),
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

      const addressIndex = user.addresses.findIndex((a) => a.id === input.id);
      if (addressIndex === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      if (input.data.isDefault) {
        user.addresses = user.addresses.map((a) => ({ ...a, isDefault: false }));
      }

      user.addresses[addressIndex] = {
        ...user.addresses[addressIndex],
        ...input.data,
      };

      store.users.set(ctx.userId, user);

      return user.addresses[addressIndex];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const addressIndex = user.addresses.findIndex((a) => a.id === input.id);
      if (addressIndex === -1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      user.addresses.splice(addressIndex, 1);
      store.users.set(ctx.userId, user);

      return { success: true };
    }),

  setDefault: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const store = getStore();
      const user = store.users.get(ctx.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      user.addresses = user.addresses.map((a) => ({
        ...a,
        isDefault: a.id === input.id,
      }));

      store.users.set(ctx.userId, user);

      return user.addresses;
    }),
});
