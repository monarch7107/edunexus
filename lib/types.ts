// ── Domain types (mirror the Supabase schema in /supabase/schema.sql) ────────

export type TaskType = "assignment" | "exam" | "project" | "reading" | "other";
export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "completed";
export type SessionStatus = "planned" | "completed";
export type ResourceType = "note" | "link";

export interface Profile {
  id: string;
  full_name: string;
  course: string;
  branch: string;
  semester: number | null;
  year_of_study: number | null;
  goals: string;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  code: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string;
  task_type: TaskType;
  priority: TaskPriority;
  due_date: string | null; // ISO date (yyyy-mm-dd) or ISO datetime
  status: TaskStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  planned_date: string; // ISO date
  duration_minutes: number;
  status: SessionStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  content: string;
  resource_url: string;
  resource_type: ResourceType;
  created_at: string;
  updated_at: string;
}

export interface AiRecommendation {
  id: string;
  user_id: string;
  recommendation_type: string;
  input_snapshot: Record<string, unknown>;
  output_text: string;
  created_at: string;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}

export interface ProfileInput {
  full_name: string;
  course: string;
  branch: string;
  semester: number | null;
  year_of_study: number | null;
  goals: string;
  onboarded?: boolean;
}

export interface SubjectInput {
  name: string;
  code?: string;
  color?: string;
}

export interface TaskInput {
  subject_id: string | null;
  title: string;
  description?: string;
  task_type: TaskType;
  priority: TaskPriority;
  due_date: string | null;
}

export interface SessionInput {
  subject_id: string | null;
  title: string;
  planned_date: string;
  duration_minutes: number;
}

export interface ResourceInput {
  subject_id: string | null;
  title: string;
  content?: string;
  resource_url?: string;
  resource_type: ResourceType;
}

// ── AI recommendation ────────────────────────────────────────────────────────

export interface RecommendationItem {
  task_id: string | null;
  title: string;
  reason: string;
  subject_id: string | null;
  due_date: string | null;
}

export interface RecommendationResult {
  source: "ai" | "fallback";
  summary: string;
  plan: string[];
  items: RecommendationItem[];
  generated_at: string;
}
