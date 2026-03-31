import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axios';

/**
 * Hook to fetch subscription plans from the backend.
 */
export const useSubscriptionPlans = (userId) => {
  return useQuery({
    queryKey: ['subscriptionPlans', userId],
    queryFn: async () => {
      const response = await axiosInstance.get('/subscription/plans', {
        params: { user_id: userId }
      });
      console.log("Response data in hook:", response.data)
      if (response.data.status) {
        return response.data.result;
      }
      throw new Error(response.data.message || 'Failed to fetch plans');
    },
    staleTime: 0, // Always fetch fresh data on mount
    refetchOnMount: true,
  });
};
