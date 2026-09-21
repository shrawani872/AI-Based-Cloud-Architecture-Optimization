import { mockDashboardSummary } from './dashboardSummary';
import { generateTelemetrySeries, mockTelemetryResources } from './telemetryMetrics';
import { generateForecastData } from './forecasts';
import { mockAnomalies } from './anomalies';
import { mockRecommendations } from './recommendations';
import { mockHistory } from './history';
import { mockSystemHealth } from './systemHealth';

export const SCENARIOS = {
  normal: {
    id: 'normal',
    name: 'Normal Load',
    badge: 'Optimal',
    description: 'Safe baseline thresholds. Recommendations advise MONITOR / NO_ACTION.',
  },
  traffic_spike: {
    id: 'traffic_spike',
    name: 'Traffic Spike',
    badge: '3x Surge',
    description: 'Surging request traffic (3x). Forecast projects sharp rise. Recommends SCALE_OUT.',
  },
  low_utilization: {
    id: 'low_utilization',
    name: 'Low Utilization',
    badge: 'Idle Capacity',
    description: 'Idle clusters (<15% CPU). Recommends SCALE_IN and rightsizing for immediate cost savings.',
  },
  high_latency: {
    id: 'high_latency',
    name: 'High Latency / Errors',
    badge: 'Critical Incident',
    description: 'p95 latency > 480ms and error surge. Triggers CRITICAL anomalies and INVESTIGATE/SCALE_OUT.',
  },
  ai_unavailable: {
    id: 'ai_unavailable',
    name: 'AI Service Unavailable',
    badge: 'AI 503 Outage',
    description: 'AI model & forecast endpoints fail (503). Dashboard, Telemetry & Anomalies remain fully operational.',
  },
  aws_unavailable: {
    id: 'aws_unavailable',
    name: 'AWS Telemetry Offline',
    badge: 'AWS Outage',
    description: 'AWS CloudWatch stream fails. App-wide stale banner shown; cached telemetry preserved (no fake zeroes).',
  },
};

let currentScenario = 'normal';
const scenarioListeners = new Set();

// In-memory clones
let inMemoryRecommendations = JSON.parse(JSON.stringify(mockRecommendations));
let inMemoryHistory = JSON.parse(JSON.stringify(mockHistory));

