const { getAIStatus, generateForecast } = require("../providers/ai/aiProvider");

const getAIProviderStatus = async () => {
  return await getAIStatus();
};

const getForecastFromAI = async (resourceId, timestamps, values) => {
  return await generateForecast(resourceId, timestamps, values);
};

module.exports = {
  getAIProviderStatus,
  getForecastFromAI
};