// Types for server/tala.js (plain JS so the Vercel Function can use it without a build step).
export declare function handleTalaRequest(
  request: Request,
  env: Record<string, string | undefined>,
): Promise<Response>;

export declare const __test: {
  cleanMessages(raw: unknown): { role: "user" | "assistant"; content: string }[];
  originAllowed(env: Record<string, string | undefined>, request: Request): boolean;
  resetCaches(): void;
};
