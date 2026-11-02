import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import analysisRoutes from "./routes/analysisRoutes.js";
import { ensureMongo } from "./mongo-runner.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("Sentiment API is running"));
app.use("/api/analyses", analysisRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sentimentdb";

async function start() {
  if (MONGO_URI.includes("127.0.0.1:27017") || MONGO_URI.includes("localhost:27017")) {
    await ensureMongo();
  }

  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("MongoDB connected");
      app.listen(PORT, "127.0.0.1", () =>
        console.log(`Server running on port ${PORT}`)
      );
    })
    .catch((err) => console.error("MongoDB connection error:", err.message));
}

start();
