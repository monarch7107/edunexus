import { describe, expect, it } from "vitest";
import { diagnoseLearnerWeakAreas } from "@/lib/eduadapt";
import type { Subject, Task, StudySession } from "@/lib/types";

describe("EduAdapt Adaptive Diagnosis Engine", () => {
  const mockSubject: Subject = {
    id: "sub-math",
    user_id: "user-1",
    name: "Engineering Mathematics",
    code: "MA101",
    color: "#3b62f6",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("identifies at-risk areas when overdue tasks exist and study time is low", () => {
    const overdueTask: Task = {
      id: "task-1",
      user_id: "user-1",
      subject_id: "sub-math",
      title: "Calculus Problem Set 1",
      description: "",
      task_type: "assignment",
      priority: "high",
      due_date: "2026-01-01T00:00:00Z", // overdue
      status: "pending",
      completed_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const diagnosis = diagnoseLearnerWeakAreas([mockSubject], [overdueTask], []);
    expect(diagnosis.identifiedWeakAreas.length).toBe(1);
    expect(diagnosis.identifiedWeakAreas[0].subjectName).toBe("Engineering Mathematics");
    expect(diagnosis.identifiedWeakAreas[0].level).toMatch(/at_risk|developing/);
    expect(diagnosis.recommendedActions.length).toBeGreaterThan(0);
    expect(diagnosis.recommendedActions[0].actionUrl).toContain("learning");
  });

  it("identifies strong areas when tasks are completed with adequate study time", () => {
    const completedTask: Task = {
      id: "task-2",
      user_id: "user-1",
      subject_id: "sub-math",
      title: "Calculus Problem Set 2",
      description: "",
      task_type: "assignment",
      priority: "medium",
      due_date: "2026-12-01T00:00:00Z",
      status: "completed",
      completed_at: new Date().toISOString(),
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const session: StudySession = {
      id: "sess-1",
      user_id: "user-1",
      subject_id: "sub-math",
      title: "Calculus Deep Dive",
      planned_date: "2026-09-20",
      duration_minutes: 150,
      status: "completed",
      completed_at: new Date().toISOString(),
      created_at: "2026-09-20T00:00:00Z",
      updated_at: "2026-09-20T00:00:00Z",
    };

    const diagnosis = diagnoseLearnerWeakAreas([mockSubject], [completedTask], [session]);
    expect(diagnosis.strongAreas.length).toBe(1);
    expect(diagnosis.strongAreas[0].level).toMatch(/proficient|mastered/);
  });
});
