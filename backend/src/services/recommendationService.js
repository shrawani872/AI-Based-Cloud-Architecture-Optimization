const {
  getRecommendations,
} = require("../repositories/recommendationRepository");

const generateRecommendation = async () => {
  const recommendations = await getRecommendations();

  return {
    status: "success",
    message: "Recommendations retrieved successfully",
    data: recommendations,
  };
};

module.exports = {
  generateRecommendation,
};