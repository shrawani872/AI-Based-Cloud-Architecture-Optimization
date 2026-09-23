const getAWSStatus = () => {
  return {
    provider: "AWS",
    status: "not_connected"
  };
};

module.exports = {
  getAWSStatus
};