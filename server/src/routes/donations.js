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
      const donation = await prisma.donation.create({
        data: {
          donorUserId: req.userId,
          donorWalletAddress: req.walletAddress,
          amount: parseFloat(amount),
          txHash: txHash || null,
        },
      });

      // Update user's totalDonated
      await prisma.user.update({
        where: { id: req.userId },
        data: { totalDonated: { increment: parseFloat(amount) } },
      });

      res.status(201).json({ donation });
    } catch (err) {
      console.error("donation error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}
