/**
 * REAL PostgreSQL Row Level Security certification.
 *
 * This is NOT application-level filtering. It boots PGlite — PostgreSQL 16
 * compiled to WASM, a genuine Postgres engine with a real planner and real
 * RLS — loads the ACTUAL migration files shipped in `supabase/*.sql`, and then
 * runs adversarial cross-user tests as a non-owning `authenticated` role whose
 * identity comes from a request-scoped `auth.uid()` (JWT `sub` claim), exactly
 * like Supabase.
 *
 * If the migrations or policies are wrong, these tests fail — which is how the
 * `v2_agentic.sql` policy quoting bug was caught in Step 21.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const AGENTIC = ["agent_runs", "agent_actions", "change_sets", "change_items", "agent_approvals"];
const ACADEMIC = ["subjects", "tasks", "study_sessions", "resources", "ai_recommendations", "profiles"];

let db: PGlite;

function sql(rel: string): string {
  return readFileSync(path.resolve(__dirname, "../../supabase", rel), "utf8");
}

async function asUser<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  await db.exec("set role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
}

/** Run a query as `userId`, returning rows or the RLS/DB error. */
async function tryQ(
  userId: string,
  text: string,
  params: unknown[] = [],
): Promise<{ ok: boolean; rows: Record<string, unknown>[]; err?: string }> {
  return asUser(userId, async () => {
    try {
      const r = await db.query(text, params);
      return { ok: true, rows: r.rows as Record<string, unknown>[] };
    } catch (e) {
      return { ok: false, rows: [], err: (e as Error).message };
    }
  });
}

beforeAll(async () => {
  db = await PGlite.create();

  // Supabase-like environment: auth schema, auth.users, auth.uid(), roles.
  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key, email text);
    create or replace function auth.uid() returns uuid
      language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
    create role authenticated nologin;
    create role anon nologin;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `);

  // Load the ACTUAL migrations in order — this must not throw.
  for (const f of ["schema.sql", "v2_agentic.sql", "v2_agentic_step19.sql", "v2_agentic_step20.sql"]) {
    await db.exec(sql(f));
  }

  // Table privileges (RLS still gates rows), then seed the two auth users.
  for (const t of [...AGENTIC, ...ACADEMIC]) {
    await db.exec(`grant select, insert, update, delete on public.${t} to authenticated;`);
  }
  await db.exec(
    `insert into auth.users (id,email) values ('${A}','a@test.dev'),('${B}','b@test.dev') on conflict do nothing;`,
  );
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("migrations + policies load into real Postgres", () => {
  it("creates RLS policies on every academic and agentic table", async () => {
    const r = await db.query<{ tablename: string }>(
      "select tablename from pg_policies where schemaname='public'",
    );
    const tables = new Set(r.rows.map((x) => x.tablename));
    for (const t of [...AGENTIC, ...ACADEMIC]) {
      expect(tables.has(t), `missing RLS policy on ${t}`).toBe(true);
    }
  });

  it("enables row level security on every target table", async () => {
    const r = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class
       where relnamespace='public'::regnamespace and relname = any($1)`,
      [[...AGENTIC, ...ACADEMIC]],
    );
    for (const row of r.rows) {
      expect(row.relrowsecurity, `RLS disabled on ${row.relname}`).toBe(true);
    }
  });

  it("keeps uuid primary keys, proposal_hash, mutation_id and the idempotency index", async () => {
    for (const t of AGENTIC) {
      const c = await db.query<{ data_type: string }>(
        `select data_type from information_schema.columns
         where table_schema='public' and table_name=$1 and column_name='id'`,
        [t],
      );
      expect(c.rows[0]?.data_type, `${t}.id`).toBe("uuid");
    }
    const cols = await db.query(
      `select 1 from information_schema.columns
       where table_schema='public' and table_name='change_sets' and column_name='proposal_hash'`,
    );
    expect(cols.rows.length).toBe(1);
    const mut = await db.query(
      `select 1 from information_schema.columns
       where table_schema='public' and table_name='agent_actions' and column_name='mutation_id'`,
    );
    expect(mut.rows.length).toBe(1);
    const idx = await db.query<{ indexname: string }>(
      "select indexname from pg_indexes where schemaname='public' and tablename='agent_actions'",
    );
    expect(idx.rows.some((r) => r.indexname === "idx_agent_actions_mutation_unique")).toBe(true);
  });
});

