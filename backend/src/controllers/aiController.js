const { getAIProviderStatus } = require("../services/aiService");

const aiStatusCheck = (req, res) => {
  res.json(getAIProviderStatus());
};

module.exports = {
  aiStatusCheck
};