const express = require("express");
const { healthCheck } = require("../controllers/healthController");
const { awsStatusCheck } = require("../controllers/awsController");
const { aiStatusCheck } = require("../controllers/aiController");

const router = express.Router();

router.get("/health", healthCheck);
router.get("/aws/status", awsStatusCheck);
router.get("/ai/status", aiStatusCheck);

module.exports = router;