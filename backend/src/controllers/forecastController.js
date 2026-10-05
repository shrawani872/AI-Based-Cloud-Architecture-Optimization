const prisma = require("../config/db");
const { getForecastFromAI } = require("../services/aiService");

const getForecasts = async (req, res, next) => {
  try {
    const forecasts = await prisma.forecast.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(forecasts);
  } catch (err) {
    next(err);
  }
};

const triggerForecast = async (req, res, next) => {
  try {
    const { resourceId, horizon } = req.body;

    if (!resourceId || typeof resourceId !== "string" || resourceId.trim() === "") {
      const err = new Error("Invalid or missing resourceId");
      err.statusCode = 400;
      throw err;
    }

    if (horizon === undefined || horizon <= 0) {
      const err = new Error("Invalid or missing horizon");
      err.statusCode = 400;
      throw err;
    }

    const metrics = await prisma.awsMetric.findMany({
      where: { instanceId: resourceId },
      orderBy: { timestamp: "asc" },
      take: 100
    });

    const timestamps = metrics.map(m => m.timestamp.toISOString());
    const values = metrics.map(m => m.metricValue);

    const aiResponse = await getForecastFromAI(resourceId, timestamps, values);

    const forecastDate = new Date(Date.now() + horizon * 60 * 60 * 1000);

    const forecast = await prisma.forecast.create({
      data: {
        id: `FCST-${Date.now()}`,
        resourceId: aiResponse.resource_id,
        targetMetric: aiResponse.metric,
        forecastValue: aiResponse.predicted_value,
        forecastDate: forecastDate,
      }
    });

    res.json(forecast);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getForecasts,
  triggerForecast,
};