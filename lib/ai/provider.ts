/**
 * OpenAI-compatible provider call for V2.
 *
 * Mirrors the V1 conventions in lib/ai-server.ts: server-only, bounded by
 * a timeout, classified failures, and diagnostics that log the failure
 * class ONLY — never keys, prompts or student data.
 */

import { AI_LIMITS } from "./limits";
import { logAgentDiagnostic, type AgentErrorClass } from "./errors";

export interface ProviderDeps {
  fetchImpl?: typeof fetch;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
  model?: string | undefined;
  timeoutMs?: number | undefined;
}

export type ProviderOutcome =
  | { ok: true; content: string }
  | { ok: false; failure: AgentErrorClass };

export function isProviderConfigured(deps?: ProviderDeps): boolean {
  const key = deps?.apiKey ?? process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim());
}

/** Request a JSON completion. Returns raw text; parsing happens upstream. */
export async function callProvider(
  system: string,
  user: string,
  deps?: ProviderDeps,
): Promise<ProviderOutcome> {
  const apiKey = deps?.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    logAgentDiagnostic("provider", "config");
    return { ok: false, failure: "config" };
  }

  const base = (
    deps?.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = deps?.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const timeoutMs = deps?.timeoutMs ?? AI_LIMITS.PROVIDER_TIMEOUT_MS;
  const fetchImpl = deps?.fetchImpl ?? fetch;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetchImpl(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = (error as Error | null)?.name === "AbortError";
    const failure: AgentErrorClass = aborted ? "timeout" : "network";
    logAgentDiagnostic("provider", failure);
    return { ok: false, failure };
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logAgentDiagnostic("provider", "config", { status: res.status });
      return { ok: false, failure: "config" };
    }
    logAgentDiagnostic("provider", "provider", { status: res.status });
    return { ok: false, failure: "provider" };
  }

  try {
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content || !content.trim()) throw new Error("empty completion");
    if (content.length > AI_LIMITS.MAX_MODEL_OUTPUT_CHARS) {
      logAgentDiagnostic("provider", "malformed");
      return { ok: false, failure: "malformed" };
    }
    return { ok: true, content };
  } catch {
    logAgentDiagnostic("provider", "malformed");
    return { ok: false, failure: "malformed" };
  }
}
