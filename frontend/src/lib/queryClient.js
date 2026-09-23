import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Do not retry 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2; // retry: 2 for GET
      },
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: false, // pauses polling when document/tab is hidden
    },
    mutations: {
      retry: false, // strictly enforce retry:false on all mutations (approvals/rejections)
    },
  },
});

export default queryClient;
