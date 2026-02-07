import { useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiUrl } from "../utils/apiUrl";

export const useAllStocks = (
  limit = 5,
  sortBy = "price_desc",
  indexName = null,
  exchange = null
) => {
  
  const fetchStocks = async ({ pageParam = 0 }) => {
    // SCENARIO 1: Index Filter or Exchange Filter 
    // (Logic preserved from previous implementation: if indexName is present, we might fetch differently)
    // For now, following the previous pattern where we fetch watchlist for pagination
    
    if (indexName) {
         // Fallback for specific index if needed, but sticking to main aligned structure
         // If we strictly need index support, we'd adjust the API call.
         // Previous code returned early or fetched all.
         // Let's assume standard watchlist endpoint for now as primary optimization target.
         const response = await fetch(`${apiUrl}/api/indices/${indexName}/stocks`);
         const result = await response.json();
         // If unlimited, return all as one page
         return {
             data: result.data || [],
             nextOffset: null, // No more pages
         };
    }

    const url = `${apiUrl}/api/trading/watchlist?limit=${limit}&offset=${pageParam}`;
    // console.log(`[useAllStocks] Fetching: ${url} (limit=${limit}, offset=${pageParam})`);
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    
    if (result.success && Array.isArray(result.data)) {
        const newStocks = result.data.map((stock) => ({
          id: stock.token, // Use stable token ID
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          exchange: stock.exch_seg || stock.exchange || "NSE",
          ...stock,
          stats: {
            likes: stock.likes_count || 0,
            dislikes: stock.dislikes_count || 0,
            comments: stock.comments_count || 0,
          },
        }));

        // Determine if there is more data
        const nextOffset = newStocks.length < limit ? null : pageParam + limit;
        
        return {
            data: newStocks,
            nextOffset,
        };
    }
    
    return { data: [], nextOffset: null };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["allStocks", limit, sortBy, indexName],
    queryFn: fetchStocks,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours (renamed from cacheTime in v5)
  });

  // Flatten the pages into a single array
  const stocks = data?.pages.flatMap((page) => page.data) || [];

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, fetchNextPage]);

  return {
    stocks,
    loading: isLoading, // Only true on initial load, not on background refetch
    hasMore: !!hasNextPage,
    error: isError ? (error?.message || "Failed to fetch stocks") : null,
    loadMore,
    refresh: refetch, // Expose refetch as refresh
  };
};
