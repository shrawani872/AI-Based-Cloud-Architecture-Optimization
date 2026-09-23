/**
 * Helper to generate time series data points for telemetry with all requested metrics and anomaly markers
 */
export function generateTelemetrySeries(resourceId = 'i-0a8b9c1d2e3f4g5', range = '24h') {
  const pointsCount = range === '1h' ? 24 : range === '6h' ? 48 : range === '24h' ? 72 : 112;
  const now = Date.now();
  const rangeMs =
    range === '1h'
      ? 3600 * 1000
      : range === '6h'
      ? 6 * 3600 * 1000
      : range === '24h'
      ? 24 * 3600 * 1000
      : 7 * 24 * 3600 * 1000;

  const step = rangeMs / pointsCount;
  const data = [];

  for (let i = 0; i <= pointsCount; i++) {
    const timestamp = new Date(now - rangeMs + i * step).toISOString();
    const progress = i / pointsCount;
    // Diurnal sine wave simulation with noise
    const sine = Math.sin(progress * Math.PI * 4);
    const noise = (Math.random() - 0.5) * 5;

    // Check if point is an injected anomaly point (e.g. at 65% of timeline)
    const isAnomalyPoint = i === Math.floor(pointsCount * 0.65) || (range === '7d' && i === Math.floor(pointsCount * 0.3));

    // 1. CPU Utilization (%)
    let cpu = Math.max(5, Math.min(95, Math.round(28 + sine * 14 + noise)));
    if (isAnomalyPoint) cpu = 94; // Anomaly spike

    // 2. Memory Utilization (%)
    let memory = Math.max(10, Math.min(90, Math.round(44 + sine * 8 + (Math.random() - 0.5) * 3)));
    if (isAnomalyPoint) memory = 88;

    // 3. Request Rate (req/s)
    let requestRate = Math.max(120, Math.round(1400 + sine * 600 + Math.random() * 150));
    if (isAnomalyPoint) requestRate = 3200;

    // 4. p95 Latency (ms)
    let p95Latency = Math.max(1.2, Number((4.2 + Math.sin(progress * Math.PI * 2) * 1.5 + (Math.random() - 0.5) * 0.6).toFixed(2)));
    if (isAnomalyPoint) p95Latency = 18.4;

    // 5. Error Rate (%)
    let errorRate = Number((0.08 + Math.random() * 0.12).toFixed(2));
    if (isAnomalyPoint) errorRate = 4.8; // Error spike

    // 6. Network Traffic (KB/s)
    const networkIn = Math.max(100, Math.round(1250 + sine * 550 + Math.random() * 200));
    const networkOut = Math.max(80, Math.round(980 + sine * 420 + Math.random() * 150));

    // 7. Daily Cost rate ($/day)
    const costRate = Number((24.8 + Math.sin(progress * Math.PI * 2) * 2.5 + (isAnomalyPoint ? 12 : 0)).toFixed(2));

    data.push({
      timestamp,
      cpuUtilization: cpu,
      memoryUtilization: memory,
      requestRate,
      p95Latency,
      errorRate,
      networkIn,
      networkOut,
      costRate,
      isAnomaly: isAnomalyPoint,
      anomalyReason: isAnomalyPoint ? 'Sudden IOPS & Latency Breach' : null,
      anomalySeverity: isAnomalyPoint ? 'CRITICAL' : null,
    });
  }

  return {
    resourceId,
    range,
    data,
    summary: {
      avgCpu: Math.round(data.reduce((acc, p) => acc + p.cpuUtilization, 0) / data.length),
      maxCpu: Math.max(...data.map((p) => p.cpuUtilization)),
      avgMemory: Math.round(data.reduce((acc, p) => acc + p.memoryUtilization, 0) / data.length),
      maxMemory: Math.max(...data.map((p) => p.memoryUtilization)),
      avgRequestRate: Math.round(data.reduce((acc, p) => acc + p.requestRate, 0) / data.length),
      p95Latency: 4.8,
      avgErrorRate: Number((data.reduce((acc, p) => acc + p.errorRate, 0) / data.length).toFixed(2)),
      totalNetworkIn: Math.round(data.reduce((acc, p) => acc + p.networkIn, 0)),
      totalNetworkOut: Math.round(data.reduce((acc, p) => acc + p.networkOut, 0)),
      currentCostRate: data[data.length - 1]?.costRate || 24.8,
    },
  };
}

export const mockTelemetryResources = [
  {
    id: 'i-0a8b9c1d2e3f4g5',
    name: 'prod-api-worker-01',
    service: 'Amazon EC2',
    instanceType: 'c5.2xlarge',
    region: 'us-east-1',
    status: 'WARNING',
    costMonthly: '$148.50',
  },
  {
    id: 'rds-prod-primary-01',
    name: 'customer-aurora-cluster',
    service: 'Amazon RDS',
    instanceType: 'db.r5.2xlarge',
    region: 'us-east-1',
    status: 'HEALTHY',
    costMonthly: '$680.00',
  },
  {
    id: 'vol-0123456789abcdef0',
    name: 'analytics-primary-storage',
    service: 'Amazon EBS',
    instanceType: 'io2 (5000 IOPS)',
    region: 'us-east-1',
    status: 'CRITICAL',
    costMonthly: '$320.00',
  },
  {
    id: 'fn-payment-processor',
    name: 'payment-webhook-handler',
    service: 'AWS Lambda',
    instanceType: '1024MB ARM64',
    region: 'us-east-1',
    status: 'OPTIMIZED',
    costMonthly: '$34.20',
  },
  {
    id: 'tbl-user-sessions',
    name: 'user-sessions-dynamodb',
    service: 'Amazon DynamoDB',
    instanceType: 'On-Demand Capacity',
    region: 'us-east-1',
    status: 'HEALTHY',
    costMonthly: '$82.50',
  },
];

export const METRIC_OPTIONS = [
  { value: 'cpuUtilization', label: 'CPU Utilization (%)', unit: '%', threshold: 80, color: 'var(--accent)' },
  { value: 'memoryUtilization', label: 'Memory Utilization (%)', unit: '%', threshold: 85, color: 'var(--info)' },
  { value: 'requestRate', label: 'Request Rate (req/s)', unit: 'req/s', threshold: 2500, color: 'var(--warning)' },
  { value: 'p95Latency', label: 'p95 Latency (ms)', unit: 'ms', threshold: 12, color: 'var(--critical)' },
  { value: 'errorRate', label: 'Error Rate (%)', unit: '%', threshold: 2.0, color: 'var(--critical)' },
  { value: 'networkTraffic', label: 'Network In / Out (KB/s)', unit: 'KB/s', threshold: 2000, color: 'var(--accent)' },
  { value: 'costRate', label: 'Daily Cost Rate ($/day)', unit: '$/day', threshold: 35, color: 'var(--success)' },
];

export default generateTelemetrySeries;
