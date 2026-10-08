import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/api';

/**
 * Normalizes backend anomaly schema to frontend UI expectations
 */
const normalizeAnomaly = (item) => {
  if (!item || typeof item !== 'object') return item;
  const details = item.details || {};

  return {
    ...item,
    title: item.title || item.anomalyType,
    zScore: details.zScore !== undefined ? details.zScore : item.score,
    rootCause: details.rootCause || item.rootCause || 'Statistical threshold breach detected.',
    baselineValue: details.baselineValue || item.baselineValue || '—',
    anomalyValue: details.anomalyValue || item.anomalyValue || '—',
    recommendedActionId: details.recommendedActionId || item.recommendedActionId,
    resourceName: item.resourceName || item.resourceId,
    service: item.service || (item.resourceId?.startsWith('vol-') ? 'Amazon EBS' : item.resourceId?.startsWith('i-') ? 'Amazon EC2' : 'AWS'),
  };
};

/**
 * Hook to fetch anomaly detection incident logs with filtering
 * @param {Object} [filters={}] - { severity, service, state, status, search, resourceId }
 */
export function useAnomalies(filters = {}) {
  return useQuery({
    queryKey: ['anomalies', filters],
    queryFn: async () => {
      // Do not send 'all' or empty filter values to the backend
      const params = {};
      if (filters.severity && filters.severity.toLowerCase() !== 'all') {
        params.severity = filters.severity;
      }
      const rawStatus = filters.state || filters.status;
      if (rawStatus && rawStatus.toLowerCase() !== 'all') {
        params.status = rawStatus;
      }
      if (filters.resourceId && filters.resourceId.toLowerCase() !== 'all') {
        params.resourceId = filters.resourceId;
      }

      const response = await apiClient.get('/anomalies', {
        params,
      });

      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      let normalized = list.map(normalizeAnomaly);

      // Client-side filtering for attributes not filtered by backend (service, search)
      if (filters.service && filters.service.toLowerCase() !== 'all') {
        const s = filters.service.toLowerCase();
        normalized = normalized.filter((item) => (item.service || '').toLowerCase().includes(s));
      }

      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        normalized = normalized.filter((item) =>
          (item.title || item.anomalyType || '').toLowerCase().includes(q) ||
          (item.resourceId || '').toLowerCase().includes(q) ||
          (item.resourceName || '').toLowerCase().includes(q) ||
          (item.rootCause || '').toLowerCase().includes(q)
        );
      }

      return normalized;
    },
  });
}

export default useAnomalies;

