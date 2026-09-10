"""Evaluate the experimental baseline on synthetic data only."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from analysis.academic_patterns import summarize_cohort
from models.workload_baseline import train_baseline
from scripts.generate_demo_data import generate


def main() -> None:
    frame = generate(160, seed=11)
    summary = summarize_cohort(frame)
    model = train_baseline(frame)
    report = {
        "dataset": "synthetic_academic_week",
        "privacy": "synthetic_only",
        "cohort": summary,
        "model": model,
        "production_ready": False,
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
