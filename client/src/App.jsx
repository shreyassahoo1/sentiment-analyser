import { useEffect, useState } from "react";
import "./App.css";

const PRESETS = [
  {
    label: " Workshop Integration Test",
    text: "The new library is beautiful and the staff are very helpful. However, the wifi is slow and the chairs are uncomfortable. The library opens at nine."
  },
  {
    label: " Positive Review",
    text: "I absolutely love this product and it works perfectly. The customer support solved my problem immediately and politely."
  },
  {
    label: " Service Complaint",
    text: "The food was cold and tasted disgusting. The delivery was late and the package was damaged."
  },
  {
    label: " Neutral Schedule",
    text: "The meeting is scheduled for ten on Monday. The class begins at nine and ends at noon."
  }
];

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ positive: 0, negative: 0, neutral: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [h, s] = await Promise.all([
        fetch("/api/analyses").then((r) => r.json()),
        fetch("/api/analyses/stats/summary").then((r) => r.json()),
      ]);
      setHistory(Array.isArray(h) ? h : []);
      if (s && typeof s === "object") {
        setStats({
          positive: s.positive || 0,
          negative: s.negative || 0,
          neutral: s.neutral || 0,
        });
      }
    } catch {
      setError("Cannot reach the server");
    }
  };

  useEffect(() => {
    loadData().catch(() => setError("Cannot reach the server"));
  }, []);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResult(data);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const remove = async (id) => {
    await fetch(`/api/analyses/${id}`, { method: "DELETE" });
    await loadData();
    if (result && result._id === id) {
      setResult(null);
    }
  };
  return (
    <div className="container">
      {/* Header & Architecture Status */}
      <header className="app-header">
        <div className="brand-badge">Full-Stack AI/ML System</div>
        <h1 className="app-title">Sentiment & Tone Analyzer</h1>
        <p className="app-subtitle">
          Supervised TF-IDF + Logistic Regression (scikit-learn) paired with VADER lexicon analysis, served via FastAPI, Express & MongoDB.
        </p>

        <div className="service-pills">
          <div className="service-pill" id="pill-react">
            <span className="status-dot"></span> React Client (:5173)
          </div>
          <div className="service-pill" id="pill-express">
            <span className="status-dot"></span> Express Backend (:5000)
          </div>
          <div className="service-pill" id="pill-fastapi">
            <span className="status-dot"></span> FastAPI ML (:8000)
          </div>
          <div className="service-pill" id="pill-mongo">
            <span className="status-dot"></span> MongoDB (:27017)
          </div>
        </div>
      </header>

      {/* Input Card */}
      <div className="card" id="input-card">
        <div className="card-header-row">
          <h2> Analyze Text</h2>
          <span className="char-counter">{text.length} characters</span>
        </div>

        {/* Quick Sample Presets */}
        <div className="presets-container">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              id={`preset-${idx}`}
              type="button"
              className="preset-chip"
              onClick={() => setText(p.text)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <textarea
          id="text-input"
          rows="6"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a paragraph here..."
        />

        <div className="textarea-footer">
          <div className="button-row">
            <button
              id="btn-analyze"
              onClick={analyze}
              disabled={loading || !text.trim()}
            >
              {loading ? "Analyzing..." : "⚡ Analyze"}
            </button>
            {text && (
              <button
                id="btn-clear"
                type="button"
                className="btn-clear"
                onClick={() => { setText(""); setError(""); }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="error" id="error-message">
            <span></span> {error}
          </div>
        )}
      </div>

      {/* Result Card */}
      {result && (
        <div className="card" id="result-card">
          <div className="overall-banner">
            <div className="overall-title-row">
              <h2>
                Overall:{" "}
                <span className={`tag ${result.overallSentiment}`} id="overall-tag">
                  {result.overallSentiment}
                </span>
              </h2>
              <span style={{ fontSize: "1rem", color: "#e2e8f0" }}>
                ({Math.round(result.confidence * 100)}% confident)
              </span>
            </div>

            <div className="confidence-meter">
              <div
                className={`confidence-fill ${result.overallSentiment}`}
                style={{ width: `${Math.min(100, Math.round(result.confidence * 100))}%` }}
              ></div>
            </div>

            <div className="vader-box" id="vader-result">
              Ready-made VADER model says:{" "}
              <span className={`tag ${result.vaderLabel}`}>
                {result.vaderLabel}
              </span>{" "}
              (score {result.vaderScore})
            </div>
          </div>

          <h3>Sentence by sentence</h3>
          <div id="sentence-list">
            {result.sentences && result.sentences.map((s, i) => (
              <div key={i} className={`sentence ${s.sentiment}`} id={`sentence-${i}`}>
                {s.text}{" "}
                <b>
                  ({s.sentiment}, {Math.round(s.confidence * 100)}%)
                </b>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary & History Card */}
      <div className="card" id="history-card">
        <h2>📊 Summary Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card positive" id="stat-positive">
            <div className="stat-number" style={{ color: "var(--positive)" }}>
              {stats.positive}
            </div>
            <div className="stat-label">Positive Analyses</div>
          </div>
          <div className="stat-card negative" id="stat-negative">
            <div className="stat-number" style={{ color: "var(--negative)" }}>
              {stats.negative}
            </div>
            <div className="stat-label">Negative Analyses</div>
          </div>
          <div className="stat-card neutral" id="stat-neutral">
            <div className="stat-number" style={{ color: "var(--neutral)" }}>
              {stats.neutral}
            </div>
            <div className="stat-label">Neutral Analyses</div>
          </div>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Positive: {stats.positive} | Negative: {stats.negative} | Neutral:{" "}
          {stats.neutral}
        </p>

        <div className="card-header-row" style={{ marginTop: "1.5rem" }}>
          <h2>📜 Analysis History</h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
            Saved in MongoDB ({history.length} records)
          </span>
        </div>

        {history.length === 0 ? (
          <div className="empty-state" id="history-empty">
            No analyses yet. Paste a paragraph above to start!
          </div>
        ) : (
          <div className="history-list" id="history-items-container">
            {history.map((h) => (
              <div key={h._id} className="history-item" id={`history-${h._id}`}>
                <div className="history-item-content">
                  <span className={`tag ${h.overallSentiment}`}>
                    {h.overallSentiment}
                  </span>
                  <span className="history-text" title={h.text}>
                    {h.text.length > 80 ? h.text.slice(0, 80) + "..." : h.text}
                  </span>
                </div>
                <button
                  id={`btn-delete-${h._id}`}
                  className="danger"
                  onClick={() => remove(h._id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}