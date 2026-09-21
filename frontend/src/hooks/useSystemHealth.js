import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';

/**
 * Hook to fetch system health, model latency, and worker heartbeats
 */
export function useSystemHealth() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      const response = await apiClient.get('/system/health');
      return response;
    },
    refetchInterval: 30000, // Background health polling every 30s (spec: 30–60s)
  });
}

/**
 * Hook to fetch audit history log
 */
export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const response = await apiClient.get('/history');
      return response;
    },
  });
}

export default useSystemHealth;
