import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const AUTH_TOKEN_KEY = "@globalgo_auth_token";

export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    console.warn("EXPO_PUBLIC_RORK_API_BASE_URL not set, using fallback");
    return "";
  }

  return url;
};

let cachedToken: string | null = null;

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        if (!cachedToken) {
          cachedToken = await getAuthToken();
        }
        return cachedToken
          ? { authorization: `Bearer ${cachedToken}` }
          : {};
      },
    }),
  ],
});

export function updateCachedToken(token: string | null) {
  cachedToken = token;
}
