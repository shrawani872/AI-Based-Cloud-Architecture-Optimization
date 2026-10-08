import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';

/**
 * Helper to normalize backend recommendation schema to frontend UI expectations
 */
const normalizeRecommendation = (rec) => {
  if (!rec || typeof rec !== 'object') return rec;
  return {
    ...rec,
    service: rec.service || rec.serviceName,
    category: rec.category || rec.recommendationType,
    monthlySavings: rec.monthlySavings !== undefined ? rec.monthlySavings : rec.potentialSavings,
    status: rec.status === 'ACTIVE' ? 'PENDING' : rec.status,
    riskLevel: rec.riskLevel || 'LOW',
  };
};

/**
 * Hook to fetch filtered AI recommendations list
 * @param {Object} [filters={}] - { status, category, search }
 */
export function useRecommendations(filters = {}) {
  return useQuery({
    queryKey: ['recommendations', filters],
    queryFn: async () => {
      const response = await apiClient.get('/recommendations', {
        params: filters,
      });
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];
      return list.map(normalizeRecommendation);
    },
  });
}

/**
 * Hook to fetch a single recommendation detail by ID
 * @param {string} id - Recommendation ID (e.g. 'REC-001')
 */
export function useRecommendation(id) {
  return useQuery({
    queryKey: ['recommendations', id],
    queryFn: async () => {
      const response = await apiClient.get(`/recommendations/${id}`);
      const item = response?.data && !Array.isArray(response.data) ? response.data : response;
      return normalizeRecommendation(item);
    },
    enabled: Boolean(id),
  });
}

/**
 * Mutation hook to explicitly approve an AI recommendation.
 * Enforces retry:false and invalidates relevant queries on success.
 */
export function useApproveRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, user = 'admin@company.internal' }) => {
      const response = await apiClient.post(`/recommendations/${id}/approve`, { user });
      return response;
    },
    retry: false, // Rule: No auto-retry on POST /approve
    onSuccess: () => {
      // Invalidate all dependent views
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

/**
 * Mutation hook to explicitly reject an AI recommendation with reason.
 * Enforces retry:false and invalidates relevant queries on success.
 */
export function useRejectRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason = 'Dismissed by human reviewer', user = 'admin@company.internal' }) => {
      const response = await apiClient.post(`/recommendations/${id}/reject`, { reason, user });
      return response;
    },
    retry: false, // Rule: No auto-retry on POST /reject
    onSuccess: () => {
      // Invalidate all dependent views
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export default useRecommendations;
