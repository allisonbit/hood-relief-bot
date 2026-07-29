import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import prisma from "./db.js";
import { closeExpiredVoting } from "./lib/voting.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import requestRoutes from "./routes/requests.js";
import ledgerRoutes from "./routes/ledger.js";
import poolRoutes from "./routes/pool.js";
import donationRoutes from "./routes/donations.js";
import adminRoutes from "./routes/admin.js";

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Rate limit auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests, try again later" },
});

// All routes are mounted under /api so the same paths work locally (Vite proxy)
// and on Vercel (where the function receives /api/*).
app.use("/api/auth", authLimiter, authRoutes(prisma));
app.use("/api/users", userRoutes(prisma));
app.use("/api/requests", requestRoutes(prisma));
app.use("/api/ledger", ledgerRoutes(prisma));
app.use("/api/pool", poolRoutes(prisma));
app.use("/api/donations", donationRoutes(prisma));
app.use("/api/admin", adminRoutes(prisma));

// GET /api/categories — static list
app.get("/api/categories", (req, res) => {
  res.json({ categories: ["Medical", "CryptoLoss", "Disaster", "JobLoss", "Other"] });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Daily Vercel Cron backstop for closing expired voting windows.
// Protected by CRON_SECRET (Vercel sends it as a Bearer token when configured).
app.get("/api/cron/close-voting", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const closed = await closeExpiredVoting(prisma);
    res.json({ closed });
  } catch (err) {
    console.error("cron close-voting error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default app;
