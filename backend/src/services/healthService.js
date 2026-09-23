const prisma = require("../config/db");

const getHealthStatus = async () => {
  let dbStatus = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  return {
    status: "ok",
    database: dbStatus,
    databaseName: "cloud_optimizer",
    engine: "PostgreSQL 18.6",
    message: "Backend API and database are running"
  };
};

module.exports = {
  getHealthStatus
};