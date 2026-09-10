"""Cohort summaries over synthetic or exported evaluation frames."""

from __future__ import annotations

import pandas as pd

from features.academic_features import compute_features, workload_label


def summarize_cohort(frame: pd.DataFrame) -> dict[str, float]:
    if frame.empty:
        return {
            "n": 0.0,
            "mean_pending": 0.0,
            "mean_overdue": 0.0,
            "pct_overloaded": 0.0,
            "pct_heavy": 0.0,
            "pct_manageable": 0.0,
        }
    labels = []
    pending = []
    overdue = []
    for _, row in frame.iterrows():
        feats = compute_features(row.to_dict())
        labels.append(workload_label(feats))
        pending.append(feats["pending_tasks"])
        overdue.append(feats["overdue_tasks"])
    n = float(len(frame))
    return {
        "n": n,
        "mean_pending": sum(pending) / n,
        "mean_overdue": sum(overdue) / n,
        "pct_overloaded": labels.count("overloaded") / n,
        "pct_heavy": labels.count("heavy") / n,
        "pct_manageable": labels.count("manageable") / n,
    }
