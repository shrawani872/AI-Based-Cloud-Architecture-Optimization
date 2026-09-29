const prisma = require("./db");

const getRecommendations = async () => {
  return prisma.recommendation.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

module.exports = {
  getRecommendations,
};