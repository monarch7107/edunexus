from features.academic_features import compute_features, workload_label


def test_missing_and_invalid_default_to_zero():
    feats = compute_features({"pending_tasks": None, "overdue_tasks": "x"})
    assert feats["pending_tasks"] == 0
    assert feats["overdue_tasks"] == 0
    assert workload_label(feats) == "manageable"


def test_overloaded_from_overdue():
    feats = compute_features({"overdue_tasks": 3, "pending_tasks": 3})
    assert workload_label(feats) == "overloaded"


def test_heavy_from_single_exam():
    feats = compute_features({"exam_tasks_7d": 1, "pending_tasks": 1})
    assert workload_label(feats) == "heavy"


def test_completion_clamped():
    feats = compute_features({"completion_rate": 4})
    assert feats["completion_rate"] == 1.0


def test_negative_counts_clamped():
    feats = compute_features({"pending_tasks": -2})
    assert feats["pending_tasks"] == 0
