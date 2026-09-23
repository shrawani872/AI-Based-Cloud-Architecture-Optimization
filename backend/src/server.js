const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();
const apiRoutes = require("./routes");
const { errorHandler } = require("./middleware/errorHandler");

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/v1", apiRoutes);

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
