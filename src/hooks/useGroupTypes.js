import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axios";

export const useGroupTypes = () => {
  return useQuery({
    queryKey: ["allgrouptype"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/indicesNew/allgrouptype");
        const result = response.data;


        // Check if the response is successful and has data
        if (result && result.success) {
          return result.data || [];
        }

        // Handle cases where result.success is false or data is missing
        // throwing an error allows useQuery's 'error' state to be populated
        throw new Error(result?.message || "Failed to load group types");
      } catch (error) {
        // Rethrow the error so react-query can catch it
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1, // Retry once before failing
  });
};