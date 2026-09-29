const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  if (statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({
      status: "error",
      message: err.message || "Request failed"
    });
  }

  res.status(500).json({
    status: "error",
    message: "Internal server error"
  });
};

module.exports = {
  errorHandler
};