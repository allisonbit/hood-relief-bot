import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: jpg, png, webp, pdf"), false);
  }
}

// Parse multipart in memory; the buffer is then streamed to Vercel Blob.
const memory = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: MAX_SIZE } });

export const uploadSingle = memory.single("file");
export const uploadMultiple = memory.array("files", 10);

// Uploads one parsed file to Vercel Blob and returns its public URL.
// Requires BLOB_READ_WRITE_TOKEN in the environment (auto-set on Vercel).
export async function putFile(file) {
  const ext = path.extname(file.originalname) || "";
  const key = `${randomUUID()}${ext}`;
  const { url } = await put(key, file.buffer, {
    access: "public",
    contentType: file.mimetype,
  });
  return url;
}
