const prisma = require("../config/db");

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
    return res.status(501).json({
      status: "error",
      message:
        "Forecast generation is handled by the ML service and is not implemented in the backend yet.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getForecasts,
  triggerForecast,
};