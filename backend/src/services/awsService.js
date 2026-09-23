const { getAWSStatus } = require("../providers/aws/awsProvider");

const getAWSProviderStatus = () => {
  return getAWSStatus();
};

module.exports = {
  getAWSProviderStatus
};