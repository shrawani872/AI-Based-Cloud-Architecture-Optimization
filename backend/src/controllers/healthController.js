const healthCheck = (req, res) => {
  res.json({
    status: "ok",
    message: "Backend API is running"
  });
};

module.exports = {
  healthCheck
};