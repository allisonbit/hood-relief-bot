import { Router } from "express";
import { authenticate } from "../middleware/auth.js";

export default function donationRoutes(prisma) {
  const router = Router();

  // POST /donations/confirm
  router.post("/confirm", authenticate, async (req, res) => {
    try {
      const { amount, txHash } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount required" });
      }

      // If txHash is provided, in production you'd verify on-chain.
      // For now, trust the client since there's no live chain yet.
      // Atomic: the donation row and the donor's running total move together.
      const [donation] = await prisma.$transaction([
        prisma.donation.create({
          data: {
            donorUserId: req.userId,
            donorWalletAddress: req.walletAddress,
            amount: parseFloat(amount),
            txHash: txHash || null,
          },
        }),
        prisma.user.update({
          where: { id: req.userId },
          data: { totalDonated: { increment: parseFloat(amount) } },
        }),
      ]);

      res.status(201).json({ donation });
    } catch (err) {
      console.error("donation error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET /donations/recent — public supporters wall (latest 10)
  router.get("/recent", async (req, res) => {
    try {
      const donations = await prisma.donation.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { donor: { select: { name: true } } },
      });
      res.json({ donations });
    } catch (err) {
      console.error("recent donations error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // GET /donations/leaderboard — top supporters by total donated
  router.get("/leaderboard", async (req, res) => {
    try {
      const leaderboard = await prisma.user.findMany({
        where: { totalDonated: { gt: 0 } },
        orderBy: { totalDonated: "desc" },
        take: 10,
        select: { id: true, name: true, walletAddress: true, totalDonated: true, photoUrl: true },
      });
      res.json({ leaderboard });
    } catch (err) {
      console.error("leaderboard error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}
