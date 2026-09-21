import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api';

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
      return response;
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
      return response;
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
