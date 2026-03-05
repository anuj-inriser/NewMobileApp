import { useQuery } from '@tanstack/react-query';
import axiosInstance from "../api/axios";
import { apiUrl } from '../utils/apiUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceId } from "../utils/deviceId";

// Helper to get auth headers
const getAuthHeaders = async (authToken) => {
    const userId = await AsyncStorage.getItem("userId");
    const deviceId = await getDeviceId();
    return {
        headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
            "userid": userId,
            "device_mac": deviceId
        }
    };
};

/* -------------------- 1. NEWS -------------------- */
// export const useNews = () => {
//     return useQuery({
//         queryKey: ['news'],
//         queryFn: async () => {
//             const res = await axiosInstance.get("/newsfeed/published");
//             return res.data?.data || [];
//         },
//         staleTime: 5 * 60 * 1000, // 5 minutes
//     });
// };

export const useNews = (categoryId) => {
    const {
        data: news = [],
        isLoading,
        isFetching,
        error,
        refetch
    } = useQuery({
        queryKey: ['news', categoryId],
        queryFn: async () => {
            const params = {};
            if (categoryId) params.news_category = categoryId;
            const res = await axiosInstance.get("/newsfeed/published", { params });
            return res.data?.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });

    return {
        news,
        loading: isLoading,
        isFetching,
        error: error?.message || null,
        refetch
    };
};

export const useNewsCategories = () => {
    return useQuery({
        queryKey: ['newsCategories'],
        queryFn: async () => {
            const res = await axiosInstance.get("/newsfeed/categories");
            return res.data?.categories || [];
        },
        staleTime: 60 * 1 * 1000, // 1 minutes
    });
};


/* -------------------- 2. INDICES -------------------- */
export const useIndices = (exchange = 'NSE') => {
    const query = useQuery({
        queryKey: ['indices', exchange],
        queryFn: async () => {
            // Use the same endpoint as the working Indices.js component
            const url = exchange === 'BSE'
                ? '/indicesNew/bse'
                : '/indicesNew/nse';

            const response = await axiosInstance.get(url);
            return response.data;
        },
        staleTime: 30 * 60 * 1000, // 30 minutes (indices don't change often)
    });

    return query;
};

/* -------------------- 3. MARKET CAP -------------------- */
export const useMarketCap = (exchange = 'NSE') => {
    return useQuery({
        queryKey: ['marketCap', exchange],
        queryFn: async () => {
            const url = exchange === 'BSE'
                ? '/indicesNew/bsemarketcap'
                : '/indicesNew/nsemarketcap';
            const response = await axiosInstance.get(url);
            return response.data?.data || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/* -------------------- 4. SECTORS -------------------- */
export const useSectors = (exchange = 'NSE') => {
    return useQuery({
        queryKey: ['sectors', exchange],
        queryFn: async () => {
            const url = exchange === 'BSE'
                ? '/indicesNew/bsesector'
                : '/indicesNew/nsesector';
            const response = await axiosInstance.get(url);
            return response.data?.data || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/* -------------------- 5. THEMES -------------------- */
export const useThemes = (exchange = 'NSE') => {
    return useQuery({
        queryKey: ['themes', exchange],
        queryFn: async () => {
            const url = exchange === 'BSE'
                ? '/indicesNew/bsetheme'
                : '/indicesNew/nsetheme';
            const response = await axiosInstance.get(url);
            return response.data?.data || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/* -------------------- 6. STOCK SCREENS -------------------- */
export const useStockScreens = (screenType) => {
    return useQuery({
        queryKey: ['stockScreens', screenType],
        queryFn: async () => {
            // Note: Assuming the endpoint structure based on usage in StocksScreen.js
            // If screenType is dynamic, the caller passes it
            const res = await axiosInstance.get(`/screens/${screenType}`);
            return res.data;
        },
        enabled: !!screenType,
        staleTime: 5 * 60 * 1000,
    });
};

/* -------------------- 4. PORTFOLIO -------------------- */
export const usePortfolio = (authToken) => {
    return useQuery({
        queryKey: ['portfolio'],
        queryFn: async () => {
            const userId = await AsyncStorage.getItem("userId");
            const deviceId = await getDeviceId();

            const response = await fetch(`${apiUrl}/api/portfolio/getPortfolioBalance`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                    "userid": userId,
                    "device_mac": deviceId
                }
            });
            const json = await response.json();

            // Deduplicate logic (from PortfolioScreen.js fix)
            const allOrders = json?.data || [];
            const seen = new Set();
            const uniqueOrders = allOrders.filter(item => {
                const key = `${item.tradingsymbol}_${item.broker_id}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            return uniqueOrders;
        },
        enabled: !!authToken,
        staleTime: 1 * 60 * 1000, // 1 minute
    });
};

/* -------------------- 5. IDEAS (Trade Recommendations) -------------------- */
export const useIdeas = (selectedCategory, selectedFilter) => {
    return useQuery({
        queryKey: ['ideas', selectedCategory?.scriptTypeId, selectedFilter],
        queryFn: async () => {
            const params = {};
            if (selectedCategory) params.scriptTypeId = selectedCategory.scriptTypeId;
            if (selectedFilter !== "All") params.status = selectedFilter;

            const res = await axiosInstance.get("/traderecommendation/all", { params });
            return res?.data?.data || [];
        },
        staleTime: 2 * 60 * 1000,
    });
};

/* -------------------- 6. TIMELINE -------------------- */
export const useTimeline = (symbol) => {
    return useQuery({
        queryKey: ['timeline', symbol],
        queryFn: async () => {
            // Logic extracted from StockTimelineScreen.js
            const userId = await AsyncStorage.getItem("userId");
            // ... assuming fetch logic here. 
            // Note: User needs to confirm endpoint in timeline screen
            return [];
        },
        enabled: !!symbol,
        staleTime: 5 * 60 * 1000,
    });
};
