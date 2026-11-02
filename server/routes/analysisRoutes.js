import express from "express";
import mongoose from "mongoose";
import Analysis from "../models/Analysis.js";

const router = express.Router();

// POST /api/analyses  -> send text to ML service, save result
router.post("/", async (req, res) => {
  const text = req.body?.text;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Text is required" });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: "Text is too long (max 5000 characters)" });
  }
  let result;
  try {
    const mlRes = await fetch(`${process.env.ML_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    if (!mlRes.ok) throw new Error("ML service error");
    result = await mlRes.json();
  } catch (err) {
    return res
      .status(503)
      .json({ error: "ML service is not available. Start it on port 8000." });
  }
  try {
    const saved = await Analysis.create({ text: text.trim(), ...result });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Could not save the analysis" });
  }
});

// GET /api/analyses  -> history, newest first
router.get("/", async (req, res) => {
  const list = await Analysis.find().sort({ createdAt: -1 }).limit(50);
  res.json(list);
});

// GET /api/analyses/stats/summary  -> counts per sentiment
// (must be above "/:id", otherwise "stats" would be read as an id)
router.get("/stats/summary", async (req, res) => {
  const rows = await Analysis.aggregate([
    { $group: { _id: "$overallSentiment", count: { $sum: 1 } } },
  ]);
  const stats = { positive: 0, negative: 0, neutral: 0 };
  rows.forEach((r) => {
    if (r._id && stats[r._id] !== undefined) {
      stats[r._id] = r.count;
    }
  });
  res.json(stats);
});

// GET /api/analyses/:id  -> one analysis
router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const item = await Analysis.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

// DELETE /api/analyses/:id
router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const item = await Analysis.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json({ message: "Deleted" });
});

export default router;
