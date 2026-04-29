import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../api/axios";

/**
 * Hook to fetch user watchlists with React Query caching
 */
export const useWatchlists = () => {
  return useQuery({
    queryKey: ["watchlists"],
    queryFn: async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return [];
      
      const res = await axiosInstance.get(`/wishlistcontrol`, {
        params: { user_id: userId }
      });
      
      return (res?.data?.data || []).map((item) => ({
        id: item.wishlist_id,
        name: item.wishlist_name,
        user: item.user_id,
        isWatchlist: true
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

/**
 * Hook to fetch scan counts for a list of sequences in parallel
 * @param {Array} sequences - List of sequence objects
 */
export const useScanCounts = (sequences = []) => {
  const results = useQueries({
    queries: sequences.map((seq) => ({
      queryKey: ["scanCount", seq.id],
      queryFn: async () => {
        try {
          const res = await axiosInstance.get(`/communitysequence/scan-results`, {
            params: { scan_id: seq.id }
          });
          return res.data?.data?.length || 0;
        } catch (err) {
          console.error(`Error fetching count for ${seq.id}:`, err);
          return 0;
        }
      },
      enabled: !!seq.id,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    })),
  });

  // Map results back to sequence IDs for easy access
  const scanCounts = {};
  sequences.forEach((seq, index) => {
    scanCounts[seq.id] = results[index]?.data ?? 0;
  });

  const isLoading = results.some(r => r.isLoading);
  const isFetching = results.some(r => r.isFetching);

  return { scanCounts, isLoading, isFetching };
};

/**
 * Hook to fetch scan results for a specific sequence/scan
 */
export const useScanResults = (scanId) => {
  return useQuery({
    queryKey: ["scanResults", scanId],
    queryFn: async () => {
      if (!scanId) return [];
      try {
        const res = await axiosInstance.get(`/communitysequence/scan-results`, {
          params: { scan_id: scanId }
        });
        return res.data?.data || [];
      } catch (err) {
        console.error(`Error fetching scan results for ${scanId}:`, err);
        return [];
      }
    },
    enabled: !!scanId,
    staleTime: 0, // Fresh results
  });
};

/**
 * Hook to fetch scans types
 */

export const useScanTypes = () => {
  return useQuery({
    queryKey: ["scanTypes"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get(`/communitysequence/scan-types`);
        const types = res?.data?.data || res.data || [];
        return Array.isArray(types) ? types.map(type => ({
          name: type.name,
          id: type.id,
        })) : [];
      } catch (err) {
        console.error("Error fetching scan types:", err);
        return [];
      }
    },
    staleTime: 0,
  });
}



/**
 * Hook to fetch user's bookmarked scan IDs
 */
export const useBookmarks = () => {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return [];
      
      const res = await axiosInstance.get(`/communitysequence/bookmarks`, {
        params: { user_id: userId }
      });
      // Assuming the API returns a list of objects with scan_id
      return (res?.data?.data || []).map(item => item.scan_id);
    },
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook to toggle bookmark (add/remove) for a scan
 */
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scanId }) => {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) throw new Error("User not logged in");

      // Use the new single toggle endpoint
      return axiosInstance.post(`/communitysequence/toggle-bookmark`, {
        user_id: userId,
        scan_id: scanId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    }
  });
};
