# EduNexus intelligence layer (experimental)

This package is **offline analysis and ML experimentation**. It is not a production inference service.

## Why Python here

EduNexus production remains Next.js + Supabase. Python is used where pandas / numpy / scikit-learn are actually useful:

- synthetic academic dataset generation
- feature engineering
- workload-class **experimentation**
- evaluation metrics

## FastAPI

**Deferred.** There is no validated production model, no online inference requirement, and no justification for another service. The live app uses the same **deterministic** academic features in TypeScript (`lib/intelligence.ts`).

## Data policy

- Never commit real student records, emails, or tokens.
- Scripts generate **synthetic** students only.
- Model outputs trained on synthetic data must never be presented as real-world evidence.

## Status of ML

`models/workload_baseline.py` trains a tiny logistic regression on **synthetic** labels derived from the same rules as `features/academic_features.py`. It exists to prove the pipeline (train / evaluate / metrics), not to ship predictions to students.

Production workload labels in the UI are **rule-based** and evidence-grounded.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r python/requirements.txt
PYTHONPATH=python python -m pytest python/tests -q
PYTHONPATH=python python python/scripts/generate_demo_data.py
PYTHONPATH=python python python/evaluation/evaluate.py
```
