import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache data for 5 minutes by default
            staleTime: 1000 * 60 * 5,
            // Retry failed requests twice
            retry: 2,
        },
    },
});
