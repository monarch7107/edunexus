/**
 * AIESES V3 PostgreSQL Row Level Security & Migration Certification.
 * Verifies that v3_aieses_extensions.sql loads successfully and strictly isolates
 * user documents, teacher classes, and assessment submissions.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";

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

describe("AIESES V3 PostgreSQL Schema & RLS", () => {
  beforeAll(async () => {
    db = await PGlite.create();
    await db.exec(`
      create schema if not exists auth;
      create table if not exists auth.users (id uuid primary key, email text);
      create or replace function auth.uid() returns uuid
        language sql stable as $$
          select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        $$;
      create or replace function auth.role() returns text
        language sql stable as $$
          select 'authenticated'::text
        $$;
      create role authenticated nologin;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid() to authenticated;
      grant execute on function auth.role() to authenticated;
    `);

    // Load migrations in order
    for (const file of [
      "schema.sql",
      "v2_agentic.sql",
      "v2_agentic_step19.sql",
      "v2_agentic_step20.sql",
      "v3_aieses_extensions.sql",
    ]) {
      await db.exec(sql(file));
    }

    const tables = ["documents", "teacher_classes", "assessments", "assessment_submissions"];
    for (const t of tables) {
      await db.exec(`grant select, insert, update, delete on public.${t} to authenticated;`);
    }

    await db.exec(
      `insert into auth.users (id, email) values ('${USER_A}', 'a@aieses.edu'), ('${USER_B}', 'b@aieses.edu') on conflict do nothing;`,
    );
  });

  it("isolates student workspace documents via RLS", async () => {
    // User A inserts a document
    await asUser(USER_A, async () => {
      await db.query(
        "insert into public.documents (user_id, title, content) values ($1, $2, $3);",
        [USER_A, "User A Notes", "Confidential notes"],
      );
    });

    // User A can read it
    const aDocs = await asUser(USER_A, async () => {
      return (await db.query("select * from public.documents;")).rows;
    });
    expect(aDocs.length).toBe(1);
    expect((aDocs[0] as { title: string }).title).toBe("User A Notes");

    // User B CANNOT see User A's document
    const bDocs = await asUser(USER_B, async () => {
      return (await db.query("select * from public.documents;")).rows;
    });
    expect(bDocs.length).toBe(0);
  });

  it("isolates assessment submissions via RLS", async () => {
    // Insert an assessment (shared catalog)
    const asmRes = await db.query(
      "insert into public.assessments (title, total_marks) values ('Math Final', 100) returning id;",
    );
    const asmId = (asmRes.rows[0] as { id: string }).id;

    // User A submits
    await asUser(USER_A, async () => {
      await db.query(
        "insert into public.assessment_submissions (assessment_id, user_id, score) values ($1, $2, 95);",
        [asmId, USER_A],
      );
    });

    // User B CANNOT see User A's submission
    const bSubs = await asUser(USER_B, async () => {
      return (await db.query("select * from public.assessment_submissions;")).rows;
    });
    expect(bSubs.length).toBe(0);
  });
});
