/**
 * Helper to generate forecast time-series data with confidence bands and model metadata
 */
export function generateForecastData(resourceId = 'global-cloud', horizon = '30d') {
  // If resource has insufficient telemetry (< 7 days)
  if (resourceId === 'res-new-insufficient-history') {
    return {
      resourceId,
      horizon,
      hasInsufficientHistory: true,
      minHistoryRequiredDays: 7,
      actualHistoryDays: 2,
      series: [],
    };
  }

  const days = horizon === '7d' ? 7 : horizon === '30d' ? 30 : 90;
  const historyDays = 14;
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  const series = [];

  // 1. Past 14 days historical actuals
  for (let i = historyDays; i >= 1; i--) {
    const timestamp = new Date(now - i * dayMs).toISOString().split('T')[0];
    const actualSpend = Math.round(920 + Math.sin((14 - i) * 0.4) * 80 + (Math.random() - 0.5) * 30);
    const actualCpu = Math.round(38 + Math.sin((14 - i) * 0.4) * 6 + (Math.random() - 0.5) * 4);

    series.push({
      date: timestamp,
      isForecast: false,
      actualCost: actualSpend,
      actualCpu,
      predictedCost: null,
      lowerBoundCost: null,
      upperBoundCost: null,
      optimizedCost: null,
    });
  }

  // Today (bridge point)
  const todayStr = new Date(now).toISOString().split('T')[0];
  const currentCost = 950;
  series.push({
    date: todayStr,
    isForecast: false,
    actualCost: currentCost,
    actualCpu: 40,
    predictedCost: currentCost,
    lowerBoundCost: currentCost,
    upperBoundCost: currentCost,
    optimizedCost: currentCost,
  });

  // 2. Future days predicted forecast with expanding uncertainty confidence band
  for (let i = 1; i <= days; i++) {
    const timestamp = new Date(now + i * dayMs).toISOString().split('T')[0];
    const trendGrowth = i * 4.2; // Baseline trend
    const basePrediction = Math.round(currentCost + trendGrowth + Math.sin(i * 0.3) * 60);

    // Uncertainty band widens into future (95% CI)
    const uncertainty = Math.round(18 + i * 4.5);
    const lower = Math.max(500, basePrediction - uncertainty);
    const upper = basePrediction + uncertainty;

    // Projected cost if AI recommendations are applied
    const optimized = Math.round(basePrediction * 0.78); // 22% reduction

    series.push({
      date: timestamp,
      isForecast: true,
      actualCost: null,
      actualCpu: null,
      predictedCost: basePrediction,
      lowerBoundCost: lower,
      upperBoundCost: upper,
      optimizedCost: optimized,
    });
  }

  return {
    resourceId,
    horizon,
    hasInsufficientHistory: false,
    modelName: 'Prophet-LSTM Hybrid',
    modelVersion: 'v2.4.1 (Production)',
    confidenceInterval: '95% (Multi-variate ARIMA)',
    telemetryFreshness: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6m ago
    accuracyMetrics: {
      mae: '$18.40',
      rmse: '$24.60',
      mape: '3.8%',
      r2Score: '0.94',
    },
    summary: {
      currentMonthlySpend: 28450.00,
      forecastedUnoptimizedSpend: Math.round(28450 * (1 + days * 0.004)),
      forecastedOptimizedSpend: Math.round(28450 * (1 + days * 0.004) * 0.78),
      projectedNetSavings: Math.round(28450 * (1 + days * 0.004) * 0.22),
      confidenceScore: 0.94,
    },
    series,
  };
}

export const mockForecastResources = [
  { id: 'global-cloud', name: 'Global Cloud Architecture (All Services)', service: 'Multi-Service' },
  { id: 'i-0a8b9c1d2e3f4g5', name: 'prod-api-worker-01', service: 'Amazon EC2' },
  { id: 'rds-prod-primary-01', name: 'customer-aurora-cluster', service: 'Amazon RDS' },
  { id: 'vol-0123456789abcdef0', name: 'analytics-primary-storage', service: 'Amazon EBS' },
  { id: 'fn-payment-processor', name: 'payment-webhook-handler', service: 'AWS Lambda' },
  { id: 'res-new-insufficient-history', name: 'new-k8s-ingress-gateway (Insufficient Data)', service: 'Amazon EKS' },
];

export default generateForecastData;
