"""Generate a synthetic academic-feature table. No real students."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from features.academic_features import compute_features, workload_label


def generate(n: int = 120, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = []
    for i in range(n):
        pending = int(rng.integers(0, 12))
        overdue = int(rng.integers(0, min(pending + 1, 6)))
        exams = int(rng.integers(0, 4))
        high = int(rng.integers(0, pending + 1))
        completion = float(rng.random())
        planned = int(rng.integers(0, 25 * 60))
        completed = int(rng.integers(0, planned + 1 if planned else 120))
        sess_rate = float(completed / planned) if planned else 0.0
        subjects = int(rng.integers(1, 7))
        raw = {
            "student_id": f"syn-{i:04d}",
            "pending_tasks": pending,
            "overdue_tasks": overdue,
            "exam_tasks_7d": exams,
            "high_priority_pending": high,
            "completion_rate": round(completion, 3),
            "planned_minutes_7d": planned,
            "completed_minutes_7d": completed,
            "session_completion_rate": round(min(1.0, sess_rate), 3),
            "active_subjects": subjects,
        }
        feats = compute_features(raw)
        raw["workload_label"] = workload_label(feats)
        rows.append(raw)
    return pd.DataFrame(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=120)
    parser.add_argument("--out", type=str, default="")
    args = parser.parse_args()
    frame = generate(args.n)
    if args.out:
        path = Path(args.out)
        path.parent.mkdir(parents=True, exist_ok=True)
        frame.to_csv(path, index=False)
        print(f"wrote {len(frame)} synthetic rows to {path}")
    else:
        print(frame.head().to_string(index=False))
        print(f"\n{len(frame)} synthetic students (not written)")


if __name__ == "__main__":
    main()
