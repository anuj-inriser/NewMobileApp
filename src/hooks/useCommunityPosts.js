import { useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiUrl';
import axios from 'axios';

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
                // 🔥 Fetch fresh stats for these posts
                let mergedPosts = result.data;
                try {
                    const items = result.data.map(p => ({ id: p.content_id, type: 'post' }));
                    if (items.length > 0) {
                        const statsRes = await axios.post(`${apiUrl}/api/likesdislikes/stats`, { items });
                        const statsMap = statsRes.data.data || {};

                        mergedPosts = result.data.map(p => {
                            const key = `post_${p.content_id}`;
                            const stat = statsMap[key];
                            if (stat) {
                                return {
                                    ...p,
                                    likes_count: stat.likes,
                                    dislikes_count: stat.dislikes
                                    // comments_count might not be in this stats endpoint, preserved from original
                                };
                            }
                            return p;
                        });
                        console.log('✅ Merged fresh stats for', items.length, 'posts');
                    }
                } catch (statsErr) {
                    console.error("❌ Failed to fetch fresh stats:", statsErr);
                    // Fallback to original data if stats fetch fails
                }

                setPosts(mergedPosts);
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
