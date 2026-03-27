import createContextHook from '@nkzw/create-context-hook';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem, Product, User, Order, Category } from '@/types';
import { trpc, setAuthToken, clearAuthToken, getAuthToken, updateCachedToken } from '@/lib/trpc';

const defaultUser: User = {
  id: '',
  email: '',
  firstName: 'Guest',
  lastName: '',
  addresses: [],
  favoriteProducts: [],
  notificationsEnabled: true,
  currency: 'USD',
  language: 'en',
  role: 'customer',
  createdAt: new Date().toISOString(),
};

export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const cartQuery = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });

  const favoritesIdsQuery = trpc.favorites.getIds.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });

  const ordersQuery = trpc.orders.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });

  const categoriesQuery = trpc.categories.list.useQuery();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          updateCachedToken(token);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log('Auth check error:', error);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (cartQuery.data) {
      setLocalCart(cartQuery.data);
    }
  }, [cartQuery.data]);

  useEffect(() => {
    if (favoritesIdsQuery.data) {
      setLocalFavorites(favoritesIdsQuery.data);
    }
  }, [favoritesIdsQuery.data]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await setAuthToken(data.token);
      updateCachedToken(data.token);
      setIsAuthenticated(true);
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      await setAuthToken(data.token);
      updateCachedToken(data.token);
      setIsAuthenticated(true);
      queryClient.invalidateQueries();
    },
  });

  const addToCartMutation = trpc.cart.add.useMutation({
    onMutate: async ({ productId, quantity }) => {
      const existingItem = localCart.find(item => item.product.id === productId);
      if (existingItem) {
        setLocalCart(prev => prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + (quantity || 1) }
            : item
        ));
      }
    },
    onSuccess: (data) => {
      setLocalCart(data);
      queryClient.setQueryData([['cart', 'get']], data);
    },
  });

  const updateCartMutation = trpc.cart.update.useMutation({
    onMutate: async ({ productId, quantity }) => {
      if (quantity <= 0) {
        setLocalCart(prev => prev.filter(item => item.product.id !== productId));
      } else {
        setLocalCart(prev => prev.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        ));
      }
    },
    onSuccess: (data) => {
      setLocalCart(data);
      queryClient.setQueryData([['cart', 'get']], data);
    },
  });

  const removeFromCartMutation = trpc.cart.remove.useMutation({
    onMutate: async ({ productId }) => {
      setLocalCart(prev => prev.filter(item => item.product.id !== productId));
    },
    onSuccess: (data) => {
      setLocalCart(data);
      queryClient.setQueryData([['cart', 'get']], data);
    },
  });

  const clearCartMutation = trpc.cart.clear.useMutation({
    onMutate: async () => {
      setLocalCart([]);
    },
    onSuccess: () => {
      queryClient.setQueryData([['cart', 'get']], []);
    },
  });

  const toggleFavoriteMutation = trpc.favorites.toggle.useMutation({
    onMutate: async ({ productId }) => {
      setLocalFavorites(prev =>
        prev.includes(productId)
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      );
    },
    onSuccess: (data) => {
      setLocalFavorites(data.favorites);
      queryClient.invalidateQueries({ queryKey: [['favorites']] });
    },
  });

  const login = useCallback(async (email: string, password: string) => {
    return loginMutation.mutateAsync({ email, password });
  }, [loginMutation]);

  const register = useCallback(async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    return registerMutation.mutateAsync(data);
  }, [registerMutation]);

  const logout = useCallback(async () => {
    await clearAuthToken();
    updateCachedToken(null);
    setIsAuthenticated(false);
    setLocalCart([]);
    setLocalFavorites([]);
    queryClient.clear();
  }, [queryClient]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    if (!isAuthenticated) {
      setLocalCart(prev => {
        const existingIndex = prev.findIndex(item => item.product.id === product.id);
        if (existingIndex >= 0) {
          return prev.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { product, quantity }];
      });
      return;
    }
    
    setLocalCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex >= 0) {
        return prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    
    addToCartMutation.mutate({ productId: product.id, quantity });
  }, [isAuthenticated, addToCartMutation]);

  const removeFromCart = useCallback((productId: string) => {
    if (!isAuthenticated) {
      setLocalCart(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    removeFromCartMutation.mutate({ productId });
  }, [isAuthenticated, removeFromCartMutation]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (!isAuthenticated) {
      if (quantity <= 0) {
        setLocalCart(prev => prev.filter(item => item.product.id !== productId));
      } else {
        setLocalCart(prev => prev.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        ));
      }
      return;
    }
    updateCartMutation.mutate({ productId, quantity });
  }, [isAuthenticated, updateCartMutation]);

  const clearCart = useCallback(() => {
    if (!isAuthenticated) {
      setLocalCart([]);
      return;
    }
    clearCartMutation.mutate();
  }, [isAuthenticated, clearCartMutation]);

  const toggleFavorite = useCallback((productId: string) => {
    if (!isAuthenticated) {
      setLocalFavorites(prev =>
        prev.includes(productId)
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      );
      return;
    }
    toggleFavoriteMutation.mutate({ productId });
  }, [isAuthenticated, toggleFavoriteMutation]);

  const isFavorite = useCallback((productId: string) => {
    return localFavorites.includes(productId);
  }, [localFavorites]);

  const user = useMemo<User>(() => {
    if (meQuery.data?.user) {
      return meQuery.data.user as User;
    }
    return defaultUser;
  }, [meQuery.data]);

  const setUser = useCallback((updater: User | ((prev: User) => User)) => {
    console.log('User update requested - use updateProfile mutation instead');
  }, []);

  const cart = localCart;
  const favorites = localFavorites;

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const orders = useMemo<Order[]>(() => {
    return ordersQuery.data?.orders ?? [];
  }, [ordersQuery.data]);

  const categories = useMemo<Category[]>(() => {
    return categoriesQuery.data ?? [];
  }, [categoriesQuery.data]);

  const refetchOrders = useCallback(() => {
    ordersQuery.refetch();
  }, [ordersQuery]);

  const refetchCart = useCallback(() => {
    cartQuery.refetch();
  }, [cartQuery]);

  const refetchFavorites = useCallback(() => {
    favoritesIdsQuery.refetch();
  }, [favoritesIdsQuery]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal,
    cartItemCount,
    favorites,
    toggleFavorite,
    isFavorite,
    user,
    setUser,
    orders,
    categories,
    isAuthenticated,
    authLoading,
    login,
    register,
    logout,
    loginError: loginMutation.error?.message,
    registerError: registerMutation.error?.message,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoading: authLoading || (isAuthenticated && (cartQuery.isLoading || meQuery.isLoading)),
    refetchOrders,
    refetchCart,
    refetchFavorites,
  };
});

export function useCartItem(productId: string) {
  const { cart } = useApp();
  return useMemo(() => cart.find(item => item.product.id === productId), [cart, productId]);
}

export function useFavoriteProducts() {
  const { favorites, isAuthenticated } = useApp();
  
  const favoritesListQuery = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated && favorites.length > 0,
  });

  return useMemo(() => {
    if (isAuthenticated && favoritesListQuery.data) {
      return favoritesListQuery.data;
    }
    return [];
  }, [isAuthenticated, favoritesListQuery.data]);
}
