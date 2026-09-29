const { generateRecommendation } = require("../services/recommendationService");
const { validateRecommendation } = require("../validators/recommendationValidator");

const recommendationCheck = async (req, res, next) => {
  try {
    const validation = validateRecommendation(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Invalid recommendation request",
        errors: validation.error.issues,
      });
    }

    const result = await generateRecommendation(validation.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recommendationCheck,
};