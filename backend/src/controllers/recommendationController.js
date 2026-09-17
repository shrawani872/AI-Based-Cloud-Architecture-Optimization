const { generateRecommendation } = require("../services/recommendationService");

const recommendationCheck = (req, res) => {
  const result = generateRecommendation(req.body);
  res.json(result);
};

module.exports = {
  recommendationCheck
};