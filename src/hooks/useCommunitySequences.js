import { useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiUrl';

const cache = {
    data: null,
    timestamp: 0,
};

const CACHE_DURATION = 60 * 1000; // 1 minute

export function useCommunitySequences() {
    const [data, setData] = useState(cache.data);
    const [loading, setLoading] = useState(!cache.data);
    const [error, setError] = useState(null);

    const fetchSequences = async (force = false) => {
        // Use cache if valid
        if (!force && cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
            setData(cache.data);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(`${apiUrl}/api/communitysequence/community-sequences`, {
                signal: controller.signal,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Error fetching sequences: ${response.statusText}`);
            }

            const result = await response.json();

            if (result && Array.isArray(result.data)) {
                // Update cache
                cache.data = result.data;
                cache.timestamp = Date.now();
                setData(result.data);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            setError(err.message || 'Unknown error');
            console.error('Failed to fetch community sequences:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSequences();
    }, []);

    const refetch = () => fetchSequences(true);

    return { sequences: data, loading, error, refetch };
}
