const { getAWSProviderStatus } = require("../services/awsService");

const awsStatusCheck = (req, res) => {
  res.json(getAWSProviderStatus());
};

module.exports = {
  awsStatusCheck
};