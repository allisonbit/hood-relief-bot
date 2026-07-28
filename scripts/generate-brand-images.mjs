// Generates the brand PNGs (OG share image + app icon) with zero dependencies.
// Run: node scripts/generate-brand-images.mjs
import zlib from "zlib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public");

const CREAM = [247, 244, 233];
const LEMON = [196, 229, 56];
const INK = [28, 28, 20];

// ── Minimal PNG encoder (8-bit RGB, no filters) ──────────────────────────────
const crcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function png(width, height, pixelFn) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y);
      raw[o++] = r; raw[o++] = g; raw[o++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Shape tests ───────────────────────────────────────────────────────────────
// Classic heart curve: (x² + y² − 1)³ − x²y³ ≤ 0
function inHeart(px, py, cx, cy, size) {
  const x = (px - cx) / size;
  const y = -(py - cy) / size + 0.12;
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

function inRoundedRect(px, py, x0, y0, w, h, r) {
  if (px < x0 || px >= x0 + w || py < y0 || py >= y0 + h) return false;
  const dx = Math.max(x0 + r - px, px - (x0 + w - r), 0);
  const dy = Math.max(y0 + r - py, py - (y0 + h - r), 0);
  return dx * dx + dy * dy <= r * r;
}

// ── OG share image: 1200×630, cream bg, lemon heart with ink heart inside ────
const og = png(1200, 630, (x, y) => {
  if (inHeart(x, y, 600, 300, 130)) return INK;
  if (inHeart(x, y, 600, 305, 215)) return LEMON;
  // subtle lemon corner accents
  if (inHeart(x, y, 120, 90, 42) || inHeart(x, y, 1080, 540, 42)) return LEMON;
  return CREAM;
});
fs.writeFileSync(path.join(OUT, "og-image.png"), og);
console.log("public/og-image.png written");

// ── App icon: 512×512, lemon rounded square, ink heart ───────────────────────
const icon = png(512, 512, (x, y) => {
  if (!inRoundedRect(x, y, 0, 0, 512, 512, 115)) return [255, 255, 255];
  if (inHeart(x, y, 256, 252, 150)) return INK;
  return LEMON;
});
fs.writeFileSync(path.join(OUT, "icon-512.png"), icon);
console.log("public/icon-512.png written");
