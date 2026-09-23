import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';

/**
 * Hook to fetch anomaly detection incident logs with filtering
 * @param {Object} [filters={}] - { severity, service, search }
 */
export function useAnomalies(filters = {}) {
  return useQuery({
    queryKey: ['anomalies', filters],
    queryFn: async () => {
      const response = await apiClient.get('/anomalies', {
        params: filters,
      });
      return response;
    },
  });
}

export default useAnomalies;