// Scenario-specific recommendations
const SCENARIO_RECOMMENDATIONS = {
  normal: [
    {
      id: 'REC-NORM-01',
      title: 'Maintain current EC2 & RDS capacity baseline',
      description: 'Telemetry over the past 30 days demonstrates ideal headroom (32% average CPU, 28ms latency). Automated threshold guards remain active; no rightsizing or intervention needed.',
      service: 'Amazon EC2',
      resourceId: 'i-0a8b9c1d2e3f4g5',
      resourceName: 'prod-api-worker-01',
      category: 'MONITOR',
      actionType: 'NO_ACTION',
      status: 'PENDING',
      riskLevel: 'LOW',
      riskScore: 1,
      confidenceScore: 0.99,
      currentCost: 142.50,
      estimatedCost: 142.50,
      monthlySavings: 0.00,
      annualSavings: 0.00,
      savingsPercent: 0,
      createdAt: new Date().toISOString(),
      architectureDiff: {
        before: { instanceType: 'c5.xlarge', vCPUs: 4, memoryGiB: 8, hourlyRate: '$0.17' },
        after: { instanceType: 'c5.xlarge (Keep)', vCPUs: 4, memoryGiB: 8, hourlyRate: '$0.17' },
      },
      rollbackPlan: 'Continuous monitoring. Rollback not required.',
      aiReasoning: 'All metrics reside within nominal tolerances. Proactive adjustments would introduce operational churn without performance or financial benefit.',
    },
    ...mockRecommendations.slice(0, 2),
  ],
  traffic_spike: [
    {
      id: 'REC-SPIKE-01',
      title: 'Scale out prod-api-worker pool from 4 to 8 instances',
      description: 'Traffic surge detected: request rate spiked 2.8x with p95 latency trending toward SLA limit (85ms). Scaling out 4 c5.xlarge instances absorbs burst traffic smoothly.',
      service: 'Amazon EC2',
      resourceId: 'asg-prod-api-workers',
      resourceName: 'asg-prod-api-cluster',
      category: 'SCALING',
      actionType: 'SCALE_OUT',
      status: 'PENDING',
      riskLevel: 'LOW',
      riskScore: 2,
      confidenceScore: 0.97,
      currentCost: 148.50,
      estimatedCost: 280.00,
      monthlySavings: -131.50,
      annualSavings: -1578.00,
      savingsPercent: -88,
      createdAt: new Date().toISOString(),
      architectureDiff: {
        before: { capacity: '4 nodes', vCPUs: 16, memoryGiB: 32, throughput: '2,400 rps' },
        after: { capacity: '8 nodes', vCPUs: 32, memoryGiB: 64, throughput: '6,800 rps' },
      },
      rollbackPlan: 'Automated scale-in cooldown triggered once CPU drops below 40% for 15 consecutive minutes.',
      aiReasoning: 'Traffic spike model predicts continued elevation for the next 72 hours. Proactive scale-out prevents 504 gateway timeout cascades.',
    },
    ...mockRecommendations,
  ],
  low_utilization: [
    {
      id: 'REC-IDLE-01',
      title: 'Scale in idle analytics worker cluster and downsize to t4g.medium',
      description: 'Over-provisioned idle compute: CPU utilization has not exceeded 12% across 21 consecutive days. Scaling in cluster from 8 to 3 nodes and adopting AWS Graviton cuts monthly spend by 68%.',
      service: 'Amazon EC2',
      resourceId: 'i-idle-analytics-09',
      resourceName: 'analytics-worker-fleet',
      category: 'RIGHTSIZING',
      actionType: 'SCALE_IN',
      status: 'PENDING',
      riskLevel: 'LOW',
      riskScore: 1,
      confidenceScore: 0.98,
      currentCost: 340.00,
      estimatedCost: 108.80,
      monthlySavings: 231.20,
      annualSavings: 2774.40,
      savingsPercent: 68,
      createdAt: new Date().toISOString(),
      architectureDiff: {
        before: { instanceType: 'c5.2xlarge (8 nodes)', vCPUs: 64, memoryGiB: 128, monthlyCost: '$340.00' },
        after: { instanceType: 't4g.medium (3 nodes)', vCPUs: 6, memoryGiB: 12, monthlyCost: '$108.80' },
      },
      rollbackPlan: 'Instant re-provisioning automation document can spin up legacy c5.2xlarge cluster in under 90 seconds.',
      aiReasoning: 'Long-term telemetry confirms substantial over-allocation. Significant cost reduction with zero SLA penalty.',
    },
    ...mockRecommendations,
  ],
  high_latency: [
    {
      id: 'REC-CRIT-01',
      title: 'Urgent: Scale out RDS connection pool & provision read replica',
      description: 'Critical database saturation: connection pool reached 98% capacity causing API gateway p95 latency to breach 480ms. Immediate connection pool expansion and read replica routing required.',
      service: 'Amazon RDS',
      resourceId: 'rds-prod-primary',
      resourceName: 'prod-postgres-db-01',
      category: 'SCALING',
      actionType: 'INVESTIGATE',
      status: 'PENDING',
      riskLevel: 'HIGH',
      riskScore: 9,
      confidenceScore: 0.99,
      currentCost: 240.00,
      estimatedCost: 320.00,
      monthlySavings: -80.00,
      annualSavings: -960.00,
      savingsPercent: -33,
      createdAt: new Date().toISOString(),
      architectureDiff: {
        before: { poolConnections: '50 max (98% full)', readReplicas: 0, p95Latency: '485ms' },
        after: { poolConnections: '200 max', readReplicas: 1, p95Latency: '24ms (projected)' },
      },
      rollbackPlan: 'Revert connection pool limits via RDS parameter group reboot within 3 minutes.',
      aiReasoning: 'Database bottleneck is directly causing customer-facing 504 timeouts. Urgent action required to restore service stability.',
    },
    ...mockRecommendations,
  ],
  ai_unavailable: mockRecommendations,
  aws_unavailable: mockRecommendations,
};

