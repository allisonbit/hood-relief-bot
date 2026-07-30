import { Router } from "express";
import { authenticate, attachUser } from "../middleware/auth.js";
import { uploadMultiple, putFile } from "../utils/upload.js";
import { closeExpiredVoting, VOTE_QUORUM } from "../lib/voting.js";

const VALID_CATEGORIES = ["Medical", "CryptoLoss", "Disaster", "JobLoss", "Other"];
const VOTING_WINDOW_DAYS = 5;
const JWT_SECRET = process.env.JWT_SECRET || "hood-relief-dev-secret";

export default function requestRoutes(prisma) {
  const router = Router();

  // POST /requests — create a new relief request
  router.post("/", authenticate, async (req, res) => {
    try {
      const { category, title, story, amountRequested, walletAddress, transactionHash } = req.body;

      if (!category || !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      if (!title || !title.trim()) return res.status(400).json({ error: "Title required" });
      if (!story || !story.trim()) return res.status(400).json({ error: "Story required" });
      if (!amountRequested || amountRequested <= 0) return res.status(400).json({ error: "Valid amount required" });
      if (!walletAddress) return res.status(400).json({ error: "Payout wallet required" });

      // Transaction hash only for CryptoLoss
      const txHash = category === "CryptoLoss" ? (transactionHash || null) : null;

      const now = new Date();
      const closesAt = new Date(now.getTime() + VOTING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

      const request = await prisma.request.create({
        data: {
          userId: req.userId,
          category,
          title: title.trim(),
          story: story.trim(),
          amountRequested: parseFloat(amountRequested),
          walletAddress: walletAddress.trim(),
          transactionHash: txHash,
          status: "Open",
          votingOpensAt: now,
          votingClosesAt: closesAt,
        },
      });

      res.status(201).json({ request });
    } catch (err) {
      console.error("create request error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET /requests — list requests with optional filters
  router.get("/", async (req, res) => {
    try {
      await closeExpiredVoting(prisma).catch(() => {});
      const { status, category, page = 1, limit = 20 } = req.query;
      const where = {};
      if (status) where.status = status;
      if (category) where.category = category;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [requests, total] = await Promise.all([
        prisma.request.findMany({
          where,
          include: { user: { select: { name: true, walletAddress: true, location: true } } },
          orderBy: { createdAt: "desc" },
          skip,
          take: parseInt(limit),
        }),
        prisma.request.count({ where }),
      ]);

      res.json({ requests, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
      console.error("list requests error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET /requests/:id — single request detail
  router.get("/:id", async (req, res) => {
    try {
      const request = await prisma.request.findUnique({
        where: { id: req.params.id },
        include: { user: { select: { name: true, walletAddress: true, location: true } } },
      });
      if (!request) return res.status(404).json({ error: "Not found" });
      res.json({ request });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET /users/me/requests — current user's requests
  router.get("/mine/list", authenticate, async (req, res) => {
    try {
      const requests = await prisma.request.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
      });
      res.json({ requests });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // POST /requests/:id/evidence — upload evidence files
  router.post("/:id/evidence", authenticate, (req, res) => {
    uploadMultiple(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const request = await prisma.request.findUnique({ where: { id: req.params.id } });
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.userId !== req.userId) return res.status(403).json({ error: "Not your request" });

      const existing = JSON.parse(request.evidenceUrls || "[]");
      const newUrls = await Promise.all(req.files.map(putFile));
      const all = [...existing, ...newUrls];

      const updated = await prisma.request.update({
        where: { id: req.params.id },
        data: { evidenceUrls: JSON.stringify(all) },
      });

      res.json({ evidenceUrls: all, request: updated });
    });
  });

  // POST /requests/:id/vote — cast a vote
  router.post("/:id/vote", authenticate, async (req, res) => {
    try {
      const { choice } = req.body;
      if (!choice || !["Yes", "No"].includes(choice)) {
        return res.status(400).json({ error: "Choice must be Yes or No" });
      }

      const request = await prisma.request.findUnique({ where: { id: req.params.id } });
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "Open") return res.status(400).json({ error: "Voting is closed" });
      if (request.userId === req.userId) return res.status(400).json({ error: "Cannot vote on your own request" });

      const vote = await prisma.vote.create({
        data: {
          requestId: req.params.id,
          voterId: req.userId,
          choice,
        },
      });

      res.status(201).json({ vote });
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Already voted on this request" });
      }
      console.error("vote error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET /requests/:id/votes/summary
  router.get("/:id/votes/summary", async (req, res) => {
    try {
      await closeExpiredVoting(prisma).catch(() => {});
      const requestId = req.params.id;
      const [votesYes, votesNo] = await Promise.all([
        prisma.vote.count({ where: { requestId, choice: "Yes" } }),
        prisma.vote.count({ where: { requestId, choice: "No" } }),
      ]);

      let userHasVoted = false;
      const header = req.headers.authorization;
      if (header && header.startsWith("Bearer ")) {
        try {
          const jwt = await import("jsonwebtoken");
          const payload = jwt.default.verify(header.slice(7), JWT_SECRET);
          const existing = await prisma.vote.findUnique({
            where: { requestId_voterId: { requestId, voterId: payload.userId } },
          });
          userHasVoted = !!existing;
        } catch {}
      }

      res.json({ votesYes, votesNo, votesCast: votesYes + votesNo, userHasVoted, quorum: VOTE_QUORUM });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // POST /requests/:id/flag — report a suspicious case to the admin
  router.post("/:id/flag", authenticate, async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason || !reason.trim()) return res.status(400).json({ error: "Reason required" });

      const request = await prisma.request.findUnique({ where: { id: req.params.id } });
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.userId === req.userId) return res.status(400).json({ error: "Cannot report your own request" });

      const flag = await prisma.flag.create({
        data: { requestId: req.params.id, userId: req.userId, reason: reason.trim().slice(0, 500) },
      });

      res.status(201).json({ flag });
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "You already reported this case" });
      }
      console.error("flag error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET /requests/:id/comments — public discussion thread
  router.get("/:id/comments", async (req, res) => {
    try {
      const comments = await prisma.comment.findMany({
        where: { requestId: req.params.id },
        include: { user: { select: { name: true, walletAddress: true } } },
        orderBy: { createdAt: "asc" },
      });
      res.json({ comments });
    } catch (err) {
      console.error("list comments error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // POST /requests/:id/comments — add a comment
  router.post("/:id/comments", authenticate, async (req, res) => {
    try {
      const { body } = req.body;
      if (!body || !body.trim()) return res.status(400).json({ error: "Comment cannot be empty" });
      if (body.trim().length > 1000) return res.status(400).json({ error: "Comment too long (max 1000 chars)" });

      const request = await prisma.request.findUnique({ where: { id: req.params.id } });
      if (!request) return res.status(404).json({ error: "Request not found" });

      const comment = await prisma.comment.create({
        data: { requestId: req.params.id, userId: req.userId, body: body.trim() },
        include: { user: { select: { name: true, walletAddress: true } } },
      });

      res.status(201).json({ comment });
    } catch (err) {
      console.error("add comment error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}
