import { Router } from "express";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { verifyMessage } from "viem";

const JWT_SECRET = process.env.JWT_SECRET || "hood-relief-dev-secret";

export default function authRoutes(prisma) {
  const router = Router();

  // POST /auth/nonce — generate a nonce for wallet to sign
  router.post("/nonce", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });

      const addr = walletAddress.toLowerCase();
      const nonce = randomUUID();
      const now = new Date();
      const message = `Sign in to Hood Relief Bot.\n\nWallet: ${addr}\nNonce: ${nonce}\nIssued: ${now.toISOString()}`;

      // Expire old unused nonces for this wallet
      await prisma.nonce.updateMany({
        where: { walletAddress: addr, used: false },
        data: { used: true },
      });

      await prisma.nonce.create({
        data: {
          walletAddress: addr,
          nonce,
          message,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
        },
      });

      res.json({ nonce, message });
    } catch (err) {
      console.error("nonce error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // POST /auth/verify — verify signature, issue JWT
  router.post("/verify", async (req, res) => {
    try {
      const { walletAddress, signature } = req.body;
      if (!walletAddress || !signature) {
        return res.status(400).json({ error: "walletAddress and signature required" });
      }

      const addr = walletAddress.toLowerCase();

      // Find the latest unused nonce for this wallet
      const nonceRecord = await prisma.nonce.findFirst({
        where: { walletAddress: addr, used: false, expiresAt: { gt: new Date() } },
        orderBy: { expiresAt: "desc" },
      });

      if (!nonceRecord) {
        return res.status(401).json({ error: "No valid nonce found. Request a new one." });
      }

      // Verify signature using viem
      const valid = await verifyMessage({
        address: walletAddress,
        message: nonceRecord.message,
        signature,
      });

      if (!valid) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      // Mark nonce as used
      await prisma.nonce.update({
        where: { id: nonceRecord.id },
        data: { used: true },
      });

      // Find or create user — first wallet ever becomes admin
      let user = await prisma.user.findUnique({ where: { walletAddress: addr } });
      if (!user) {
        const userCount = await prisma.user.count();
        user = await prisma.user.create({
          data: {
            walletAddress: addr,
            isAdmin: userCount === 0, // first user = admin
          },
        });
        if (user.isAdmin) console.log(`[Auth] First user — ${addr} is now admin`);
      }

      // Issue JWT
      const token = jwt.sign(
        { userId: user.id, walletAddress: addr },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ token, user });
    } catch (err) {
      console.error("verify error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // POST /auth/complete-profile — fill in name/location/bio after wallet auth
  router.post("/complete-profile", async (req, res) => {
    try {
      const header = req.headers.authorization;
      if (!header) return res.status(401).json({ error: "No token" });

      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      const { name, location, bio } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Name is required" });
      }

      const user = await prisma.user.update({
        where: { id: payload.userId },
        data: {
          name: name.trim(),
          location: (location || "").trim(),
          bio: (bio || "").trim() || null,
          profileComplete: true,
        },
      });

      res.json({ user });
    } catch (err) {
      console.error("complete-profile error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}
