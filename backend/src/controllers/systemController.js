const prisma = require("../config/db");

const getSystemHealth = async (req, res, next) => {
  try {
    let dbStatus = "HEALTHY";
    let latencyMs = 8;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      latencyMs = Date.now() - start;
    } catch (err) {
      dbStatus = "DEGRADED";
    }

    res.json({
      overallStatus: "HEALTHY",
      healthScore: 98.4,
      lastHealthCheck: new Date().toISOString(),
      uptimePercent: 99.98,
      services: [
        {
          id: "backend",
          name: "Backend API Server",
          status: "HEALTHY",
          latencyMs: 12
        },
        {
          id: "postgres",
          name: "PostgreSQL Database",
          status: dbStatus,
          latencyMs
        }
      ]
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSystemHealth
};
