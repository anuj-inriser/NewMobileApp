import { useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiUrl';

export function useCommunityPosts(sequenceId) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPosts = async () => {
        if (!sequenceId) return;

        setLoading(true);
        setError(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${apiUrl}/api/communitypost/sequence/${sequenceId}`, {
                signal: controller.signal,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Error fetching posts: ${response.statusText}`);
            }

            const result = await response.json();

            if (result && Array.isArray(result.data)) {
                setPosts(result.data);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            setError(err.message || 'Unknown error');
            console.error('Failed to fetch sequence posts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [sequenceId]);

    return { posts, loading, error, refetch: fetchPosts };
}
