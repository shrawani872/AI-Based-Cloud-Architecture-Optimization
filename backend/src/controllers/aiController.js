const { getAIProviderStatus } = require("../services/aiService");

const aiStatusCheck = async (req, res, next) => {
  try {
    const status = await getAIProviderStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  aiStatusCheck
};