describe("academic tables enforce owner isolation", () => {
  let aSubject: string;

  it("A creates own subject; B cannot see, update, or delete it", async () => {
    let r = await tryQ(A, "insert into public.subjects (user_id,name,code) values ($1,'A Physics','PHY') returning id", [A]);
    expect(r.ok).toBe(true);
    aSubject = r.rows[0].id as string;

    r = await tryQ(A, "select id from public.subjects");
    expect(r.rows.length).toBe(1);
    expect(r.rows[0].id).toBe(aSubject);

    r = await tryQ(B, "select id from public.subjects where id=$1", [aSubject]);
    expect(r.rows.length).toBe(0);

    r = await tryQ(B, "update public.subjects set name='hacked' where id=$1 returning id", [aSubject]);
    expect(r.rows.length).toBe(0);

    r = await tryQ(B, "delete from public.subjects where id=$1 returning id", [aSubject]);
    expect(r.rows.length).toBe(0);
  });

  it("A cannot forge a row owned by B (WITH CHECK)", async () => {
    const r = await tryQ(A, "insert into public.subjects (user_id,name,code) values ($1,'forged','X') returning id", [B]);
    expect(r.ok).toBe(false);
  });

  it("study_sessions (the agentic write target) are isolated per owner", async () => {
    let r = await tryQ(
      A,
      "insert into public.study_sessions (user_id,title,planned_date,duration_minutes) values ($1,'A session','2026-09-20',60) returning id",
      [A],
    );
    expect(r.ok).toBe(true);
    const aSession = r.rows[0].id as string;

    r = await tryQ(A, "update public.study_sessions set duration_minutes=90 where id=$1 returning id", [aSession]);
    expect(r.rows.length).toBe(1);

    r = await tryQ(B, "select id from public.study_sessions");
    expect(r.rows.length).toBe(0);

    r = await tryQ(B, "update public.study_sessions set title='stolen' where id=$1 returning id", [aSession]);
    expect(r.rows.length).toBe(0);

    r = await tryQ(B, "delete from public.study_sessions where id=$1 returning id", [aSession]);
    expect(r.rows.length).toBe(0);

    r = await tryQ(A, "delete from public.study_sessions where id=$1 returning id", [aSession]);
    expect(r.rows.length).toBe(1);
  });

  it("tasks and resources are isolated per owner", async () => {
    const t = await tryQ(A, "insert into public.tasks (user_id,title) values ($1,'A task') returning id", [A]);
    expect(t.ok).toBe(true);
    const tSeen = await tryQ(B, "select id from public.tasks where id=$1", [t.rows[0].id]);
    expect(tSeen.rows.length).toBe(0);

    await tryQ(A, "insert into public.resources (user_id,title) values ($1,'A note') returning id", [A]);
    const rSeen = await tryQ(B, "select id from public.resources");
    expect(rSeen.rows.length).toBe(0);
  });
});

describe("agentic audit tables enforce owner isolation", () => {
  it("A creates a full run/change-set/approval graph; B cannot read any of it", async () => {
    let r = await tryQ(A, "insert into public.agent_runs (user_id,intent,status) values ($1,'optimize_schedule','completed') returning id", [A]);
    expect(r.ok).toBe(true);
    const aRun = r.rows[0].id as string;

    expect((await tryQ(B, "select id from public.agent_runs")).rows.length).toBe(0);

    r = await tryQ(A, "insert into public.change_sets (agent_run_id,user_id,title,status,proposal_hash) values ($1,$2,'A plan','pending','deadbeef') returning id", [aRun, A]);
    expect(r.ok).toBe(true);
    const aSet = r.rows[0].id as string;
    expect((await tryQ(B, "select id from public.change_sets where id=$1", [aSet])).rows.length).toBe(0);

    r = await tryQ(A, "insert into public.change_items (change_set_id,user_id,operation,entity_type,payload) values ($1,$2,'create','study_session','{}'::jsonb) returning id", [aSet, A]);
    expect(r.ok).toBe(true);
    expect((await tryQ(B, "select id from public.change_items where change_set_id=$1", [aSet])).rows.length).toBe(0);

    r = await tryQ(A, "insert into public.agent_approvals (agent_run_id,change_set_id,user_id,status,change_set_hash) values ($1,$2,$3,'approved','deadbeef') returning id", [aRun, aSet, A]);
    expect(r.ok).toBe(true);
    expect((await tryQ(B, "select id from public.agent_approvals")).rows.length).toBe(0);
  });

  it("the (user_id, mutation_id) idempotency ledger blocks duplicates but is per-user", async () => {
    const aRun = (await tryQ(A, "insert into public.agent_runs (user_id,intent,status) values ($1,'optimize_schedule','completed') returning id", [A])).rows[0].id;
    const first = await tryQ(A, "insert into public.agent_actions (agent_run_id,user_id,tool_name,mutation_id,status) values ($1,$2,'create_session','ledger-1','executed') returning id", [aRun, A]);
    expect(first.ok).toBe(true);

    // Same user + same mutation_id -> rejected by the unique index (idempotency).
    const dup = await tryQ(A, "insert into public.agent_actions (agent_run_id,user_id,tool_name,mutation_id,status) values ($1,$2,'create_session','ledger-1','executed') returning id", [aRun, A]);
    expect(dup.ok).toBe(false);

    // A different user may reuse the same mutation_id string (not a global lock).
    const bRun = (await tryQ(B, "insert into public.agent_runs (user_id,intent,status) values ($1,'optimize_schedule','completed') returning id", [B])).rows[0].id;
    const bDup = await tryQ(B, "insert into public.agent_actions (agent_run_id,user_id,tool_name,mutation_id,status) values ($1,$2,'create_session','ledger-1','executed') returning id", [bRun, B]);
    expect(bDup.ok).toBe(true);
  });
});

describe("unauthenticated access", () => {
  it("a session with no auth.uid() sees zero rows under RLS", async () => {
    await db.exec("set role authenticated;");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    const r = await db.query<{ n: number }>("select count(*)::int as n from public.subjects");
    await db.exec("reset role;");
    expect(r.rows[0].n).toBe(0);
  });
});
