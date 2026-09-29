const prisma = require("./db");

const getRecommendations = async () => {
  return prisma.recommendation.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getRecommendationById = async (id) => {
  return prisma.recommendation.findUnique({
    where: {
      id,
    },
  });
};

const updateRecommendationStatus = async (id, data) => {
  return prisma.recommendation.update({
    where: {
      id,
    },
    data,
  });
};

module.exports = {
  getRecommendations,
  getRecommendationById,
  updateRecommendationStatus,
};