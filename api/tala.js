// Vercel Function for Tala's live AI, served at /api/tala-chat
// (vercel.json rewrites /api/tala-chat → /api/tala).
//
// It is deliberately NOT named tala-chat.js: under `npm run dev`, Vite would
// serve a file at /api/tala-chat as source code instead of letting the
// TanStack route (src/routes/api/tala-chat.ts) answer.
//
// All logic lives in server/tala.js. Set OPENROUTER_API_KEY in
// Vercel → Project → Settings → Environment Variables, then redeploy.
import { handleTalaRequest } from "../server/tala.js";

export function GET(request) {
  return handleTalaRequest(request, process.env);
}

export function POST(request) {
  return handleTalaRequest(request, process.env);
}
