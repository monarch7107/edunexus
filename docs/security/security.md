# EduNexus — Security Model

## Authentication & identity

- Supabase Auth (email/password) in Supabase mode; cookie-based session in
  demo mode (`lib/session-cookie.ts`).
- Middleware (`middleware.ts`) protects all private routes in both modes and
  bounces signed-in users off auth pages. In Supabase mode it uses
  `@supabase/ssr` with ordered cookie replay (`lib/supabase/cookie-sync.ts`)
  so a refreshed (or cleared) session is never dropped on redirects.
- **Server-derived identity.** API routes resolve the user from the session
  (Supabase `auth.getUser()`) or the demo cookie. The V2 AI gateway
  **rejects client-supplied `user_id`** (`rejectClientUserId`).
- Auth failures fail **closed** (401), never "open by default".

## Authorization & data ownership

- **RLS on every table** (V1 and V2): `auth.uid() = user_id`. RLS is the
  gate; the anon key is public by design.
- Ownership is enforced again at the repository layer (every query
  re-filtered by `user_id`) and in the AI tool execution path — defense in
  depth, not a single line of defense.
- The **service-role key is never used or referenced** in this repository
  (verified by secret scan; the scan also confirms no hardcoded secrets and
  no tracked `.env` files — only `.env.example`).

## Secrets & environment

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client-safe | anon key is public by design; RLS gates access |
| `OPENAI_API_KEY` | **server-only** | used only by `app/api/recommend`; never shipped to the browser |
| `OPENAI_BASE_URL`, `OPENAI_MODEL` | server config | any OpenAI-compatible endpoint; default `gpt-4o-mini` |

There is no service-role credential, no private database credential, and no
secrets in `components/`, `public/`, or client bundles.

## AI security

See `docs/ai/safety-and-agent-model.md` for the full layer-by-layer model
(server identity, client `user_id` rejection, bounded bodies, tool
allowlists, proposal hashes, mutation idempotency, verification rereads,
prompt-injection posture, account isolation).

## Offline & PWA security

- The service worker (`public/sw.js`) caches **only the public shell**
  (landing, auth pages, manifest, icon, static assets). It **never** caches
  `/api/*` or private pages.
- The offline queue (`lib/offline/queue.ts`) stores **only allowlisted
  mutation kinds** (task/session create/update/delete/status) — no secrets,
  no arbitrary payloads — and is **isolated per account** (`isolateAccount`)
  so switching accounts never flushes another student's work.
- AI planning is never queued or executed offline; the UI says AI is
  unavailable offline instead of faking it.
- Reconnect sync compares `expected` state before update/delete (conflict ⇒
  server wins, user is told).

## Known, honestly-documented items

These are **known and accepted** with documented rationale — not claims of
"zero issues":

1. **Supabase advisor: `handle_new_user()` is `SECURITY DEFINER` callable in
   the auth schema flow.** Standard Supabase pattern (trigger on
   `auth.users`, `SET search_path = public`, inserts only the new user's own
   profile row, `on conflict do nothing`). The advisor flags all
   `SECURITY DEFINER` functions; mitigations (e.g. `pgsodium`-style
   hardening) are not applied because the function's surface is minimal and
   audited.
2. **Supabase advisor: `SECURITY DEFINER` function callable by
   authenticated/anon roles** (same root cause — the platform reports
   definer functions in its list). Same disposition as above.
3. **Leaked Password Protection disabled** in the hosted project's auth
   configuration (V1-era setting). Documented as a project-settings item for
   the team to enable on the Supabase console; it does not affect RLS or the
   application code.
4. **Demo-mode password hashing is SHA-256** (local-only, browser
   localStorage) — acceptable for a zero-infrastructure demo, explicitly not
   a production credential store; Supabase mode uses Supabase Auth.
5. **`npm audit` flags the Next.js 14 dependency tree.** Remediation
   requires a major framework upgrade, deliberately deferred as out of scope
   for the SIH prototype (see `README.md` → Testing & quality).
6. **One ESLint warning** (`react-hooks/exhaustive-deps` in
   `lib/offline/use-offline-sync.ts`) — the dependency array is
   deliberately minimal so account switches don't double-flush; tracked as
   technical debt with a regression test on the sync engine.
