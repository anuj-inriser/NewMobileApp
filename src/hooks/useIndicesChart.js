import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../utils/apiUrl';

export const useIndicesChart = (symbol, interval = '5m', limit = 100) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!symbol) return;

        try {
            // Call the new specific API
            // Note: interval is hardcoded to 5m in backend query, but keeping arg for future
            const response = await fetch(
                `${apiUrl}/api/indices/chart?symbol=${encodeURIComponent(symbol)}&limit=${limit}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setData({
                    candles: result.data || [],
                    ltp: result.data.length > 0 ? result.data[0].close : 0
                });
            } else {
                throw new Error(result.message || 'Failed to fetch data');
            }
        } catch (err) {
            console.error('[useIndicesChart] Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [symbol, limit]);

    useEffect(() => {
        fetchData();

        // Optional: Poll every minute
        const intervalId = setInterval(fetchData, 60000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};
