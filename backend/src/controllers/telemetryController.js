const prisma = require("../config/db");

const getTelemetryMetrics = async (req, res, next) => {
  try {
    const resourceId = req.query.resourceId || 'i-0a8b9c1d2e3f4g5';
    const metrics = await prisma.awsMetric.findMany({
      where: { instanceId: resourceId },
      orderBy: { timestamp: 'asc' },
      take: 72
    });

    res.json({
      resourceId,
      range: req.query.range || '24h',
      data: metrics,
      count: metrics.length
    });
  } catch (err) {
    next(err);
  }
};

const getTelemetryResources = async (req, res, next) => {
  try {
    const resources = [
      { id: 'i-0a8b9c1d2e3f4g5', name: 'prod-api-worker-01', service: 'Amazon EC2', region: 'us-east-1', status: 'WARNING' },
      { id: 'rds-prod-primary-01', name: 'customer-aurora-cluster', service: 'Amazon RDS', region: 'us-east-1', status: 'HEALTHY' },
      { id: 'vol-0123456789abcdef0', name: 'analytics-primary-storage', service: 'Amazon EBS', region: 'us-east-1', status: 'CRITICAL' }
    ];
    res.json(resources);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTelemetryMetrics,
  getTelemetryResources
};
