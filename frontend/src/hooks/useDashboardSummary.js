import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';

/**
 * Hook to fetch high-level dashboard metrics summary.
 * Polls every 30s, automatically paused when document/tab is hidden.
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/summary');
      return response;
    },
    refetchInterval: 30000, // 30s auto-polling
    refetchIntervalInBackground: false, // pauses when tab is in background
  });
}

export default useDashboardSummary;
