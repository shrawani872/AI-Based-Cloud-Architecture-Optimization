const {
  getRecommendations,
  getRecommendationById,
  updateRecommendationStatus,
} = require("../repositories/recommendationRepository");

const prisma = require("../config/db");

const generateRecommendation = async () => {
  const recommendations = await getRecommendations();

  return {
    status: "success",
    message: "Recommendations retrieved successfully",
    data: recommendations,
  };
};

const getRecommendation = async (id) => {
  return getRecommendationById(id);
};

const approveRecommendationService = async (id) => {
  const recommendation = await getRecommendationById(id);

  if (!recommendation) {
    const error = new Error("Recommendation not found");
    error.statusCode = 404;
    throw error;
  }

  if (recommendation.status !== "ACTIVE") {
    const error = new Error(
      `Recommendation cannot be approved from status ${recommendation.status}`
    );
    error.statusCode = 409;
    throw error;
  }

  const updatedRecommendation = await updateRecommendationStatus(id, {
    status: "APPROVED",
    updatedAt: new Date(),
  });

  await prisma.systemLog.create({
    data: {
      id: `LOG-${Date.now()}`,
      level: "INFO",
      message: `Recommendation ${id} approved`,
      context: {
        recommendationId: id,
        resourceId: recommendation.resourceId,
        serviceName: recommendation.serviceName,
        action: "APPROVED",
      },
    },
  });

  return updatedRecommendation;
};

const rejectRecommendationService = async (id) => {
  const recommendation = await getRecommendationById(id);

  if (!recommendation) {
    const error = new Error("Recommendation not found");
    error.statusCode = 404;
    throw error;
  }

  if (recommendation.status !== "ACTIVE") {
    const error = new Error(
      `Recommendation cannot be rejected from status ${recommendation.status}`
    );
    error.statusCode = 409;
    throw error;
  }

  const updatedRecommendation = await updateRecommendationStatus(id, {
    status: "REJECTED",
    updatedAt: new Date(),
  });

  await prisma.systemLog.create({
    data: {
      id: `LOG-${Date.now()}`,
      level: "INFO",
      message: `Recommendation ${id} rejected`,
      context: {
        recommendationId: id,
        resourceId: recommendation.resourceId,
        serviceName: recommendation.serviceName,
        action: "REJECTED",
      },
    },
  });

  return updatedRecommendation;
};

module.exports = {
  generateRecommendation,
  getRecommendation,
  approveRecommendationService,
  rejectRecommendationService,
};