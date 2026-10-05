const { AI_SERVICE_URL = "http://localhost:8000" } = process.env;

const getAIStatus = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return {
        provider: "AI",
        status: "connected",
        details: data
      };
    } else {
      return {
        provider: "AI",
        status: "error",
        statusCode: response.status
      };
    }
  } catch (error) {
    return {
      provider: "AI",
      status: "not_connected",
      message: error.message
    };
  }
};

const generateForecast = async (resourceId, timestamps, values) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${AI_SERVICE_URL}/forecast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resource_id: resourceId,
        timestamps,
        values
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || "AI Service Error");
      error.statusCode = response.status === 422 ? 400 : (response.status >= 500 ? 502 : response.status);
      throw error;
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error("AI Service Timeout");
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    if (error.statusCode) throw error;
    
    const fetchError = new Error("AI Service Unavailable");
    fetchError.statusCode = 503;
    throw fetchError;
  }
};

module.exports = {
  getAIStatus,
  generateForecast
};