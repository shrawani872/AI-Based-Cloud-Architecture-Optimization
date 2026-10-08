import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';

const METRIC_NAME_MAP = {
  CPUUtilization: 'cpuUtilization',
  MemoryUtilization: 'memoryUtilization',
  RequestRate: 'requestRate',
  P95Latency: 'p95Latency',
  Latency: 'p95Latency',
  ErrorRate: 'errorRate',
  NetworkIn: 'networkIn',
  NetworkOut: 'networkOut',
  CostRate: 'costRate',
};

/**
 * Helper to ensure live AwsMetric data points provide metric keys expected by chart components
 */
const normalizeTelemetryMetrics = (response) => {
  if (!response || !Array.isArray(response.data)) return response;

  const normalizedPoints = response.data.map((point) => {
    if (!point.metricName && (point.cpuUtilization !== undefined || point.memoryUtilization !== undefined)) {
      return point;
    }

    const metricKey = METRIC_NAME_MAP[point.metricName] ||
      (point.metricName ? point.metricName.charAt(0).toLowerCase() + point.metricName.slice(1) : null);

    return {
      ...point,
      ...(metricKey && point.metricValue !== undefined ? { [metricKey]: point.metricValue } : {}),
    };
  });

  return {
    ...response,
    data: normalizedPoints,
  };
};

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
      return normalizeTelemetryMetrics(response);
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
