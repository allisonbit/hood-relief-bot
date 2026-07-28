import { Router } from "express";

export default function ledgerRoutes(prisma) {
  const router = Router();

  // GET /ledger — paginated public ledger
  router.get("/", async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [entries, total] = await Promise.all([
        prisma.ledgerEntry.findMany({
          orderBy: { releasedAt: "desc" },
          skip,
          take: parseInt(limit),
        }),
        prisma.ledgerEntry.count(),
      ]);

      res.json({ entries, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
      console.error("ledger error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}
