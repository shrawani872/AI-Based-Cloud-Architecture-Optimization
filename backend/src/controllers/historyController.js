const prisma = require("../config/db");

const getHistory = async (req, res, next) => {
  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { timestamp: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHistory
};
