import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || "./uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: jpg, png, webp, pdf"), false);
  }
}

export const uploadSingle = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } }).single("file");
export const uploadMultiple = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } }).array("files", 10);
