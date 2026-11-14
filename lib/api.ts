export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3009"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface Options {
  userId?: string | null;
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  signal?: AbortSignal;
}

/** Calls the backend. The dev identity is sent as the x-user-id header. */
export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const res = await fetch(API_URL + path, {
    method: opts.method ?? "GET",
    signal: opts.signal,
    headers: {
      ...(opts.body !== undefined && { "Content-Type": "application/json" }),
      ...(opts.userId && { "x-user-id": opts.userId }),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const j = await res.json();
      message = Array.isArray(j.message) ? j.message.join(", ") : (j.message ?? message);
    } catch {}
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}
