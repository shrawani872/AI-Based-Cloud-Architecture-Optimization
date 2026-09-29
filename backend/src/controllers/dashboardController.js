const prisma = require("../config/db");

const getDashboardSummary = async (req, res, next) => {
  try {
    const activeRecommendations = await prisma.recommendation.findMany({
      where: { status: "ACTIVE" },
      orderBy: {
        createdAt: "desc",
      },
    });

    const activeAnomalies = await prisma.anomaly.findMany({
      where: { status: "OPEN" },
    });

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const anomalies24h = activeAnomalies.filter(
      (anomaly) => anomaly.detectedAt >= last24Hours
    );

    const totalPotentialSavings = activeRecommendations.reduce(
      (sum, recommendation) => sum + recommendation.potentialSavings,
      0
    );

    const totalCurrentCost = activeRecommendations.reduce(
      (sum, recommendation) => sum + recommendation.currentCost,
      0
    );

    const totalProjectedCost = activeRecommendations.reduce(
      (sum, recommendation) => sum + recommendation.projectedCost,
      0
    );

    const savingsPercent =
      totalCurrentCost > 0
        ? ((totalCurrentCost - totalProjectedCost) / totalCurrentCost) * 100
        : 0;

    res.json({
      monthlySpend: null,
      spendChangePercent: null,
      projectedMonthlySpend: null,
      potentialMonthlySavings: totalPotentialSavings,
      savingsPercent: Number(savingsPercent.toFixed(2)),
      activeRecommendationsCount: activeRecommendations.length,
      pendingApprovalsCount: activeRecommendations.length,
      anomalies24hCount: anomalies24h.length,
      criticalAnomaliesCount: activeAnomalies.filter(
        (anomaly) => anomaly.severity === "CRITICAL"
      ).length,
      systemHealthScore: null,
      evaluatedResourcesCount: null,
      optimizedResourcesCount: null,
      topRecommendationsPreview: activeRecommendations.slice(0, 3),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardSummary,
};