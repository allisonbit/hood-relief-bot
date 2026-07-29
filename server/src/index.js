// Local development entry point only. On Vercel the app is served as a
// serverless function via /api/index.js (which imports ./app.js directly).
import "./env.js";
import app from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Hood Relief API running on http://localhost:${PORT}`);
});
