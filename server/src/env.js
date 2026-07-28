// Loads server/.env regardless of the directory the process is launched from.
// Must be the FIRST import in index.js so every module sees the env vars.
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
