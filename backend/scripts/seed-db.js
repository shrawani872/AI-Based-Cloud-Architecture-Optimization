const prisma = require('../src/config/db');

async function seedDatabase() {
  console.log('Seeding cloud_optimizer database with initial metrics, anomalies, forecasts, and recommendations...');

  // 1. Seed AwsMetrics
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - i * 3600 * 1000);
    await prisma.awsMetric.create({
      data: {
        instanceId: 'i-0a8b9c1d2e3f4g5',
        service: 'Amazon EC2',
        region: 'us-east-1',
        metricName: 'CPUUtilization',
        metricValue: Number((25 + Math.sin(i) * 15 + Math.random() * 5).toFixed(2)),
        unit: 'Percent',
        timestamp,
        metadata: { instanceType: 'c5.2xlarge', status: 'HEALTHY' }
      }
    });
  }

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
        status: 'PENDING'
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
        status: 'PENDING'
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
        status: 'APPROVED'
      }
    ],
    skipDuplicates: true
  });

  // 5. Seed SystemLogs
  await prisma.systemLog.create({
    data: {
      level: 'INFO',
      message: 'Cloud Optimizer database initialized and populated with seed records.',
      context: { engine: 'PostgreSQL 18.6', status: 'READY' }
    }
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
