const { z } = require("zod");

const recommendationSchema = z.object({
  project: z.string().min(1),
  provider: z.string().min(1)
});

const validateRecommendation = (data) => {
  return recommendationSchema.safeParse(data);
};

module.exports = {
  validateRecommendation
};