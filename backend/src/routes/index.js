const express = require("express");
const { healthCheck } = require("../controllers/healthController");
const { awsStatusCheck } = require("../controllers/awsController");
const { aiStatusCheck } = require("../controllers/aiController");
const {
  getRecommendations,
  getRecommendationById,
  approveRecommendation,
  rejectRecommendation,
  recommendationCheck
} = require("../controllers/recommendationController");
const { getDashboardSummary } = require("../controllers/dashboardController");
const { getTelemetryMetrics, getTelemetryResources } = require("../controllers/telemetryController");
const { getAnomalies } = require("../controllers/anomaliesController");
const { getForecasts, triggerForecast } = require("../controllers/forecastController");
const { getHistory } = require("../controllers/historyController");
const { getSystemHealth } = require("../controllers/systemController");

const router = express.Router();

// Health check
router.get("/health", healthCheck);
router.get("/system/health", getSystemHealth);

// Service status
router.get("/aws/status", awsStatusCheck);
router.get("/ai/status", aiStatusCheck);

// Dashboard
router.get("/dashboard/summary", getDashboardSummary);

// Telemetry
router.get("/telemetry/metrics", getTelemetryMetrics);
router.get("/telemetry/resources", getTelemetryResources);

// Anomalies
router.get("/anomalies", getAnomalies);

// Forecasts
router.get("/forecasts", getForecasts);
router.post("/forecast", triggerForecast);

// Recommendations
router.get("/recommendations", getRecommendations);
router.get("/recommendations/:id", getRecommendationById);
router.post("/recommendations/:id/approve", approveRecommendation);
router.post("/recommendations/:id/reject", rejectRecommendation);
router.post("/recommendation", recommendationCheck);

// History
router.get("/history", getHistory);

module.exports = router;
