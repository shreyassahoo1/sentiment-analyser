const express = require("express");
const cors = require("cors");
const analysisRoutes = require("./routes/analysisRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Root & Health Check Endpoints
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Sentiment & Tone Analyzer API is running",
    service: "Express Backend",
    endpoints: {
      analyze: "POST /api/analyses",
      history: "GET /api/analyses",
      stats: "GET /api/analyses/stats",
      getById: "GET /api/analyses/:id",
      delete: "DELETE /api/analyses/:id"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Mount Routes
app.use("/api/analyses", analysisRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Express Error:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

module.exports = app;
