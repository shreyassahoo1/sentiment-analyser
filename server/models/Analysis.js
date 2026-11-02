import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    overallSentiment: String,
    confidence: Number,
    sentences: [
      {
        text: String,
        sentiment: String,
        confidence: Number,
      },
    ],
    vaderScore: Number,
    vaderLabel: String,
  },
  { timestamps: true } // adds createdAt automatically
);

export default mongoose.model("Analysis", analysisSchema);