// Scenario-specific anomalies
const SCENARIO_ANOMALIES = {
  normal: [
    {
      id: 'ANOM-NORM-01',
      severity: 'INFO',
      title: 'Scheduled CloudWatch Log Rotation',
      resourceName: 'prod-api-worker-01',
      resourceId: 'i-0a8b9c1d2e3f4g5',
      service: 'Amazon EC2',
      metric: 'Disk IOPS',
      detectedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'RESOLVED',
      state: 'RESOLVED',
      zScore: 1.8,
      rootCause: 'Routine scheduled gzip log compression. Normalized automatically within 2 minutes.',
    },
  ],
  traffic_spike: [
    {
      id: 'ANOM-SPIKE-01',
      severity: 'HIGH',
      title: 'Sudden Inbound Traffic Surge (2.8x baseline)',
      resourceName: 'prod-api-worker-01',
      resourceId: 'i-0a8b9c1d2e3f4g5',
      service: 'Amazon EC2',
      metric: 'Request Rate',
      detectedAt: new Date().toISOString(),
      status: 'ACTIVE',
      state: 'ACTIVE',
      zScore: 3.8,
      recommendedActionId: 'REC-SPIKE-01',
      rootCause: 'Unscheduled viral marketing campaign generating 8,500 req/sec compared to 2,400 normal baseline.',
    },
    ...mockAnomalies.slice(0, 2),
  ],
  low_utilization: [
    {
      id: 'ANOM-IDLE-01',
      severity: 'LOW',
      title: 'Under-utilized Compute Resource Fleet',
      resourceName: 'analytics-worker-fleet',
      resourceId: 'i-idle-analytics-09',
      service: 'Amazon EC2',
      metric: 'CPU Utilization',
      detectedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'ACTIVE',
      state: 'ACTIVE',
      zScore: 2.1,
      recommendedActionId: 'REC-IDLE-01',
      rootCause: 'Fleet allocation exceeds computational demand. Continuous utilization < 12% over 21 days.',
    },
  ],
  high_latency: [
    {
      id: 'ANOM-CRIT-01',
      severity: 'CRITICAL',
      title: 'PostgreSQL Connection Pool Saturation (98%)',
      resourceName: 'prod-postgres-db-01',
      resourceId: 'rds-prod-primary',
      service: 'Amazon RDS',
      metric: 'Database Connections',
      detectedAt: new Date().toISOString(),
      status: 'ACTIVE',
      state: 'ACTIVE',
      zScore: 4.9,
      recommendedActionId: 'REC-CRIT-01',
      rootCause: 'Unindexed query on orders table locking connections, leading to thread pool starvation.',
    },
    {
      id: 'ANOM-HIGH-01',
      severity: 'HIGH',
      title: 'API Gateway p95 Latency Breach (>480ms)',
      resourceName: 'prod-api-worker-01',
      resourceId: 'i-0a8b9c1d2e3f4g5',
      service: 'Amazon EC2',
      metric: 'p95 Latency',
      detectedAt: new Date(Date.now() - 300000).toISOString(),
      status: 'ACTIVE',
      state: 'ACTIVE',
      zScore: 4.1,
      recommendedActionId: 'REC-CRIT-01',
      rootCause: 'Upstream blocking database connections cascading into HTTP 504 timeouts at API gateway.',
    },
    ...mockAnomalies,
  ],
  ai_unavailable: mockAnomalies,
  aws_unavailable: mockAnomalies,
};

