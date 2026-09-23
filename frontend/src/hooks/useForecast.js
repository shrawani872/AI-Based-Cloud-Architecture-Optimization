import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';

/**
 * Hook to fetch predictive capacity & cost forecast with confidence intervals
 * @param {string} [resourceId='global-cloud']
 * @param {string} [horizon='30d'] - '7d' | '30d' | '90d'
 */
export function useForecast(resourceId = 'global-cloud', horizon = '30d') {
  return useQuery({
    queryKey: ['forecasts', resourceId, horizon],
    queryFn: async () => {
      const response = await apiClient.get('/forecasts', {
        params: { resourceId, horizon },
      });
      return response;
    },
    enabled: Boolean(resourceId),
  });
}

/**
 * Mutation hook to trigger recomputation of forecasting models
 */
export function useRecomputeForecast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resourceId, horizon }) => {
      const response = await apiClient.post('/forecast/run', { resourceId, horizon });
      return response;
    },
    retry: false, // Rule: No auto-retry on mutation actions
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}

export default useForecast;
