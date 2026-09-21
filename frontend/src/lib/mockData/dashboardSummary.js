/**
 * Mock data for Dashboard Summary overview
 */
export const mockDashboardSummary = {
  monthlySpend: 28450.00,
  spendChangePercent: -4.2, // -4.2% vs last month
  projectedMonthlySpend: 22100.00,
  potentialMonthlySavings: 6350.00,
  savingsPercent: 22.3,
  activeRecommendationsCount: 14,
  pendingApprovalsCount: 5,
  anomalies24hCount: 3,
  criticalAnomaliesCount: 1,
  systemHealthScore: 98.4,
  evaluatedResourcesCount: 142,
  optimizedResourcesCount: 86,
  breakdownByService: [
    { service: 'Amazon EC2', currentCost: 14200.00, potentialSavings: 3800.00, percent: 50 },
    { service: 'Amazon RDS', currentCost: 6800.00, potentialSavings: 1250.00, percent: 24 },
    { service: 'Amazon EBS', currentCost: 3900.00, potentialSavings: 850.00, percent: 14 },
    { service: 'AWS Lambda', currentCost: 1950.00, potentialSavings: 320.00, percent: 7 },
    { service: 'Amazon S3', currentCost: 1600.00, potentialSavings: 130.00, percent: 5 },
  ],
  topRecommendationsPreview: [
    {
      id: 'REC-001',
      title: 'Downsize over-provisioned EC2 worker cluster',
      service: 'EC2',
      resourceId: 'i-0a8b9c1d2e3f4g5',
      resourceName: 'prod-api-worker-01',
      monthlySavings: 840.00,
      riskLevel: 'LOW',
      riskScore: 2,
      category: 'RIGHTSIZING',
      status: 'PENDING',
    },
    {
      id: 'REC-002',
      title: 'Migrate EBS io2 volumes to gp3 with customized IOPS',
      service: 'EBS',
      resourceId: 'vol-0123456789abcdef0',
      resourceName: 'analytics-primary-storage',
      monthlySavings: 620.00,
      riskLevel: 'LOW',
      riskScore: 1,
      category: 'STORAGE_TIER',
      status: 'PENDING',
    },
    {
      id: 'REC-003',
      title: 'Enable Graviton3 instance family on customer Aurora cluster',
      service: 'RDS',
      resourceId: 'rds-prod-primary-01',
      resourceName: 'customer-aurora-cluster',
      monthlySavings: 1150.00,
      riskLevel: 'MEDIUM',
      riskScore: 5,
      category: 'ARCH_MODERNIZATION',
      status: 'PENDING',
    },
  ],
  lastTelemetrySync: new Date(Date.now() - 45 * 1000).toISOString(),
};

export default mockDashboardSummary;
