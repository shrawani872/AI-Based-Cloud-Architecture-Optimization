const prisma = require('../src/config/db');

async function testCrudAllModels() {
  console.log('=== STARTING END-TO-END PRISMA MODEL CRUD TESTS ===\n');
  const results = {};

  try {
    // 1. Test AwsMetric CRUD
    console.log('1. Testing AwsMetric model...');
    const metricCreated = await prisma.awsMetric.create({
      data: {
        instanceId: 'i-test-01',
        service: 'Amazon EC2',
        region: 'us-east-1',
        metricName: 'CPUUtilization',
        metricValue: 45.2,
        unit: 'Percent',
        metadata: { env: 'test', tags: ['worker'] }
      }
    });
    console.log('  - Create: PASS (ID:', metricCreated.id, ')');

    const metricRead = await prisma.awsMetric.findUnique({
      where: { id: metricCreated.id }
    });
    console.log('  - Read: PASS (Value:', metricRead.metricValue, ')');

    const metricUpdated = await prisma.awsMetric.update({
      where: { id: metricCreated.id },
      data: { metricValue: 88.5 }
    });
    console.log('  - Update: PASS (Updated Value:', metricUpdated.metricValue, ')');

    const metricDeleted = await prisma.awsMetric.delete({
      where: { id: metricCreated.id }
    });
    console.log('  - Delete: PASS (Deleted ID:', metricDeleted.id, ')');
    results.AwsMetric = 'PASS';

    // 2. Test Anomaly CRUD
    console.log('\n2. Testing Anomaly model...');
    const anomalyCreated = await prisma.anomaly.create({
      data: {
        resourceId: 'vol-test-01',
        anomalyType: 'IOPS Surge',
        severity: 'HIGH',
        score: 3.8,
        status: 'ACTIVE',
        details: { zScore: 3.8, rootCause: 'Batch run' }
      }
    });
    console.log('  - Create: PASS (ID:', anomalyCreated.id, ')');

    const anomalyRead = await prisma.anomaly.findUnique({
      where: { id: anomalyCreated.id }
    });
    console.log('  - Read: PASS (Severity:', anomalyRead.severity, ')');

    const anomalyUpdated = await prisma.anomaly.update({
      where: { id: anomalyCreated.id },
      data: { status: 'RESOLVED' }
    });
    console.log('  - Update: PASS (Status:', anomalyUpdated.status, ')');

    const anomalyDeleted = await prisma.anomaly.delete({
      where: { id: anomalyCreated.id }
    });
    console.log('  - Delete: PASS (Deleted ID:', anomalyDeleted.id, ')');
    results.Anomaly = 'PASS';

    // 3. Test Forecast CRUD
    console.log('\n3. Testing Forecast model...');
    const forecastCreated = await prisma.forecast.create({
      data: {
        resourceId: 'global-cloud',
        targetMetric: 'Cost',
        forecastValue: 1250.00,
        confidenceMin: 1100.00,
        confidenceMax: 1400.00,
        forecastDate: new Date(Date.now() + 7 * 24 * 3600 * 1000)
      }
    });
    console.log('  - Create: PASS (ID:', forecastCreated.id, ')');

    const forecastRead = await prisma.forecast.findUnique({
      where: { id: forecastCreated.id }
    });
    console.log('  - Read: PASS (ForecastValue:', forecastRead.forecastValue, ')');

    const forecastUpdated = await prisma.forecast.update({
      where: { id: forecastCreated.id },
      data: { forecastValue: 1280.00 }
    });
    console.log('  - Update: PASS (Updated Value:', forecastUpdated.forecastValue, ')');

    const forecastDeleted = await prisma.forecast.delete({
      where: { id: forecastCreated.id }
    });
    console.log('  - Delete: PASS (Deleted ID:', forecastDeleted.id, ')');
    results.Forecast = 'PASS';

    // 4. Test Recommendation CRUD
    console.log('\n4. Testing Recommendation model...');
    const recCreated = await prisma.recommendation.create({
      data: {
        resourceId: 'i-0a8b9c1d2e3f4g5',
        serviceName: 'Amazon EC2',
        recommendationType: 'RIGHTSIZING',
        title: 'Downsize over-provisioned EC2 worker cluster',
        description: 'Downsize c5.2xlarge to c5.xlarge',
        currentCost: 148.50,
        projectedCost: 74.25,
        potentialSavings: 74.25,
        status: 'PENDING'
      }
    });
    console.log('  - Create: PASS (ID:', recCreated.id, ')');

    const recRead = await prisma.recommendation.findUnique({
      where: { id: recCreated.id }
    });
    console.log('  - Read: PASS (Title:', recRead.title, ')');

    const recUpdated = await prisma.recommendation.update({
      where: { id: recCreated.id },
      data: { status: 'APPROVED' }
    });
    console.log('  - Update: PASS (Status:', recUpdated.status, ')');

    const recDeleted = await prisma.recommendation.delete({
      where: { id: recCreated.id }
    });
    console.log('  - Delete: PASS (Deleted ID:', recDeleted.id, ')');
    results.Recommendation = 'PASS';

    // 5. Test SystemLog CRUD
    console.log('\n5. Testing SystemLog model...');
    const logCreated = await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'Integration test system log entry',
        context: { testRun: true, environment: 'local' }
      }
    });
    console.log('  - Create: PASS (ID:', logCreated.id, ')');

    const logRead = await prisma.systemLog.findUnique({
      where: { id: logCreated.id }
    });
    console.log('  - Read: PASS (Message:', logRead.message, ')');

    const logUpdated = await prisma.systemLog.update({
      where: { id: logCreated.id },
      data: { level: 'WARN' }
    });
    console.log('  - Update: PASS (Updated Level:', logUpdated.level, ')');

    const logDeleted = await prisma.systemLog.delete({
      where: { id: logCreated.id }
    });
    console.log('  - Delete: PASS (Deleted ID:', logDeleted.id, ')');
    results.SystemLog = 'PASS';

    console.log('\n=== ALL 5 PRISMA MODELS PASSED READ/WRITE VERIFICATION ===');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCrudAllModels();
