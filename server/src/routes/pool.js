import { Router } from "express";

export default function poolRoutes(prisma) {
  const router = Router();

  // GET /pool/stats
  router.get("/stats", async (req, res) => {
    try {
      const [
        totalDonated,
        totalReleased,
        openCases,
        members,
      ] = await Promise.all([
        prisma.donation.aggregate({ _sum: { amount: true } }),
        prisma.ledgerEntry.aggregate({ _sum: { amount: true } }),
        prisma.request.count({ where: { status: "Open" } }),
        prisma.user.count(),
      ]);

      const donated = totalDonated._sum.amount || 0;
      const released = totalReleased._sum.amount || 0;
      const poolBalance = donated - released;

      res.json({
        poolBalance: Math.max(0, poolBalance),
        totalReleased: released,
        totalDonated: donated,
        openCases,
        members,
      });
    } catch (err) {
      console.error("pool stats error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}
