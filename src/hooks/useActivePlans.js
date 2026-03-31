import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";

export const useActivePlans = () => {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ["activePlans", userId],
    queryFn: async () => {
      if (!userId) return { plans: [], allowedScriptTypes: [] };
      const res = await axiosInstance.get(`/subscription/my-plans/${userId}`);
      const plans = res.data?.result || [];

      // Extract allowed script types from plan_access_id
      // plan_access_id is stored as an array of IDs like [1, 2, 3] or null in the database.
      let scriptTypes = new Set();
      plans.forEach(plan => {
        let access = plan.plan_access_id;
        if (typeof access === "string") {
          try { access = JSON.parse(access); } catch (e) { access = []; }
        }
        if (Array.isArray(access)) {
          access.forEach(id => {
            const numId = Number(id);
            if (!isNaN(numId)) scriptTypes.add(numId);
          });
        }
      });

      return {
        plans,
        allowedScriptTypes: Array.from(scriptTypes),
      };
    },
    enabled: !!userId,
  });
};
