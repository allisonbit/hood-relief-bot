import cron from "node-cron";

export function startVotingCloserJob(prisma) {
  // Run every 2 minutes
  cron.schedule("*/2 * * * *", async () => {
    try {
      const now = new Date();
      const expired = await prisma.request.findMany({
        where: {
          status: "Open",
          votingClosesAt: { lte: now },
        },
      });

      for (const request of expired) {
        const votesYes = await prisma.vote.count({ where: { requestId: request.id, choice: "Yes" } });
        const votesNo = await prisma.vote.count({ where: { requestId: request.id, choice: "No" } });

        const newStatus = votesYes > votesNo ? "Passed" : "Rejected";

        await prisma.request.update({
          where: { id: request.id },
          data: { status: newStatus },
        });

        console.log(`[VotingCloser] Request ${request.id} → ${newStatus} (${votesYes}Y/${votesNo}N)`);
      }

      if (expired.length > 0) {
        console.log(`[VotingCloser] Closed ${expired.length} voting window(s)`);
      }
    } catch (err) {
      console.error("[VotingCloser] Error:", err);
    }
  });

  console.log("[VotingCloser] Cron job started (every 2 min)");
}
