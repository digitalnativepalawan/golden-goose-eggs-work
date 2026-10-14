// /api/tala-chat for `npm run dev` / a full TanStack Start deploy.
// Same implementation as the Vercel Function (api/tala-chat.js); see
// server/tala.js for the security model. Put OPENROUTER_API_KEY in .env.
import { createFileRoute } from "@tanstack/react-router";
import { handleTalaRequest } from "../../../server/tala.js";

export const Route = createFileRoute("/api/tala-chat")({
  server: {
    handlers: {
      GET: ({ request }) => handleTalaRequest(request, process.env),
      POST: ({ request }) => handleTalaRequest(request, process.env),
    },
  },
});
