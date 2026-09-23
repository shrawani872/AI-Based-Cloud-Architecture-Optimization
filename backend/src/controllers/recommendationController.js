const prisma = require("../config/db");
const { generateRecommendation } = require("../services/recommendationService");
const { validateRecommendation } = require("../validators/recommendationValidator");

const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await prisma.recommendation.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
};

const getRecommendationById = async (req, res, next) => {
  try {
    const rec = await prisma.recommendation.findUnique({
      where: { id: req.params.id }
    });
    if (!rec) {
      return res.status(404).json({ status: "error", message: "Recommendation not found" });
    }
    res.json(rec);
  } catch (err) {
    next(err);
  }
};

const approveRecommendation = async (req, res, next) => {
  try {
    const updated = await prisma.recommendation.update({
      where: { id: req.params.id },
      data: { status: "APPROVED" }
    });

    // Log approval in SystemLog
    await prisma.systemLog.create({
      data: {
        level: "INFO",
        message: `Recommendation ${req.params.id} approved by user`,
        context: { recommendationId: req.params.id, status: "APPROVED" }
      }
    });

    res.json({ success: true, recommendation: updated });
  } catch (err) {
    next(err);
  }
};

const rejectRecommendation = async (req, res, next) => {
  try {
    const updated = await prisma.recommendation.update({
      where: { id: req.params.id },
      data: { status: "REJECTED" }
    });

    // Log rejection in SystemLog
    await prisma.systemLog.create({
      data: {
        level: "INFO",
        message: `Recommendation ${req.params.id} rejected by user`,
        context: { recommendationId: req.params.id, status: "REJECTED", reason: req.body?.reason }
      }
    });

    res.json({ success: true, recommendation: updated });
  } catch (err) {
    next(err);
  }
};

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
  getRecommendations,
  getRecommendationById,
  approveRecommendation,
  rejectRecommendation,
  recommendationCheck
};