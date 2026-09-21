/**
 * EduAdapt — Adaptive Learning & Weak Area Diagnosis Engine
 *
 * CONCEPTUAL PIPELINE:
 * student performance + assessment results + skill mapping + recent mistakes
 * ↓
 * weak skill detection
 * ↓
 * targeted learning resource & practice recommendations
 *
 * NOTE ON METHODOLOGY (SIH 2026 Audit Requirement):
 * Current implementation uses deterministic rule-based knowledge heuristics
 * evaluating completion velocity, deadline proximity, study duration deficits,
 * and assessment score thresholds. Advanced Bayesian Knowledge Tracing (BKT)
 * and deep neural student modeling are architecture targets marked as TODO.
 */

import type { Subject, Task, StudySession } from "../types";

export interface Skill {
  id: string;
  subjectCode: string;
  name: string;
  category: "Foundations" | "Core Theory" | "Practical Application" | "Advanced";
}

export type MasteryLevel = "mastered" | "proficient" | "developing" | "at_risk";

export interface SkillMastery {
  skillId: string;
  skillName: string;
  subjectId: string;
  subjectName: string;
  masteryPct: number; // 0 to 100
  level: MasteryLevel;
  evidence: string[];
}

export interface RecommendedAction {
  skillId: string;
  skillName: string;
  subjectName: string;
  type: "diksha_resource" | "practice_quiz" | "planner_session" | "workspace_project";
  title: string;
  reason: string;
  actionUrl: string;
}

export interface WeakAreaDiagnosis {
  overallHealthScore: number; // 0 - 100
  identifiedWeakAreas: SkillMastery[];
  strongAreas: SkillMastery[];
  recommendedActions: RecommendedAction[];
  methodology: "rule_based_heuristics_v1";
  advancedIntelligenceTodo: "Bayesian Knowledge Tracing (BKT) + Deep Student Modeling";
}

export interface AssessmentResultInput {
  assessmentId: string;
  subjectId: string;
  skillId?: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
}

export const CANONICAL_SKILLS: Record<string, Skill[]> = {
  default: [
    { id: "sk-foundations", subjectCode: "GEN", name: "Fundamental Concepts & Definitions", category: "Foundations" },
    { id: "sk-problem-solving", subjectCode: "GEN", name: "Problem Solving & Analytical Methods", category: "Core Theory" },
    { id: "sk-practical", subjectCode: "GEN", name: "Practical Lab & Project Implementation", category: "Practical Application" },
    { id: "sk-synthesis", subjectCode: "GEN", name: "Advanced Synthesis & Exam Preparation", category: "Advanced" },
  ],
};

export function diagnoseLearnerWeakAreas(
  subjects: Subject[],
  tasks: Task[],
  sessions: StudySession[],
  assessments: AssessmentResultInput[] = [],
): WeakAreaDiagnosis {
  const weakSkills: SkillMastery[] = [];
  const strongSkills: SkillMastery[] = [];
  const actions: RecommendedAction[] = [];

  for (const subject of subjects) {
    const subTasks = tasks.filter((t) => t.subject_id === subject.id);
    const subSessions = sessions.filter((s) => s.subject_id === subject.id);
    const subAssessments = assessments.filter((a) => a.subjectId === subject.id);

    const overdue = subTasks.filter((t) => {
      if (t.status === "completed" || !t.due_date) return false;
      return new Date(t.due_date).getTime() < Date.now();
    });
    const completedTasks = subTasks.filter((t) => t.status === "completed");
    const totalMinutes = subSessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.duration_minutes, 0);

    const evidence: string[] = [];
    let score = 75; // baseline

    if (subTasks.length > 0) {
      const completionRate = completedTasks.length / subTasks.length;
      if (completionRate < 0.4) {
        score -= 20;
        evidence.push(`Low task completion rate (${Math.round(completionRate * 100)}%)`);
      } else if (completionRate > 0.8) {
        score += 15;
        evidence.push(`High task completion rate (${Math.round(completionRate * 100)}%)`);
      }
    }

    if (overdue.length > 0) {
      score -= overdue.length * 15;
      evidence.push(`${overdue.length} overdue assignment${overdue.length > 1 ? "s" : ""}`);
    }

    if (totalMinutes === 0 && subTasks.length > 0) {
      score -= 10;
      evidence.push("0 logged study minutes");
    } else if (totalMinutes >= 120) {
      score += 10;
      evidence.push(`${totalMinutes} logged study minutes`);
    }

    if (subAssessments.length > 0) {
      const avgScore =
        subAssessments.reduce((sum, a) => sum + (a.score / a.totalMarks) * 100, 0) /
        subAssessments.length;
      if (avgScore < 60) {
        score -= 20;
        evidence.push(`Recent assessment average: ${Math.round(avgScore)}%`);
      } else {
        score += 10;
        evidence.push(`Recent assessment average: ${Math.round(avgScore)}%`);
      }
    }

    score = Math.max(10, Math.min(100, score));

    const level: MasteryLevel =
      score < 40
        ? "at_risk"
        : score < 65
          ? "developing"
          : score < 85
            ? "proficient"
            : "mastered";

    const mastery: SkillMastery = {
      skillId: `skill-${subject.id}`,
      skillName: `${subject.name} Core Mastery`,
      subjectId: subject.id,
      subjectName: subject.name,
      masteryPct: score,
      level,
      evidence: evidence.length ? evidence : ["Consistent baseline progress"],
    };

    if (level === "at_risk" || level === "developing") {
      weakSkills.push(mastery);
      actions.push({
        skillId: mastery.skillId,
        skillName: mastery.skillName,
        subjectName: subject.name,
        type: "diksha_resource",
        title: `Explore NCERT / DIKSHA materials for ${subject.name}`,
        reason: evidence.join(" · ") || "Reinforce conceptual foundations",
        actionUrl: `/learning?subject=${encodeURIComponent(subject.id)}`,
      });
      actions.push({
        skillId: mastery.skillId,
        skillName: mastery.skillName,
        subjectName: subject.name,
        type: "planner_session",
        title: `Schedule 45-min revision block for ${subject.name}`,
        reason: "Active recall study session to resolve pending backlog",
        actionUrl: `/planner`,
      });
    } else {
      strongSkills.push(mastery);
    }
  }

  const overallHealthScore =
    subjects.length > 0
      ? Math.round(
          [...weakSkills, ...strongSkills].reduce((sum, s) => sum + s.masteryPct, 0) /
            subjects.length,
        )
      : 80;

  return {
    overallHealthScore,
    identifiedWeakAreas: weakSkills,
    strongAreas: strongSkills,
    recommendedActions: actions,
    methodology: "rule_based_heuristics_v1",
    advancedIntelligenceTodo: "Bayesian Knowledge Tracing (BKT) + Deep Student Modeling",
  };
}
