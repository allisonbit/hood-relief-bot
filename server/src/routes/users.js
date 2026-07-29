import { Router } from "express";
import { authenticate, attachUser } from "../middleware/auth.js";
import { uploadSingle, putFile } from "../utils/upload.js";

export default function userRoutes(prisma) {
  const router = Router();

  // GET /users/me
  router.get("/me", authenticate, attachUser(prisma), async (req, res) => {
    if (!req.user) return res.status(404).json({ error: "User not found" });
    res.json({ user: req.user });
  });

  // PATCH /users/me
  router.patch("/me", authenticate, async (req, res) => {
    try {
      const { name, location, bio } = req.body;
      const data = {};
      if (name !== undefined) data.name = name.trim();
      if (location !== undefined) data.location = location.trim();
      if (bio !== undefined) data.bio = bio.trim() || null;
      if (data.name) data.profileComplete = true;

      const user = await prisma.user.update({
        where: { id: req.userId },
        data,
      });
      res.json({ user });
    } catch (err) {
      console.error("patch user error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // POST /users/me/photo
  router.post("/me/photo", authenticate, (req, res) => {
    uploadSingle(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      let photoUrl;
      try {
        photoUrl = await putFile(req.file);
      } catch {
        return res.status(500).json({ error: "Upload failed" });
      }
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { photoUrl },
      });
      res.json({ photoUrl, user });
    });
  });

  return router;
}
