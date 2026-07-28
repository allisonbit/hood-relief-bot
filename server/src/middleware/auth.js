import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "hood-relief-dev-secret";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.walletAddress = payload.walletAddress;
    next();
  } catch {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function attachUser(prisma) {
  return async (req, res, next) => {
    if (req.userId) {
      req.user = await prisma.user.findUnique({ where: { id: req.userId } });
    }
    next();
  };
}
