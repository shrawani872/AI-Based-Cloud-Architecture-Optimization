const { getHealthStatus } = require("../services/healthService");

const healthCheck = async (req, res, next) => {
  try {
    const health = await getHealthStatus();
    res.json(health);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  healthCheck
};