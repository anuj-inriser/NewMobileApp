import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "../utils/apiUrl";
import axiosInstance from "../api/axios";

export function useCommunitySequences() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["communitySequences"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/communitysequence/community-sequences`,
      );
      if (!response.status || response.status !== 200) {
        throw new Error(`Error fetching sequences: ${response.statusText}`);
      }
      const result = response.data;
      if (result && Array.isArray(result.data)) {
        return result.data;
      } else {
        throw new Error("Invalid response format");
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  return {
    sequences: data || [],
    loading: isLoading,
    error: error ? error.message || "Unknown error" : null,
    refetch,
  };
}