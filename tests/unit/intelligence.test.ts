import { describe, expect, it } from "vitest";
import { computeAcademicSignals } from "@/lib/intelligence";
import type { StudySession, Subject, Task } from "@/lib/types";

const subject: Subject = {
  id: "s1",
  user_id: "u",
  name: "Physics",
  code: "PHY",
  color: "#123",
  created_at: "",
  updated_at: "",
};

function task(partial: Partial<Task>): Task {
  return {
    id: "t",
    user_id: "u",
    subject_id: "s1",
    title: "x",
    description: "",
    task_type: "assignment",
    priority: "medium",
    due_date: null,
    status: "pending",
    completed_at: null,
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

it("empty workspace is manageable", () => {
  const s = computeAcademicSignals([], [], []);
  expect(s.workload).toBe("manageable");
  expect(s.pendingTasks).toBe(0);
});

it("three overdue tasks are overloaded", () => {
  const tasks = [1, 2, 3].map((i) =>
    task({ id: `t${i}`, due_date: "2000-01-01" }),
  );
  expect(computeAcademicSignals([subject], tasks, []).workload).toBe("overloaded");
});

it("does not invent exams", () => {
  const s = computeAcademicSignals([subject], [task({ title: "read notes" })], []);
  expect(s.examTasks7d).toBe(0);
});
