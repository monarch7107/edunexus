"""Deterministic academic features.

These rules are the source of truth for labels. scikit-learn models in this
package only attempt to recover the same labels on synthetic data.
"""

from __future__ import annotations

from typing import Any, Mapping

FEATURE_NAMES = (
    "pending_tasks",
    "overdue_tasks",
    "exam_tasks_7d",
    "high_priority_pending",
    "completion_rate",
    "planned_minutes_7d",
    "completed_minutes_7d",
    "session_completion_rate",
    "active_subjects",
)


def _num(value: Any, default: float = 0.0) -> float:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return default
    if n != n:  # NaN
        return default
    return n


def compute_features(row: Mapping[str, Any]) -> dict[str, float]:
    pending = max(0.0, _num(row.get("pending_tasks")))
    overdue = max(0.0, _num(row.get("overdue_tasks")))
    exams = max(0.0, _num(row.get("exam_tasks_7d")))
    high = max(0.0, _num(row.get("high_priority_pending")))
    completion = min(1.0, max(0.0, _num(row.get("completion_rate"))))
    planned = max(0.0, _num(row.get("planned_minutes_7d")))
    completed = max(0.0, _num(row.get("completed_minutes_7d")))
    sess_rate = min(1.0, max(0.0, _num(row.get("session_completion_rate"))))
    subjects = max(0.0, _num(row.get("active_subjects")))
    return {
        "pending_tasks": pending,
        "overdue_tasks": overdue,
        "exam_tasks_7d": exams,
        "high_priority_pending": high,
        "completion_rate": completion,
        "planned_minutes_7d": planned,
        "completed_minutes_7d": completed,
        "session_completion_rate": sess_rate,
        "active_subjects": subjects,
    }


def workload_label(features: Mapping[str, float]) -> str:
    """Rule-based class. Evidence-only; never invents exams or hours."""
    overdue = features["overdue_tasks"]
    exams = features["exam_tasks_7d"]
    pending = features["pending_tasks"]
    planned = features["planned_minutes_7d"]
    if overdue >= 3 or (exams >= 2 and pending >= 6) or planned > 20 * 60:
        return "overloaded"
    if overdue >= 1 or exams >= 1 or pending >= 5 or planned > 10 * 60:
        return "heavy"
    return "manageable"
