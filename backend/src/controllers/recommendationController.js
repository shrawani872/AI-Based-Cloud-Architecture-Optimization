const {
  generateRecommendation,
  getRecommendation,
  approveRecommendationService,
  rejectRecommendationService,
} = require("../services/recommendationService");

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

const getRecommendations = async (req, res, next) => {
  try {
    const result = await generateRecommendation();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getRecommendationById = async (req, res, next) => {
  try {
    const result = await getRecommendation(req.params.id);

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Recommendation not found",
      });
    }

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const approveRecommendation = async (req, res, next) => {
  try {
    const result = await approveRecommendationService(
      req.params.id,
      req.body
    );

    res.json({
      status: "success",
      message: "Recommendation approved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const rejectRecommendation = async (req, res, next) => {
  try {
    const result = await rejectRecommendationService(
      req.params.id,
      req.body
    );

    res.json({
      status: "success",
      message: "Recommendation rejected successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  getRecommendationById,
  approveRecommendation,
  rejectRecommendation,
  recommendationCheck,
};