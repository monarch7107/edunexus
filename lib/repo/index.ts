import type { Repo } from "./types";
import { SupabaseRepo } from "./supabase";
import { DemoRepo } from "./demo";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let repo: Repo | null = null;

export function getRepo(): Repo {
  if (repo) return repo;
  repo = isSupabaseConfigured ? new SupabaseRepo() : new DemoRepo();
  return repo;
}

export type { Repo };
