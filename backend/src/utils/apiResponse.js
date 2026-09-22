const successResponse = (data, meta = {}) => {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
};

const errorResponse = (code, message, details = null) => {
  return {
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };
};

module.exports = {
  successResponse,
  errorResponse
};
