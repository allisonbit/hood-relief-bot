// Loads local env vars for `node server/src/index.js`, regardless of CWD.
// Reads the repo-root .env.local (pulled via `vercel env pull`) then .env.
// On Vercel, env vars come from the platform and this file is not used.
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, ".env") });
