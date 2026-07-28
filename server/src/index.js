import "./env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import requestRoutes from "./routes/requests.js";
import ledgerRoutes from "./routes/ledger.js";
import poolRoutes from "./routes/pool.js";
import donationRoutes from "./routes/donations.js";
import adminRoutes from "./routes/admin.js";
import { startVotingCloserJob } from "./jobs/closeVoting.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

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

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/auth", authLimiter, authRoutes(prisma));
app.use("/users", userRoutes(prisma));
app.use("/requests", requestRoutes(prisma));
app.use("/ledger", ledgerRoutes(prisma));
app.use("/pool", poolRoutes(prisma));
app.use("/donations", donationRoutes(prisma));
app.use("/admin", adminRoutes(prisma));

// GET /categories — static list
app.get("/categories", (req, res) => {
  res.json({ categories: ["Medical", "CryptoLoss", "Disaster", "JobLoss", "Other"] });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start voting closer cron job
startVotingCloserJob(prisma);

app.listen(PORT, () => {
  console.log(`Hood Relief API running on http://localhost:${PORT}`);
});
