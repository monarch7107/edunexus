from analysis.academic_patterns import summarize_cohort
from models.workload_baseline import train_baseline
from scripts.generate_demo_data import generate


def test_generator_is_deterministic():
    a = generate(30, seed=3)
    b = generate(30, seed=3)
    assert a.equals(b)
    assert a["student_id"].str.startswith("syn-").all()


def test_cohort_summary_counts():
    frame = generate(40, seed=1)
    s = summarize_cohort(frame)
    assert s["n"] == 40
    assert abs(s["pct_overloaded"] + s["pct_heavy"] + s["pct_manageable"] - 1) < 1e-9


def test_empty_cohort():
    import pandas as pd

    s = summarize_cohort(pd.DataFrame())
    assert s["n"] == 0


def test_baseline_insufficient_data():
    frame = generate(5, seed=2)
    out = train_baseline(frame)
    assert out["status"] == "insufficient_data"
    assert out["production_ready"] is False


def test_baseline_experimental_on_synthetic():
    frame = generate(80, seed=4)
    out = train_baseline(frame)
    assert out["status"] == "experimental"
    assert out["data"] == "synthetic"
    assert out["production_ready"] is False
    assert 0 <= out["accuracy"] <= 1
