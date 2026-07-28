import { Router } from "express";
import { authenticate, attachUser, requireAdmin } from "../middleware/auth.js";

export default function adminRoutes(prisma) {
  const router = Router();

  // All admin routes require auth + admin role
  router.use(authenticate);
  router.use(attachUser(prisma));
  router.use(requireAdmin);

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