export const mockStore = {
  getScenario: () => currentScenario,

  setScenario: (scenarioId) => {
    if (!SCENARIOS[scenarioId]) return;
    currentScenario = scenarioId;

    // Reset in-memory recommendations according to scenario
    const baseRecs = SCENARIO_RECOMMENDATIONS[scenarioId] || mockRecommendations;
    inMemoryRecommendations = JSON.parse(JSON.stringify(baseRecs));

    // Notify all listeners
    scenarioListeners.forEach((fn) => {
      try {
        fn(scenarioId);
      } catch (err) {
        console.error('Scenario listener error:', err);
      }
    });
  },

  subscribeScenario: (fn) => {
    scenarioListeners.add(fn);
    return () => scenarioListeners.delete(fn);
  },

  getDashboardSummary: () => {
    const recs = inMemoryRecommendations;
    const pending = recs.filter((r) => r.status === 'PENDING').length;
    const anomalies = mockStore.getAnomalies();
    const activeCriticalOrHigh = anomalies.filter(
      (a) => (a.severity === 'CRITICAL' || a.severity === 'HIGH') && a.status === 'ACTIVE'
    ).length;

    let base = { ...mockDashboardSummary };

    if (currentScenario === 'normal') {
      base.overallSystemHealth = 'HEALTHY';
      base.systemHealthScore = 99.2;
      base.activeAnomaliesCount = 0;
      base.clusterCpuAverage = 32.4;
      base.clusterMemoryAverage = 38.1;
      base.latencyP95Ms = 28.5;
    } else if (currentScenario === 'traffic_spike') {
      base.overallSystemHealth = 'WARNING';
      base.systemHealthScore = 82.5;
      base.activeAnomaliesCount = 1;
      base.clusterCpuAverage = 88.6;
      base.clusterMemoryAverage = 74.2;
      base.latencyP95Ms = 95.2;
    } else if (currentScenario === 'low_utilization') {
      base.overallSystemHealth = 'HEALTHY';
      base.systemHealthScore = 96.0;
      base.activeAnomaliesCount = 0;
      base.clusterCpuAverage = 11.2;
      base.clusterMemoryAverage = 18.4;
      base.latencyP95Ms = 22.0;
      base.dailySpendActual = 340.00;
    } else if (currentScenario === 'high_latency') {
      base.overallSystemHealth = 'CRITICAL';
      base.systemHealthScore = 58.0;
      base.activeAnomaliesCount = activeCriticalOrHigh || 2;
      base.clusterCpuAverage = 94.2;
      base.clusterMemoryAverage = 88.5;
      base.latencyP95Ms = 485.0;
    }

    return {
      ...base,
      pendingApprovalsCount: pending,
      activeRecommendationsCount: recs.length,
      topRecommendationsPreview: recs.filter((r) => r.status === 'PENDING').slice(0, 3),
    };
  },

  getTelemetryMetrics: (resourceId = 'i-0a8b9c1d2e3f4g5', range = '24h') => {
    const raw = generateTelemetrySeries(resourceId, range);

    if (currentScenario === 'traffic_spike') {
      return raw.map((pt) => ({
        ...pt,
        cpu_utilization: Math.min(100, Math.round(pt.cpu_utilization * 1.8)),
        request_rate: Math.round(pt.request_rate * 2.8),
        p95_latency: Math.round(pt.p95_latency * 1.6),
      }));
    } else if (currentScenario === 'low_utilization') {
      return raw.map((pt) => ({
        ...pt,
        cpu_utilization: Math.max(5, Math.round(pt.cpu_utilization * 0.25)),
        memory_utilization: Math.max(10, Math.round(pt.memory_utilization * 0.3)),
        daily_cost: 340.0,
      }));
    } else if (currentScenario === 'high_latency') {
      return raw.map((pt, idx) => ({
        ...pt,
        cpu_utilization: Math.min(100, Math.round(pt.cpu_utilization * 1.5)),
        p95_latency: idx > raw.length - 8 ? 485 + Math.round(Math.random() * 50) : pt.p95_latency,
        error_rate: idx > raw.length - 8 ? +(8.5 + Math.random()).toFixed(2) : pt.error_rate,
      }));
    }

    return raw;
  },

  getTelemetryResources: () => {
    return mockTelemetryResources;
  },

  getForecast: (resourceId = 'global-cloud', horizon = '30d') => {
    const raw = generateForecastData(resourceId, horizon);

    if (currentScenario === 'traffic_spike') {
      return {
        ...raw,
        trend: 'SHARP_UPWARD',
        historicalMAE: 2.1,
        series: raw.series.map((pt) => ({
          ...pt,
          forecast: pt.forecast !== null ? +(pt.forecast * 1.65).toFixed(2) : null,
          confidenceUpper: pt.confidenceUpper !== null ? +(pt.confidenceUpper * 1.8).toFixed(2) : null,
        })),
      };
    } else if (currentScenario === 'low_utilization') {
      return {
        ...raw,
        trend: 'DECLINING_FLAT',
        series: raw.series.map((pt) => ({
          ...pt,
          forecast: pt.forecast !== null ? +(pt.forecast * 0.45).toFixed(2) : null,
        })),
      };
    }

    return raw;
  },

  getAnomalies: (filters = {}) => {
    const list = SCENARIO_ANOMALIES[currentScenario] || mockAnomalies;
    let result = [...list];

    if (filters.severity && filters.severity !== 'all') {
      result = result.filter((a) => a.severity.toLowerCase() === filters.severity.toLowerCase());
    }
    if (filters.service && filters.service !== 'all') {
      result = result.filter((a) => a.service.toLowerCase().includes(filters.service.toLowerCase()));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.resourceName.toLowerCase().includes(q) ||
          a.resourceId.toLowerCase().includes(q)
      );
    }
    return result;
  },

  getRecommendations: (filters = {}) => {
    let result = [...inMemoryRecommendations];
    if (filters.status && filters.status !== 'all') {
      result = result.filter((r) => r.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.category && filters.category !== 'all') {
      result = result.filter((r) => r.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.resourceName.toLowerCase().includes(q) ||
          r.resourceId.toLowerCase().includes(q)
      );
    }
    return result;
  },

  getRecommendationById: (id) => {
    return inMemoryRecommendations.find((r) => r.id === id) || inMemoryRecommendations[0];
  },

  approveRecommendation: (id, user = 'admin@company.internal') => {
    const itemIndex = inMemoryRecommendations.findIndex((r) => r.id === id);
    if (itemIndex === -1) {
      throw new Error(`Recommendation ${id} not found`);
    }

    const item = inMemoryRecommendations[itemIndex];
    item.status = 'APPROVED';
    item.reviewedAt = new Date().toISOString();
    item.reviewedBy = user;

    // Append to history
    const historyEntry = {
      id: `HIST-${Date.now().toString().slice(-4)}`,
      recommendationId: item.id,
      title: item.title,
      action: 'APPROVED',
      actor: user,
      service: item.service,
      resourceId: item.resourceId,
      monthlySavings: item.monthlySavings,
      executionStatus: 'COMPLETED',
      timestamp: new Date().toISOString(),
      executionDetails: `Human approval confirmed. Applied architecture transformation for ${item.resourceName}.`,
      durationMs: 1650,
    };
    inMemoryHistory.unshift(historyEntry);

    return { success: true, item, historyEntry };
  },

  rejectRecommendation: (id, reason = 'Dismissed by user review', user = 'admin@company.internal') => {
    const itemIndex = inMemoryRecommendations.findIndex((r) => r.id === id);
    if (itemIndex === -1) {
      throw new Error(`Recommendation ${id} not found`);
    }

    const item = inMemoryRecommendations[itemIndex];
    item.status = 'REJECTED';
    item.reviewedAt = new Date().toISOString();
    item.reviewedBy = user;
    item.rejectionReason = reason;

    // Append to history
    const historyEntry = {
      id: `HIST-${Date.now().toString().slice(-4)}`,
      recommendationId: item.id,
      title: item.title,
      action: 'REJECTED',
      actor: user,
      service: item.service,
      resourceId: item.resourceId,
      monthlySavings: item.monthlySavings,
      executionStatus: 'DISMISSED',
      timestamp: new Date().toISOString(),
      executionDetails: `Human review: Rejected. Reason: ${reason}`,
      durationMs: null,
    };
    inMemoryHistory.unshift(historyEntry);

    return { success: true, item, historyEntry };
  },

  getHistory: () => {
    return inMemoryHistory;
  },

  getSystemHealth: () => {
    const base = { ...mockSystemHealth };

    if (currentScenario === 'ai_unavailable') {
      return {
        ...base,
        overallStatus: 'DEGRADED',
        healthScore: 78.5,
        services: base.services.map((s) =>
          s.id === 'ai_service'
            ? { ...s, status: 'DOWN', details: 'Anthropic Claude 3.5 Bedrock endpoint 503 connection timeout' }
            : s
        ),
        lastHealthCheck: new Date().toISOString(),
      };
    } else if (currentScenario === 'aws_unavailable') {
      return {
        ...base,
        overallStatus: 'DEGRADED',
        healthScore: 72.0,
        services: base.services.map((s) =>
          s.id === 'aws_connectivity'
            ? { ...s, status: 'DOWN', details: 'CloudWatch metric stream disconnected (us-east-1 timeout)' }
            : s
        ),
        lastHealthCheck: new Date().toISOString(),
      };
    }

    return {
      ...base,
      lastHealthCheck: new Date().toISOString(),
    };
  },
};

export default mockStore;
