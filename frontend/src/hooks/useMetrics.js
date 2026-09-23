import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';

/**
 * Hook to fetch telemetry metrics for a given resource and range
 * @param {string} [resourceId='i-0a8b9c1d2e3f4g5']
 * @param {string} [range='24h'] - '1h' | '6h' | '24h' | '7d'
 */
export function useMetrics(resourceId = 'i-0a8b9c1d2e3f4g5', range = '24h') {
  return useQuery({
    queryKey: ['telemetry', 'metrics', resourceId, range],
    queryFn: async () => {
      const response = await apiClient.get('/telemetry/metrics', {
        params: { resourceId, range },
      });
      return response;
    },
    enabled: Boolean(resourceId),
  });
}

/**
 * Hook to fetch available telemetry resources list
 */
export function useTelemetryResources() {
  return useQuery({
    queryKey: ['telemetry', 'resources'],
    queryFn: async () => {
      const response = await apiClient.get('/telemetry/resources');
      return response;
    },
  });
}

export default useMetrics;
