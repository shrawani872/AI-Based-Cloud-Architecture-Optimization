const { getAIStatus } = require("../providers/ai/aiProvider");

const getAIProviderStatus = () => {
  return getAIStatus();
};

module.exports = {
  getAIProviderStatus
};