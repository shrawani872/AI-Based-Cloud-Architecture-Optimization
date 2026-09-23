import axios from 'axios';
import { mockStore } from './mockData';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Standardized API client
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Helper to simulate realistic network delay (300-600ms)
 */
const simulateLatency = (min = 300, max = 600) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// If USE_MOCK is true, intercept requests and return mock data directly
if (USE_MOCK) {
  apiClient.interceptors.request.use(async (config) => {
    // Custom mock adapter using adapter pattern
    config.adapter = async (cfg) => {
      await simulateLatency(300, 600);

      const url = cfg.url || '';
      const method = (cfg.method || 'get').toLowerCase();
      const params = cfg.params || {};
      const data = typeof cfg.data === 'string' ? JSON.parse(cfg.data || '{}') : cfg.data || {};

      const scenario = mockStore.getScenario();

      // Scenario simulation: e. AI Unavailable
      if (
        scenario === 'ai_unavailable' &&
        (url.includes('/forecast') || url.includes('/recommendations'))
      ) {
        return Promise.reject({
          response: {
            status: 503,
            data: {
              status: 503,
              code: 'AI_SERVICE_UNAVAILABLE',
              message: 'AI Decision Engine & Forecasting service temporarily unavailable (Bedrock endpoint timeout).',
            },
          },
        });
      }

      // Scenario simulation: f. AWS Unavailable
      if (
        scenario === 'aws_unavailable' &&
        url.includes('/telemetry')
      ) {
        return Promise.reject({
          response: {
            status: 503,
            data: {
              status: 503,
              code: 'AWS_UNAVAILABLE',
              message: 'AWS CloudWatch Stream connection lost. Telemetry polling failed.',
            },
          },
        });
      }

      try {
        // --- 1. Dashboard ---
        if (url.includes('/dashboard/summary') && method === 'get') {
          return {
            data: mockStore.getDashboardSummary(),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }

        // --- 2. Telemetry ---
        if (url.includes('/telemetry/metrics') && method === 'get') {
          const resId = params.resourceId || 'i-0a8b9c1d2e3f4g5';
          const range = params.range || '24h';
          return {
            data: mockStore.getTelemetryMetrics(resId, range),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }

        if (url.includes('/telemetry/resources') && method === 'get') {
          return {
            data: mockStore.getTelemetryResources(),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }

        // --- 3. Forecasts ---
        if (url.includes('/forecast') && method === 'post') {
          // Recompute forecast simulation
          return {
            data: {
              success: true,
              message: 'Forecast models recomputed successfully against latest CloudWatch telemetry baseline.',
              timestamp: new Date().toISOString(),
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }

        if (url.includes('/forecasts') && method === 'get') {
          const resId = params.resourceId || 'global-cloud';
          const horizon = params.horizon || '30d';
          return {
            data: mockStore.getForecast(resId, horizon),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }


        // --- 4. Anomalies ---
        if (url.includes('/anomalies') && method === 'get') {
          return {
            data: mockStore.getAnomalies(params),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }

        // --- 5. Recommendations ---
        // Match POST /recommendations/:id/approve
        const approveMatch = url.match(/\/recommendations\/([^/]+)\/approve/);
        if (approveMatch && method === 'post') {
          const id = approveMatch[1];
          const result = mockStore.approveRecommendation(id, data.user);
          return {
            data: result,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }

        // Match POST /recommendations/:id/reject
        const rejectMatch = url.match(/\/recommendations\/([^/]+)\/reject/);
        if (rejectMatch && method === 'post') {
          const id = rejectMatch[1];
          const result = mockStore.rejectRecommendation(id, data.reason, data.user);
          return {
            data: result,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }

        // Match GET /recommendations/:id
        const singleRecMatch = url.match(/\/recommendations\/([^/?]+)$/);
        if (singleRecMatch && method === 'get') {
          const id = singleRecMatch[1];
          return {
            data: mockStore.getRecommendationById(id),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }

        // Match GET /recommendations
        if (url.includes('/recommendations') && method === 'get') {
          return {
            data: mockStore.getRecommendations(params),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }

        // --- 6. History ---
        if (url.includes('/history') && method === 'get') {
          return {
            data: mockStore.getHistory(),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }

        // --- 7. System Health ---
        if (url.includes('/system/health') && method === 'get') {
          return {
            data: mockStore.getSystemHealth(),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        }

        // Fallback default
        return {
          data: { message: 'Mock endpoint response', timestamp: new Date().toISOString() },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: cfg,
        };
      } catch (err) {
        return Promise.reject({
          response: {
            status: 400,
            data: { message: err.message || 'Mock operation failed' },
          },
        });
      }
    };

    return config;
  });
}

/**
 * Normalized error interceptor
 * Standardizes 401/403/404/409/422/500/503 into structured error envelopes
 */
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status || 500;
    const data = error.response?.data;

    const errorCodes = {
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };

    const formattedError = {
      status,
      code: data?.code || errorCodes[status] || 'UNKNOWN_ERROR',
      message: data?.message || error.message || 'An unexpected server error occurred',
      details: data?.details || null,
    };

    return Promise.reject(formattedError);
  }
);

export default apiClient;
