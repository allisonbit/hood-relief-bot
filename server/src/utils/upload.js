import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// Resolve the uploads dir relative to this file so it works from any CWD,
// and make sure it exists before multer tries to write into it.
const UPLOAD_DIR = process.env.UPLOAD_DIR && path.isAbsolute(process.env.UPLOAD_DIR)
  ? process.env.UPLOAD_DIR
  : path.join(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
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
