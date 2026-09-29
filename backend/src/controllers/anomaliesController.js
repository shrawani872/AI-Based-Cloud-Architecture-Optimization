const prisma = require("../config/db");

const getAnomalies = async (req, res, next) => {
  try {
    const { severity, status, resourceId } = req.query;

    const where = {};

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    if (resourceId) {
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