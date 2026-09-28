
const prisma = require("../config/db");

const getHealthStatus = async () => {
  try {
    const result = await prisma.$queryRaw`
      SELECT
        current_database() AS "databaseName",
        current_setting('server_version') AS "version"
    `;

    return {
      status: "ok",
      database: "connected",
      databaseName: result[0].databaseName,
      engine: `PostgreSQL ${result[0].version}`,
      message: "Backend API and database are running"
    };
  } catch (err) {
    return {
      status: "error",
      database: "disconnected",
      message: err.message
    };
  }
};

module.exports = {
  getHealthStatus
};