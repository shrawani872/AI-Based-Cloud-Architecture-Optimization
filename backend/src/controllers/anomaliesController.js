const prisma = require("../config/db");

const getAnomalies = async (req, res, next) => {
  try {
    const anomalies = await prisma.anomaly.findMany({
      orderBy: { detectedAt: 'desc' }
    });
    res.json(anomalies);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnomalies
};
