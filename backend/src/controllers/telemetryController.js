const prisma = require("../config/db");

const getTelemetryMetrics = async (req, res, next) => {
  try {
    const { resourceId, range = "24h" } = req.query;

    const allowedRanges = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };

    if (!allowedRanges[range]) {
      return res.status(400).json({
        status: "error",
        message: "Invalid telemetry range",
        allowedRanges: Object.keys(allowedRanges),
      });
    }

    const where = {};

    if (resourceId) {
      where.instanceId = resourceId;
    }

    where.timestamp = {
      gte: new Date(Date.now() - allowedRanges[range]),
    };

    const metrics = await prisma.awsMetric.findMany({
      where,
      orderBy: {
        timestamp: "asc",
      },
      take: 72,
    });

    res.json({
      resourceId: resourceId || null,
      range,
      data: metrics,
      count: metrics.length,
    });
  } catch (err) {
    next(err);
  }
};

const getTelemetryResources = async (req, res, next) => {
  try {
    const resources = [
      {
        id: "i-0a8b9c1d2e3f4g5",
        name: "prod-api-worker-01",
        service: "Amazon EC2",
        region: "us-east-1",
        status: "WARNING",
      },
      {
        id: "rds-prod-primary-01",
        name: "customer-aurora-cluster",
        service: "Amazon RDS",
        region: "us-east-1",
        status: "HEALTHY",
      },
      {
        id: "vol-0123456789abcdef0",
        name: "analytics-primary-storage",
        service: "Amazon EBS",
        region: "us-east-1",
        status: "CRITICAL",
      },
    ];

    res.json(resources);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTelemetryMetrics,
  getTelemetryResources,
};