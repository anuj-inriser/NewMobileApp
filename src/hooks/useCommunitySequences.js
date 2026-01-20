import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "../utils/apiUrl";

export function useCommunitySequences() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["communitySequences"],
    queryFn: async () => {
      const response = await fetch(
        `${apiUrl}/api/communitysequence/community-sequences`,
      );

      if (!response.ok) {
        throw new Error(`Error fetching sequences: ${response.statusText}`);
      }

      const result = await response.json();
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
