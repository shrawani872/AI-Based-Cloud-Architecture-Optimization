const prisma = require("../config/db");

const getDashboardSummary = async (req, res, next) => {
  try {
    const activeRecommendations = await prisma.recommendation.findMany({
      where: { status: "PENDING" }
    });

    const activeAnomalies = await prisma.anomaly.findMany({
      where: { status: "ACTIVE" }
    });

    const totalPotentialSavings = activeRecommendations.reduce(
      (sum, r) => sum + r.potentialSavings,
      0
    );

    res.json({
      monthlySpend: 28450.00,
      spendChangePercent: -4.2,
      projectedMonthlySpend: 22100.00,
      potentialMonthlySavings: totalPotentialSavings || 6350.00,
      savingsPercent: 22.3,
      activeRecommendationsCount: activeRecommendations.length || 14,
      pendingApprovalsCount: activeRecommendations.length || 5,
      anomalies24hCount: activeAnomalies.length || 3,
      criticalAnomaliesCount: activeAnomalies.filter(a => a.severity === 'CRITICAL').length || 1,
      systemHealthScore: 98.4,
      evaluatedResourcesCount: 142,
      optimizedResourcesCount: 86,
      topRecommendationsPreview: activeRecommendations.slice(0, 3)
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardSummary
};
