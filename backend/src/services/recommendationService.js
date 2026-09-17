const generateRecommendation = (data) => {
  return {
    status: "success",
    message: "Recommendation service is ready",
    input: data
  };
};

module.exports = {
  generateRecommendation
};