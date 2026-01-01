import { useState, useCallback } from 'react';
import axios from 'axios';
import { apiUrl } from '../utils/apiUrl';

export const useUserLikes = () => {
    const [userLikes, setUserLikes] = useState({}); // Map of content_id -> { id, like_dislike }
    const [loading, setLoading] = useState(false);

    const fetchUserLikes = useCallback(async (userId) => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/api/likesdislikes/user/${userId}`);
            if (response.data && Array.isArray(response.data.data)) {
                // Transform array to map for O(1) lookup
                // content_id -> { id: like_id, type: boolean }
                const likesMap = {};
                response.data.data.forEach(item => {
                    const type = item.content_type || 'post';
                    const key = `${type}_${item.content_id}`;
                    likesMap[key] = {
                        id: item.id,
                        isLiked: item.like_dislike === true,
                        isDisliked: item.like_dislike === false
                    };
                });
                setUserLikes(likesMap);
            }
        } catch (error) {
            console.error('Error fetching user likes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return { userLikes, fetchUserLikes, loading };
};
