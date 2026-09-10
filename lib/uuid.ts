/**
 * RFC-4122 v4 UUID for records that Supabase stores with `uuid` primary keys
 * (agent_runs, agent_actions, change_sets, change_items, agent_approvals).
 * The demo `uid()` helper stays for local workspace records.
 */
export function uuidv4(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // Runtime fallback (Node < 18.17 / old browsers) — still format-correct.
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
