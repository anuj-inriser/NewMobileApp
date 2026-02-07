import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axios";

export const useWatchlistStocks = (wishlistId) => {
    const { data: stocks = [], isLoading: loading, isFetching, error, refetch } = useQuery({
        queryKey: ['watchlistStocks', wishlistId],
        queryFn: async () => {
            if (!wishlistId) {
                return [];
            }

            const res = await axiosInstance.get(`/wishlistcontrol/stocks`, {
                params: { wishlist_id: wishlistId },
            });
            const data = res.data?.data || [];

            // Map to consistent stock object format
            const formatted = data.map(item => ({
                ...item,
                id: item.id || item.content_id || Math.random(),
                token: item.token || item.script_id,
                symbol: item.script_symbol || item.symbol || String(item.script_id),
                name: item.name || item.script_name,
                price: Number(item.ltp || item.last_price || item.value || 0),
                ltp: Number(item.ltp || item.last_price || item.value || 0),
                change: Number(item.change || 0),
                changePercent: Number(item.changePercent || item.percent_change || 0),
                analysis: item.news_description || item.description || "",
                news_title: item.news_title || "",
                news_date: item.news_date,
                news_items: item.news_items || []
            }));

            return formatted;
        },
        enabled: !!wishlistId,
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    return { 
        stocks, 
        loading, 
        error: error?.message || null, 
        refetch 
    };
};
