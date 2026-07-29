// Closes any Open request whose voting window has passed, deciding pass/reject
// by simple majority. Called lazily on reads (serverless-friendly) and by the
// daily Vercel cron backstop.
export async function closeExpiredVoting(prisma) {
  const now = new Date();
  const expired = await prisma.request.findMany({
    where: { status: "Open", votingClosesAt: { lte: now } },
  });

  for (const request of expired) {
    const [votesYes, votesNo] = await Promise.all([
      prisma.vote.count({ where: { requestId: request.id, choice: "Yes" } }),
      prisma.vote.count({ where: { requestId: request.id, choice: "No" } }),
    ]);
    const status = votesYes > votesNo ? "Passed" : "Rejected";
    await prisma.request.update({ where: { id: request.id }, data: { status } });
  }

  return expired.length;
}
