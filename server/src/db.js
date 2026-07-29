import { PrismaClient } from "@prisma/client";

// Single Prisma instance reused across warm serverless invocations so we
// don't exhaust Postgres connections on Vercel. Cached on globalThis.
const globalForPrisma = globalThis;
const prisma = globalForPrisma.__hoodReliefPrisma || new PrismaClient();
if (!globalForPrisma.__hoodReliefPrisma) globalForPrisma.__hoodReliefPrisma = prisma;

export default prisma;
