/**
 * Bounded JSON body reading for API routes.
 *
 * Unbounded request bodies are a memory-exhaustion vector, so every JSON API
 * route must reject oversized bodies with 413 *before* parsing. The
 * content-length check is the cheap first gate; the post-read size check
 * protects against chunked transfers that omit the header.
 */
import { AI_LIMITS } from "@/lib/ai/types";

export type BoundedJson =
  | { ok: true; value: unknown; byteLength: number }
  | { ok: false; status: number; error: string };

export async function readBoundedJson(
  request: Request,
  maxBytes: number = AI_LIMITS.maxTransportBytes,
): Promise<BoundedJson> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > maxBytes) {
      return { ok: false, status: 413, error: "Request too large." };
    }
  }
  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, status: 400, error: "Invalid request body." };
  }
  const byteLength = new TextEncoder().encode(text).length;
  if (byteLength > maxBytes) {
    return { ok: false, status: 413, error: "Request too large." };
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, error: "Invalid request body." };
  }
  return { ok: true, value, byteLength };
}
