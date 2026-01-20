import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "../utils/apiUrl";
import axios from "axios";

export function useCommunityPosts(sequenceId) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["communityPosts", sequenceId],
    queryFn: async () => {
      if (!sequenceId) return [];

      const response = await fetch(
        `${apiUrl}/api/communitypost/sequence/${sequenceId}`,
      );

      if (!response.ok) {
        throw new Error(`Error fetching posts: ${response.statusText}`);
      }

      const result = await response.json();

      if (result && Array.isArray(result.data)) {
        // 🔥 Fetch fresh stats for these posts
        let mergedPosts = result.data;
        try {
          const items = result.data.map((p) => ({
            id: p.content_id,
            type: "post",
          }));
          if (items.length > 0) {
            const statsRes = await axios.post(
              `${apiUrl}/api/likesdislikes/stats`,
              { items },
            );
            const statsMap = statsRes.data.data || {};

            mergedPosts = result.data.map((p) => {
              const key = `post_${p.content_id}`;
              const stat = statsMap[key];
              if (stat) {
                return {
                  ...p,
                  likes_count: stat.likes,
                  dislikes_count: stat.dislikes,
                };
              }
              return p;
            });
            console.log(
              "✅ Merged fresh stats for",
              items.length,
              "posts (Cached)",
            );
          }
        } catch (statsErr) {
          console.error("❌ Failed to fetch fresh stats in query:", statsErr);
          // Return basic posts if stats fail
        }
        return mergedPosts;
      } else {
        throw new Error("Invalid response format");
      }
    },
    enabled: !!sequenceId,
    staleTime: 1000 * 60 * 5, // 5 Minutes Cache
  });

  return {
    posts: data || [],
    loading: isLoading,
    error: error ? error.message || "Unknown error" : null,
    refetch,
  };
}
