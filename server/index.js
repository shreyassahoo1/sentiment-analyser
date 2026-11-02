require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const { startMongo } = require("./mongo-runner");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sentiment_db";

async function bootstrap() {
  try {
    // If targeted at local default port 27017, ensure an active MongoDB instance exists
    if (MONGO_URI.includes("127.0.0.1:27017") || MONGO_URI.includes("localhost:27017")) {
      await startMongo();
    }

    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log("✅ MongoDB successfully connected!");

    app.listen(PORT, "127.0.0.1", () => {
      console.log(`🚀 Express server running on http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup error:", err.message);
    process.exit(1);
  }
}

bootstrap();
