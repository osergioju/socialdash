require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const metricsRoutes = require("./routes/metrics.routes");
const clientRoutes = require("./routes/client.routes");
const oauthRoutes = require("./routes/oauth.routes");
const syncRoutes = require("./routes/sync.routes");

const app = express();

// ─── CONFIG BASE ──────────────────────────────────────────────────────────────
app.set("trust proxy", 1); // ESSENCIAL com ngrok

// ─── SECURITY ────────────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS (ANTES DE TUDO) ────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://comunity.crtcomunicacao.com.br",
  "https://comunity.crtcomunicacao.com.br",
];

app.use(cors({
  origin: function (origin, callback) {
    // permite requests sem origin (postman, mobile, etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.options("*", cors());

// ─── PARSING ─────────────────────────────────────────────────────────────────
app.use(express.json());

// ─── RATE LIMIT ──────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
}));

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/sync", syncRoutes);

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_, res) =>
  res.status(404).json({ error: "Rota não encontrada" })
);

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("🔥 ERROR:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS blocked this request" });
  }

  res.status(err.status || 500).json({
    error: err.message || "Erro interno",
  });
});



// ─── SERVER ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Allowed origins:`, allowedOrigins);
});  