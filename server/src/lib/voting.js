// Minimum total votes an open case needs before it can pass — prevents a
// single friendly vote from unlocking the pool. Tunable via VOTE_QUORUM env.
export const VOTE_QUORUM = Math.max(1, parseInt(process.env.VOTE_QUORUM || "3", 10));

// Closes any Open request whose voting window has passed. A case passes only
// when quorum is reached AND Yes beats No; everything else is rejected.
// Called lazily on reads (serverless-friendly) and by the daily cron backstop.
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
    const status = votesYes + votesNo >= VOTE_QUORUM && votesYes > votesNo ? "Passed" : "Rejected";
    await prisma.request.update({ where: { id: request.id }, data: { status } });
  }

  return expired.length;
}
