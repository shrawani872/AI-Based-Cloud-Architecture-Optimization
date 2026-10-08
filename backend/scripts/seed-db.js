const prisma = require('../src/config/db');

async function seedDatabase() {
  console.log('Seeding cloud_optimizer database with initial metrics, anomalies, forecasts, and recommendations...');

  // 1. Seed AwsMetrics
  const now = new Date();
  // Realistic 24-hour CPU utilization profile (chronological: 23 hours ago to current hour)
  // Models quiet overnight hours, a scheduled batch processing spike, morning ramp-up,
  // peak afternoon business operations, and an evening taper down to steady baseline.
  const realisticBaseProfiles = [
    16.4, 18.2, 14.8, 51.7, 19.3, 17.5, // 23h-18h ago: overnight with a scheduled batch job spike
    23.8, 31.4, 42.6, 48.1, 44.5, 52.3, // 17h-12h ago: morning ramp-up & start of business hours
    59.1, 46.8, 54.2, 63.7, 49.6, 43.2, // 11h-6h ago: peak midday operations with natural variance
    58.4, 47.9, 38.6, 32.1, 26.5, 23.4  // 5h-0h ago: evening tapering down to steady baseline
  ];

  const metrics = [];
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - i * 3600 * 1000);
    const chronologicalIndex = 23 - i;
    const base = realisticBaseProfiles[chronologicalIndex];
    const jitter = Number(((Math.random() * 3.2) - 1.6).toFixed(2));
    const metricValue = Number(Math.max(5, Math.min(95, base + jitter)).toFixed(2));

    metrics.push({
      id: `METRIC-2026-${i}`,
      instanceId: 'i-0a8b9c1d2e3f4g5',
      service: 'Amazon EC2',
      region: 'us-east-1',
      metricName: 'CPUUtilization',
      metricValue,
      unit: 'Percent',
      timestamp,
      metadata: { instanceType: 'c5.2xlarge', status: 'HEALTHY' }
    });
  }

  await prisma.awsMetric.deleteMany({
    where: {
      id: {
        startsWith: 'METRIC-2026-'
      }
    }
  });

  await prisma.awsMetric.createMany({
    data: metrics,
    skipDuplicates: true
  });

  // 2. Seed Anomalies
  await prisma.anomaly.createMany({
    data: [
      {
        id: 'ANOM-2026-001',
        resourceId: 'vol-0123456789abcdef0',
        anomalyType: 'EBS Provisioned IOPS Cost Surge',
        severity: 'CRITICAL',
        score: 4.8,
        status: 'ACTIVE',
        detectedAt: new Date(now.getTime() - 25 * 60 * 1000),
        details: {
          zScore: 4.8,
          baselineValue: '500 IOPS / $80/mo',
          anomalyValue: '5,000 IOPS / $320/mo',
          rootCause: 'Batch pipeline script left volume modified at max IOPS tier.',
          recommendedActionId: 'REC-002'
        }
      },
      {
        id: 'ANOM-2026-002',
        resourceId: 'i-0a8b9c1d2e3f4g5',
        anomalyType: 'Abnormal CPU Throttling',
        severity: 'HIGH',
        score: 3.6,
        status: 'ACTIVE',
        detectedAt: new Date(now.getTime() - 2 * 3600 * 1000),
        details: {
          zScore: 3.6,
          baselineValue: '18% CPU Utilization',
          anomalyValue: '94% CPU Utilization',
          rootCause: 'Memory leak triggered GC loop.',
          recommendedActionId: 'REC-001'
        }
      }
    ],
    skipDuplicates: true
  });

  // 3. Seed Forecasts
  await prisma.forecast.createMany({
    data: [
      {
        id: 'FC-001',
        resourceId: 'global-cloud',
        targetMetric: 'MonthlySpend',
        forecastValue: 28450.00,
        confidenceMin: 26000.00,
        confidenceMax: 31000.00,
        forecastDate: new Date(now.getTime() + 30 * 24 * 3600 * 1000)
      },
      {
        id: 'FC-002',
        resourceId: 'i-0a8b9c1d2e3f4g5',
        targetMetric: 'CpuTrend',
        forecastValue: 42.50,
        confidenceMin: 35.00,
        confidenceMax: 50.00,
        forecastDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000)
      }
    ],
    skipDuplicates: true
  });

  // 4. Seed Recommendations
  await prisma.recommendation.createMany({
    data: [
      {
        id: 'REC-001',
        resourceId: 'i-0a8b9c1d2e3f4g5',
        serviceName: 'Amazon EC2',
        recommendationType: 'RIGHTSIZING',
        title: 'Downsize over-provisioned EC2 worker cluster from c5.2xlarge to c5.xlarge',
        description: 'Downsizing will maintain 2.5x buffer while cutting compute costs by 50%.',
        currentCost: 148.50,
        projectedCost: 74.25,
        potentialSavings: 74.25,
        status: 'PENDING',
        updatedAt: new Date()
      },
      {
        id: 'REC-002',
        resourceId: 'vol-0123456789abcdef0',
        serviceName: 'Amazon EBS',
        recommendationType: 'STORAGE_TIER',
        title: 'Migrate EBS io2 provisioned volumes to gp3 with custom throughput',
        description: 'Delivers identical IO latency at 65% lower monthly storage cost.',
        currentCost: 320.00,
        projectedCost: 98.00,
        potentialSavings: 222.00,
        status: 'PENDING',
        updatedAt: new Date()
      },
      {
        id: 'REC-003',
        resourceId: 's3-cold-archive-reports',
        serviceName: 'Amazon S3',
        recommendationType: 'STORAGE_TIER',
        title: 'Transition unaccessed S3 bucket data to S3 Glacier Flexible Retrieval',
        description: 'Transition historical audit logs to Glacier Flexible Retrieval.',
        currentCost: 326.60,
        projectedCost: 51.12,
        potentialSavings: 275.48,
        status: 'APPROVED',
        updatedAt: new Date()
      }
    ],
    skipDuplicates: true
  });

  // 5. Seed SystemLogs
  await prisma.systemLog.createMany({
    data: [{
      id: 'SYSLOG-001',
      level: 'INFO',
      message: 'Cloud Optimizer database initialized and populated with seed records.',
      context: { engine: 'PostgreSQL 18.6', status: 'READY' }
    }],
    skipDuplicates: true
  });

  console.log('Database seeding complete!');
}

seedDatabase()
  .catch((err) => {
    console.error('SEEDING ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
