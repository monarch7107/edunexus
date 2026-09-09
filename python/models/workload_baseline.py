"""Experimental baseline: recover rule labels from synthetic features.

This is NOT production-ready. Accuracy on synthetic data does not imply
real-student performance.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

from features.academic_features import FEATURE_NAMES, compute_features, workload_label


def train_baseline(frame: pd.DataFrame, seed: int = 7) -> dict[str, Any]:
    if len(frame) < 20:
        return {
            "status": "insufficient_data",
            "note": "Need at least 20 synthetic rows to train an experimental baseline.",
            "production_ready": False,
        }
    X_rows = []
    y_rows = []
    for _, row in frame.iterrows():
        feats = compute_features(row.to_dict())
        X_rows.append([feats[name] for name in FEATURE_NAMES])
        y_rows.append(workload_label(feats))
    X = np.array(X_rows, dtype=float)
    encoder = LabelEncoder()
    y = encoder.fit_transform(y_rows)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=seed, stratify=y if len(set(y)) > 1 else None
    )
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    model = LogisticRegression(max_iter=800)
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    return {
        "status": "experimental",
        "production_ready": False,
        "data": "synthetic",
        "accuracy": float(accuracy_score(y_test, pred)),
        "macro_f1": float(f1_score(y_test, pred, average="macro", zero_division=0)),
        "classes": list(encoder.classes_),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "note": "Trained only on synthetic labels. Do not cite as real-world evidence.",
    }
