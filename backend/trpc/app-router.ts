import { createTRPCRouter } from "./create-context";
import { authRouter } from "./routes/auth";
import { productsRouter } from "./routes/products";
import { categoriesRouter } from "./routes/categories";
import { ordersRouter } from "./routes/orders";
import { cartRouter } from "./routes/cart";
import { favoritesRouter } from "./routes/favorites";
import { addressesRouter } from "./routes/addresses";
import { sellersRouter } from "./routes/sellers";
import { moderationRouter } from "./routes/moderation";
import { deliveryRouter } from "./routes/delivery";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  delivery: deliveryRouter, // PRIMARY: Delivery workflow
  products: productsRouter, // SECONDARY: Marketplace
  categories: categoriesRouter,
  orders: ordersRouter, // Marketplace orders (secondary)
  cart: cartRouter,
  favorites: favoritesRouter,
  addresses: addressesRouter,
  sellers: sellersRouter,
  moderation: moderationRouter,
});

export type AppRouter = typeof appRouter;
