const getHealthStatus = () => {
  return {
    status: "ok",
    message: "Backend API is running"
  };
};

module.exports = {
  getHealthStatus
};