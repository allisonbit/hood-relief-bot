import { Router } from "express";
import { authenticate, attachUser, requireAdmin } from "../middleware/auth.js";

export default function adminRoutes(prisma) {
  const router = Router();

  // All admin routes require auth + the one permanent admin wallet
  router.use(authenticate);
  router.use(attachUser(prisma));
  router.use(requireAdmin);

  // GET /admin/overview — full platform stats at a glance
  router.get("/overview", async (req, res) => {
    try {
      const [donated, released, members, openCases, pendingReleases, totalRequests, totalVotes, totalComments, totalDonations] = await Promise.all([
        prisma.donation.aggregate({ _sum: { amount: true } }),
        prisma.ledgerEntry.aggregate({ _sum: { amount: true } }),
        prisma.user.count(),
        prisma.request.count({ where: { status: "Open" } }),
        prisma.request.count({ where: { status: "Passed" } }),
        prisma.request.count(),
        prisma.vote.count(),
        prisma.comment.count(),
        prisma.donation.count(),
      ]);
      const totalDonated = donated._sum.amount || 0;
      const totalReleased = released._sum.amount || 0;
      res.json({
        poolBalance: Math.max(0, totalDonated - totalReleased),
        totalDonated,
        totalReleased,
        members,
        openCases,
        pendingReleases,
        totalRequests,
        totalVotes,
        totalComments,
        totalDonations,
      });
    } catch (err) {
      console.error("admin overview error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET /admin/users — member directory
  router.get("/users", async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true, walletAddress: true, name: true, location: true,
          totalReceived: true, totalDonated: true, isAdmin: true,
          profileComplete: true, createdAt: true,
          _count: { select: { requests: true, votes: true } },
        },
      });
      res.json({ users });
    } catch (err) {
      console.error("admin users error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET /admin/donations — full donation records
  router.get("/donations", async (req, res) => {
    try {
      const donations = await prisma.donation.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { donor: { select: { name: true } } },
      });
      res.json({ donations });
    } catch (err) {
      console.error("admin donations error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET /admin/logs — admin action audit trail
  router.get("/logs", async (req, res) => {
    try {
      const logs = await prisma.adminActionLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { admin: { select: { name: true, walletAddress: true } } },
      });
      res.json({ logs });
    } catch (err) {
      console.error("admin logs error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET /admin/requests?status=Passed — list requests awaiting release
  router.get("/requests", async (req, res) => {
    try {
      const { status = "Passed" } = req.query;
      const requests = await prisma.request.findMany({
        where: { status },
        include: { user: { select: { name: true, walletAddress: true } } },
        orderBy: { updatedAt: "desc" },
      });
      res.json({ requests });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // POST /admin/requests/:id/release — mark as released, create ledger entry
  router.post("/requests/:id/release", async (req, res) => {
    try {
      const { payoutTxHash } = req.body;
      const request = await prisma.request.findUnique({ where: { id: req.params.id } });
      if (!request) return res.status(404).json({ error: "Not found" });
      if (request.status !== "Passed") {
        return res.status(400).json({ error: `Cannot release a request with status: ${request.status}` });
      }

      // Never release more than the pool actually holds
      const [donated, released] = await Promise.all([
        prisma.donation.aggregate({ _sum: { amount: true } }),
        prisma.ledgerEntry.aggregate({ _sum: { amount: true } }),
      ]);
      const poolBalance = (donated._sum.amount || 0) - (released._sum.amount || 0);
      if (request.amountRequested > poolBalance) {
        return res.status(400).json({ error: `Insufficient pool balance: $${poolBalance.toLocaleString()} available, $${request.amountRequested.toLocaleString()} requested` });
      }

      // Wrap in transaction
      const [updated, ledger] = await prisma.$transaction([
        prisma.request.update({
          where: { id: request.id },
          data: { status: "Released" },
        }),
        prisma.ledgerEntry.create({
          data: {
            requestId: request.id,
            walletAddress: request.walletAddress,
            amount: request.amountRequested,
            category: request.category,
            note: `${request.title} — released after community vote.`,
            releasedByAdminId: req.userId,
            payoutTxHash: payoutTxHash || null,
          },
        }),
      ]);

      // Update recipient's totalReceived
      await prisma.user.update({
        where: { id: request.userId },
        data: { totalReceived: { increment: request.amountRequested } },
      });

      // Log action
      await prisma.adminActionLog.create({
        data: {
          adminId: req.userId,
          action: "release",
          requestId: request.id,
          reason: `Released $${request.amountRequested} to ${request.walletAddress}`,
        },
      });

      res.json({ request: updated, ledgerEntry: ledger });
    } catch (err) {
      console.error("release error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // POST /admin/requests/:id/reject — reject a passed request
  router.post("/requests/:id/reject", async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ error: "Reason required" });

      const request = await prisma.request.findUnique({ where: { id: req.params.id } });
      if (!request) return res.status(404).json({ error: "Not found" });

      const updated = await prisma.request.update({
        where: { id: request.id },
        data: { status: "Rejected" },
      });

      await prisma.adminActionLog.create({
        data: {
          adminId: req.userId,
          action: "reject",
          requestId: request.id,
          reason,
        },
      });

      res.json({ request: updated });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}
