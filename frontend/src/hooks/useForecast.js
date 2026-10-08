import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';

/**
 * Helper to convert horizon duration string (e.g. '30d') to numeric hours for backend
 */
const parseHorizonHours = (h) => {
  if (typeof h === 'number') return h;
  if (typeof h === 'string') {
    if (h.endsWith('d')) {
      const days = parseInt(h, 10);
      return !isNaN(days) ? days * 24 : 24;
    }
    const num = parseInt(h, 10);
    return !isNaN(num) ? num : 24;
  }
  return 24;
};

/**
 * Transform backend /forecasts records directly into UI-consumable shape
 * without fabricating mock actuals, models, or optimization multipliers.
 */
const normalizeForecastData = (response, resourceId, horizon) => {
  if (!response) return response;
  if (response.series && !Array.isArray(response)) return response;

  const list = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];

  const series = list.map((item) => ({
    id: item.id,
    resourceId: item.resourceId,
    targetMetric: item.targetMetric,
    date: item.forecastDate ? new Date(item.forecastDate).toISOString().split('T')[0] : 'Forecast',
    predictedCost: item.forecastValue,
    forecast: item.forecastValue,
    upperBoundCost: item.confidenceMax ?? item.forecastValue,
    lowerBoundCost: item.confidenceMin ?? item.forecastValue,
    ...(item.actualCost !== undefined ? { actualCost: item.actualCost } : {}),
    ...(item.optimizedCost !== undefined ? { optimizedCost: item.optimizedCost } : {}),
  }));

  // Derive latest telemetry freshness timestamp from real backend record
  const latestCreatedAt = list.find((item) => item.createdAt)?.createdAt;

  // Derive forecasted spend from targetMetric === 'MonthlySpend' if returned by backend
  const spendRecord = list.find((item) => item.targetMetric === 'MonthlySpend');
  const forecastedUnoptimizedSpend = spendRecord ? spendRecord.forecastValue : undefined;

  const summary = {
    forecastedUnoptimizedSpend,
  };

  return {
    resourceId,
    horizon,
    telemetryFreshness: latestCreatedAt,
    summary,
    series,
  };
};

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
      return normalizeForecastData(response, resourceId, horizon);
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
      const numericHorizon = parseHorizonHours(horizon);
      const targetResourceId = (!resourceId || resourceId === 'global-cloud') ? 'i-0a8b9c1d2e3f4g5' : resourceId;
      const response = await apiClient.post('/forecast', {
        resourceId: targetResourceId,
        horizon: numericHorizon,
      });
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
