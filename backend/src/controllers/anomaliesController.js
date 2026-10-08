const prisma = require("../config/db");

const getAnomalies = async (req, res, next) => {
  try {
    const { severity, status, state, resourceId } = req.query;

    const where = {};

    if (severity && severity.toLowerCase() !== "all") {
      where.severity = severity.toUpperCase();
    }

    const effectiveStatus = status || state;
    if (effectiveStatus && effectiveStatus.toLowerCase() !== "all") {
      where.status = effectiveStatus.toUpperCase();
    }

    if (resourceId && resourceId.toLowerCase() !== "all") {
      where.resourceId = resourceId;
    }

    const anomalies = await prisma.anomaly.findMany({
      where,
      orderBy: {
        detectedAt: "desc",
      },
    });

    res.json(anomalies);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnomalies,
};