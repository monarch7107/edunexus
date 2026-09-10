/**
 * Migrations must be safe to re-run (idempotent).
 *
 * A hosted Supabase setup often re-runs the SQL files (troubleshooting, partial
 * applies, re-deploys). Applying every migration TWICE into a real PostgreSQL
 * engine (PGlite) must not error — this caught a non-idempotent `create policy`
 * in schema.sql (the three profiles_* policies) during Step 22.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const FILES = ["schema.sql", "v2_agentic.sql", "v2_agentic_step19.sql", "v2_agentic_step20.sql"];
let db: PGlite;

function sql(rel: string): string {
  return readFileSync(path.resolve(__dirname, "../../supabase", rel), "utf8");
}

beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key, email text);
    create or replace function auth.uid() returns uuid
      language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
  `);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("supabase migrations are idempotent", () => {
  it("apply cleanly on the first pass", async () => {
    for (const f of FILES) {
      await expect(db.exec(sql(f)), `first apply of ${f}`).resolves.toBeDefined();
    }
  });

  it("re-apply cleanly on a second pass (no 'already exists' errors)", async () => {
    for (const f of FILES) {
      await expect(db.exec(sql(f)), `re-apply of ${f}`).resolves.toBeDefined();
    }
  });

  it("results in exactly the expected tables and policies", async () => {
    const tab = await db.query<{ n: number }>(
      "select count(*)::int n from information_schema.tables where table_schema='public'",
    );
    // 6 academic (profiles, subjects, tasks, study_sessions, resources,
    // ai_recommendations) + 5 agentic (agent_runs, agent_actions, change_sets,
    // change_items, agent_approvals) = 11.
    expect(tab.rows[0].n).toBe(11);
    const pol = await db.query<{ n: number }>(
      "select count(*)::int n from pg_policies where schemaname='public'",
    );
    // 3 profiles_* + 5 academic *_all_own + 5 agentic *_all_own = 13.
    expect(pol.rows[0].n).toBe(13);
  });
});
