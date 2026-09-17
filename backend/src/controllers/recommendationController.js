const { generateRecommendation } = require("../services/recommendationService");
const { validateRecommendation } = require("../validators/recommendationValidator");

const recommendationCheck = (req, res) => {
  const validation = validateRecommendation(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: "error",
      message: "Invalid recommendation request",
      errors: validation.error.issues
    });
  }

  const result = generateRecommendation(validation.data);
  res.json(result);
};

module.exports = {
  recommendationCheck
};