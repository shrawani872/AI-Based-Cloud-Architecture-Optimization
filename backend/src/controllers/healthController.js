const { getHealthStatus } = require("../services/healthService");

const healthCheck = (req, res) => {
  res.json(getHealthStatus());
};

module.exports = {
  healthCheck
};