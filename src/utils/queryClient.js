// src/utils/queryClient.js
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Allow refetch on mount, but staleTime will prevent if data is fresh
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh, won't refetch
      gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in memory/cache (renamed from cacheTime in v5)
    },
  },
});
