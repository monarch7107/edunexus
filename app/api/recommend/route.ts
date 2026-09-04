import { NextResponse } from "next/server";
import type {
  RecommendationItem,
  RecommendationResult,
  Subject,
  Task,
} from "@/lib/types";
import { dueState, minutesToLabel, rankTasks, taskTypeLabel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface Snapshot {
  goals?: string;
  subjects?: Pick<Subject, "id" | "name" | "code">[];
  tasks?: Task[];
  sessions?: {
    subject_id: string | null;
    planned_date: string;
    duration_minutes: number;
    status: string;
  }[];
  studyMinutesCompleted?: number;
}

// ── Deterministic fallback (spec §14): overdue → nearest deadline → priority ─
function fallbackRecommendation(snap: Snapshot): RecommendationResult {
  const tasks = snap.tasks ?? [];
  const subjects = new Map((snap.subjects ?? []).map((s) => [s.id, s]));
  const ranked = rankTasks(tasks).slice(0, 5);

  const overdue = ranked.filter((t) => dueState(t.due_date) === "overdue");
  const dueToday = ranked.filter((t) => dueState(t.due_date) === "today");

  const items: RecommendationItem[] = ranked.map((t) => {
    const subj = t.subject_id ? subjects.get(t.subject_id) : undefined;
    const state = dueState(t.due_date);
    const reason =
      state === "overdue"
        ? `Overdue — submit/finish this immediately${subj ? ` (${subj.code || subj.name})` : ""}.`
        : state === "today"
          ? `Due today — block time for it now${subj ? ` (${subj.code || subj.name})` : ""}.`
          : t.priority === "high"
            ? `High priority with the nearest deadline${subj ? ` (${subj.code || subj.name})` : ""}.`
            : `Next nearest deadline among your pending tasks${subj ? ` (${subj.code || subj.name})` : ""}.`;
    return {
      task_id: t.id,
      title: t.title,
      reason,
      subject_id: t.subject_id,
      due_date: t.due_date,
    };
  });

  const plan: string[] = [];
  if (overdue.length)
    plan.push(`Clear ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""} first — they carry the biggest risk.`);
  if (dueToday.length)
    plan.push(`Finish ${dueToday.length} task${dueToday.length > 1 ? "s" : ""} due today before starting anything new.`);
  const top = ranked[0];
  if (top) {
    const subj = top.subject_id ? subjects.get(top.subject_id) : undefined;
    plan.push(
      `Then focus on "${top.title}"${subj ? ` for ${subj.code || subj.name}` : ""} (${taskTypeLabel(top.task_type)}, ${top.priority} priority).`
    );
  }
  const mins = snap.studyMinutesCompleted ?? 0;
  plan.push(
    mins > 0
      ? `You have logged ${minutesToLabel(mins)} of study — keep a 45–60 minute session for the nearest exam/assignment.`
      : `Schedule at least one 45-minute study session today to build momentum.`
  );
  if (snap.goals?.trim())
    plan.push(`Keep your semester goal in mind: “${snap.goals.trim().slice(0, 140)}”.`);

  const summary =
    ranked.length === 0
      ? "You have no pending tasks. Add upcoming assignments and exams, or plan a study session to get ahead."
      : `Focus on ${ranked.length} prioritized item${ranked.length > 1 ? "s" : ""}: ${
          overdue.length ? `${overdue.length} overdue, ` : ""
        }${dueToday.length ? `${dueToday.length} due today, ` : ""}then the nearest deadlines.`;

  return {
    source: "fallback",
    summary,
    plan,
    items,
    generated_at: new Date().toISOString(),
  };
}

function sanitizeAi(raw: unknown): RecommendationResult | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.summary !== "string" || !r.summary.trim()) return null;
  if (!Array.isArray(r.plan) || !r.plan.every((x) => typeof x === "string")) return null;
  if (!Array.isArray(r.items)) return null;
  const items: RecommendationItem[] = r.items
    .filter(
      (i): i is Record<string, unknown> =>
        typeof i === "object" && i !== null && typeof (i as Record<string, unknown>).title === "string"
    )
    .slice(0, 6)
    .map((i) => ({
      task_id: typeof i.task_id === "string" ? i.task_id : null,
      title: String(i.title).slice(0, 160),
      reason: typeof i.reason === "string" ? i.reason.slice(0, 240) : "Suggested based on your academic data.",
      subject_id: typeof i.subject_id === "string" ? i.subject_id : null,
      due_date: typeof i.due_date === "string" ? i.due_date : null,
    }));
  return {
    source: "ai",
    summary: r.summary.slice(0, 400),
    plan: r.plan.map((p) => String(p).slice(0, 240)).slice(0, 6),
    items,
    generated_at: new Date().toISOString(),
  };
}

async function aiRecommendation(snap: Snapshot): Promise<RecommendationResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const base = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const system = [
    "You are the EduNexus study advisor for university students in India.",
    "You receive the student's real academic data (tasks with deadlines/priority/status, subjects, study sessions, goals).",
    "Recommend what to study and work on over the next 3-5 days. Be concrete, brief and encouraging.",
    "Rules: use ONLY the provided data; never invent tasks; order items by urgency (overdue first, then nearest deadline, then high priority); cover exam preparation if exams are near.",
    'Respond with ONLY valid JSON, no markdown, in this shape:',
    '{"summary": string (1-2 sentences), "plan": string[] (3-5 short action steps), "items": [{"task_id": string|null (must match an id from the input tasks or null), "title": string, "reason": string}]}.',
  ].join(" ");

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Student data:\n${JSON.stringify(snap).slice(0, 12000)}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return sanitizeAi(JSON.parse(content));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let snap: Snapshot;
  try {
    snap = (await request.json()) as Snapshot;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // When Supabase is configured, only signed-in users may call this route.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
    } catch {
      // If auth verification fails, fail closed.
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  try {
    const ai = await aiRecommendation(snap);
    const result = ai ?? fallbackRecommendation(snap);
    return NextResponse.json(result);
  } catch {
    // AI failure must never break the app — return the deterministic result.
    return NextResponse.json(fallbackRecommendation(snap));
  }
}
