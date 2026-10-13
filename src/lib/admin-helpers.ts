/** Shared helpers for the SANVIC admin screens. */

export type Token = string | null;

/** Call an admin API action. Throws with the server's message on failure. */
export async function call(
  token: Token,
  action: string,
  params: Record<string, string> = {},
  init?: RequestInit,
) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`/api/admin?${qs}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}