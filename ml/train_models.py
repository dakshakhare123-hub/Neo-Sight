"""
NeoScan Model Training & Cross-Validation Engine (Phase 4)
==========================================================
Trains and compares multiple machine learning architectures on real clinical features:
- Logistic Regression (L2 regularized, balanced)
- Random Forest (100 trees, balanced)
- HistGradientBoosting (GBDT, balanced)
- Support Vector Machine (RBF kernel, balanced)
- Multi-Layer Perceptron (Neural Network)

Follows strict medical ML evaluation protocol:
1. 5-Fold Stratified Group Cross-Validation (no infant/group leakage).
2. Out-of-fold metrics: ROC-AUC, PR-AUC, Sensitivity, Specificity, Brier Score.
3. Permutation Sanity Check (label shuffle test to prove signal authenticity).
4. Feature Importance & Optical Biomarker ranking.
5. Out-of-Distribution (OOD) Mahalanobis model fitting.
6. Exports winning model artifact to ml/models/active_model/.
"""

import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    brier_score_loss,
    balanced_accuracy_score
)
from sklearn.covariance import EmpiricalCovariance

# Project root setup
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

FEATURES_CACHE_PATH = os.path.join(project_root, "data", "extracted_features.joblib")
SPLITS_PATH = os.path.join(project_root, "data", "splits", "splits.json")
OUTPUT_MODEL_DIR = os.path.join(project_root, "ml", "models", "active_model")
OUTPUT_MODEL_FILE = os.path.join(OUTPUT_MODEL_DIR, "jaundice_screening_model.joblib")


def load_dataset_and_splits() -> Tuple[Dict[str, Any], Dict[str, Any]]:
    if not os.path.exists(FEATURES_CACHE_PATH):
        raise FileNotFoundError(f"Missing {FEATURES_CACHE_PATH}. Run ml/extract_features.py first.")
    if not os.path.exists(SPLITS_PATH):
        raise FileNotFoundError(f"Missing {SPLITS_PATH}. Run ml/create_splits.py first.")

    features_data = joblib.load(FEATURES_CACHE_PATH)
    with open(SPLITS_PATH, "r") as f:
        splits_data = json.load(f)

    return features_data, splits_data


def get_feature_dict_lookup(features_data: Dict[str, Any]) -> Dict[str, Tuple[np.ndarray, float]]:
    """Maps normalized relative image_path to (feature_vector, label)."""
    lookup = {}
    paths = features_data["image_paths"]
    feats = features_data["features"]
    labels = features_data["labels"]
    for p, f, l in zip(paths, feats, labels):
        norm_p = p.replace("\\", "/")
        lookup[norm_p] = (f, float(l))
    return lookup


def evaluate_predictions(y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.5) -> Dict[str, float]:
    y_pred = (y_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    roc_auc = roc_auc_score(y_true, y_prob)
    pr_auc = average_precision_score(y_true, y_prob)
    brier = brier_score_loss(y_true, y_prob)
    bal_acc = balanced_accuracy_score(y_true, y_pred)

    return {
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "sensitivity": float(sensitivity),
        "specificity": float(specificity),
        "balanced_accuracy": float(bal_acc),
        "brier_score": float(brier),
        "tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn)
    }


def run_cross_validation(models: Dict[str, Any],
                         dev_folds: List[Dict[str, Any]],
                         lookup: Dict[str, Tuple[np.ndarray, float]]) -> Dict[str, Dict[str, Any]]:
    results = {}

    for name, model_factory in models.items():
        print(f"\n--- Cross-Validating: {name} ---")
        oof_y_true = []
        oof_y_prob = []
        fold_metrics = []

        for fold_idx, fold_info in enumerate(dev_folds):
            train_paths = [p.replace("\\", "/") for p in fold_info["train_images"]]
            val_paths = [p.replace("\\", "/") for p in fold_info["val_images"]]

            X_train = np.array([lookup[p][0] for p in train_paths if p in lookup], dtype=np.float32)
            y_train = np.array([lookup[p][1] for p in train_paths if p in lookup], dtype=np.float32)
            X_val = np.array([lookup[p][0] for p in val_paths if p in lookup], dtype=np.float32)
            y_val = np.array([lookup[p][1] for p in val_paths if p in lookup], dtype=np.float32)

            model = model_factory()
            model.fit(X_train, y_train)

            # Predict probabilities for positive class (Jaundice = 1)
            if hasattr(model, "predict_proba"):
                y_val_prob = model.predict_proba(X_val)[:, 1]
            elif hasattr(model, "decision_function"):
                df_val = model.decision_function(X_val)
                y_val_prob = 1.0 / (1.0 + np.exp(-df_val))
            else:
                y_val_prob = model.predict(X_val)

            oof_y_true.extend(y_val.tolist())
            oof_y_prob.extend(y_val_prob.tolist())

            fold_eval = evaluate_predictions(y_val, y_val_prob, threshold=0.5)
            fold_metrics.append(fold_eval)

        oof_y_true = np.array(oof_y_true)
        oof_y_prob = np.array(oof_y_prob)

        overall_metrics = evaluate_predictions(oof_y_true, oof_y_prob, threshold=0.5)
        print(f"  OOF ROC-AUC: {overall_metrics['roc_auc']:.4f} | PR-AUC: {overall_metrics['pr_auc']:.4f}")
        print(f"  Sensitivity: {overall_metrics['sensitivity']*100:.1f}% | Specificity: {overall_metrics['specificity']*100:.1f}%")
        print(f"  Balanced Acc: {overall_metrics['balanced_accuracy']*100:.1f}% | Brier Score: {overall_metrics['brier_score']:.4f}")

        # Find screening threshold that yields high sensitivity (>= 90%)
        best_screening_thresh = 0.5
        best_spec_at_high_sens = 0.0
        for thresh in np.linspace(0.1, 0.9, 81):
            eval_t = evaluate_predictions(oof_y_true, oof_y_prob, threshold=thresh)
            if eval_t["sensitivity"] >= 0.90:
                if eval_t["specificity"] > best_spec_at_high_sens:
                    best_spec_at_high_sens = eval_t["specificity"]
                    best_screening_thresh = float(thresh)

        print(f"  High-Sensitivity Screening Threshold: {best_screening_thresh:.3f} "
              f"(Sens: >=90%, Spec: {best_spec_at_high_sens*100:.1f}%)")

        results[name] = {
            "overall_metrics": overall_metrics,
            "fold_metrics": fold_metrics,
            "oof_y_true": oof_y_true,
            "oof_y_prob": oof_y_prob,
            "screening_threshold": best_screening_thresh,
            "spec_at_high_sens": best_spec_at_high_sens
        }

    return results


def run_permutation_sanity_check(winning_model_factory: Any,
                                 dev_folds: List[Dict[str, Any]],
                                 lookup: Dict[str, Tuple[np.ndarray, float]],
                                 n_permutations: int = 5) -> List[float]:
    """
    Shuffles labels randomly and re-evaluates 5-fold CV.
    Expected result: ROC-AUC drops to ~0.50.
    Proves the model learns true optical signal rather than chance or artifacts.
    """
    print(f"\n--- Running Permutation Sanity Check ({n_permutations} trials with shuffled labels) ---")
    perm_aucs = []

    for trial in range(n_permutations):
        oof_true = []
        oof_prob = []
        rng = np.random.RandomState(42 + trial)

        for fold_info in dev_folds:
            train_paths = [p.replace("\\", "/") for p in fold_info["train_images"]]
            val_paths = [p.replace("\\", "/") for p in fold_info["val_images"]]

            X_train = np.array([lookup[p][0] for p in train_paths if p in lookup], dtype=np.float32)
            y_train = np.array([lookup[p][1] for p in train_paths if p in lookup], dtype=np.float32)
            X_val = np.array([lookup[p][0] for p in val_paths if p in lookup], dtype=np.float32)
            y_val = np.array([lookup[p][1] for p in val_paths if p in lookup], dtype=np.float32)

            # Permute train labels
            y_train_shuffled = rng.permutation(y_train)

            model = winning_model_factory()
            model.fit(X_train, y_train_shuffled)
            y_val_prob = model.predict_proba(X_val)[:, 1]

            oof_true.extend(y_val.tolist())
            oof_prob.extend(y_val_prob.tolist())

        perm_auc = roc_auc_score(oof_true, oof_prob)
        perm_aucs.append(float(perm_auc))
        print(f"  Trial {trial + 1}/{n_permutations}: Shuffled ROC-AUC = {perm_auc:.4f}")

    mean_perm_auc = float(np.mean(perm_aucs))
    print(f"Mean Permutation ROC-AUC: {mean_perm_auc:.4f} (Expected ~0.50)")
    assert 0.35 <= mean_perm_auc <= 0.65, f"Permutation check failed! AUC {mean_perm_auc} is not near chance."
    return perm_aucs


def train_and_export_final_model():
    print("=" * 70)
    print("NEOSCAN CLINICAL MODEL TRAINING PIPELINE (PHASE 4)")
    print("=" * 70)

    features_data, splits_data = load_dataset_and_splits()
    lookup = get_feature_dict_lookup(features_data)
    feature_names = features_data["feature_names"]
    dev_folds = splits_data["njn"]["development_folds"]
    test_paths = [p.replace("\\", "/") for p in splits_data["njn"]["held_out_test"]]

    print(f"Loaded {len(lookup)} processed images.")
    print(f"5-Fold Dev Split: {sum(f['val_size'] for f in dev_folds)} images across folds.")
    print(f"Held-Out Test Set: {len(test_paths)} images strictly sequestered.")

    # Model definitions
    model_factories = {
        "Logistic_Regression": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(C=0.5, class_weight="balanced", penalty="l2", max_iter=1000, random_state=42))
        ]),
        "Random_Forest": lambda: RandomForestClassifier(
            n_estimators=150, max_depth=6, min_samples_split=4, class_weight="balanced", random_state=42
        ),
        "Hist_Gradient_Boosting": lambda: HistGradientBoostingClassifier(
            max_iter=120, max_depth=4, learning_rate=0.04, class_weight="balanced", random_state=42
        ),
        "Support_Vector_Machine": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("clf", SVC(kernel="rbf", C=1.0, gamma="scale", probability=True, class_weight="balanced", random_state=42))
        ]),
        "Multi_Layer_Perceptron": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("clf", MLPClassifier(hidden_layer_sizes=(32, 16), alpha=0.01, max_iter=400, random_state=42))
        ])
    }

    cv_results = run_cross_validation(model_factories, dev_folds, lookup)

    # Pick winning architecture based on ROC-AUC and PR-AUC
    ranked_models = sorted(
        cv_results.keys(),
        key=lambda k: (cv_results[k]["overall_metrics"]["roc_auc"] + cv_results[k]["overall_metrics"]["pr_auc"]),
        reverse=True
    )
    winning_name = ranked_models[0]
    winning_cv = cv_results[winning_name]
    print(f"\n=======================================================")
    print(f"WINNING MODEL: {winning_name}")
    print(f"OOF ROC-AUC: {winning_cv['overall_metrics']['roc_auc']:.4f}")
    print(f"OOF PR-AUC:  {winning_cv['overall_metrics']['pr_auc']:.4f}")
    print(f"Optimal Screening Threshold: {winning_cv['screening_threshold']:.3f}")
    print(f"=======================================================")

    # Run Permutation Check on winning model
    perm_aucs = run_permutation_sanity_check(model_factories[winning_name], dev_folds, lookup, n_permutations=5)

    # Gather all development samples
    dev_paths = set()
    for f in dev_folds:
        dev_paths.update([p.replace("\\", "/") for p in f["train_images"]])
        dev_paths.update([p.replace("\\", "/") for p in f["val_images"]])
    dev_paths = sorted(list(dev_paths))

    X_dev = np.array([lookup[p][0] for p in dev_paths if p in lookup], dtype=np.float32)
    y_dev = np.array([lookup[p][1] for p in dev_paths if p in lookup], dtype=np.float32)

    print(f"\nFitting final {winning_name} on all {len(X_dev)} development samples...")
    final_model = model_factories[winning_name]()
    final_model.fit(X_dev, y_dev)

    # Feature Importance / Biomarker Analysis
    biomarker_importance = {}
    if winning_name == "Logistic_Regression":
        coefs = final_model.named_steps["clf"].coef_[0]
        for fname, c in zip(feature_names, coefs):
            biomarker_importance[fname] = float(c)
    elif hasattr(final_model, "feature_importances_"):
        for fname, imp in zip(feature_names, final_model.feature_importances_):
            biomarker_importance[fname] = float(imp)
    else:
        # Permutation importance on development set
        baseline_preds = final_model.predict_proba(X_dev)[:, 1]
        base_auc = roc_auc_score(y_dev, baseline_preds)
        for col_idx, fname in enumerate(feature_names):
            X_dev_perm = X_dev.copy()
            np.random.seed(42)
            X_dev_perm[:, col_idx] = np.random.permutation(X_dev_perm[:, col_idx])
            perm_preds = final_model.predict_proba(X_dev_perm)[:, 1]
            drop = base_auc - roc_auc_score(y_dev, perm_preds)
            biomarker_importance[fname] = float(drop)

    print("\nTop 5 Optical Biomarkers (Ranked by Influence):")
    sorted_bio = sorted(biomarker_importance.items(), key=lambda x: abs(x[1]), reverse=True)
    for fname, score in sorted_bio[:5]:
        print(f"  - {fname}: {score:+.4f}")

    # Fit Out-Of-Distribution (OOD) Detector on X_dev
    print("\nFitting Out-Of-Distribution (OOD) Detector...")
    ood_scaler = StandardScaler()
    X_dev_scaled = ood_scaler.fit_transform(X_dev)
    cov_model = EmpiricalCovariance()
    cov_model.fit(X_dev_scaled)

    # Compute Mahalanobis distances on training distribution
    dev_mahalanobis = cov_model.mahalanobis(X_dev_scaled)
    # Set 99th percentile as OOD distance cutoff threshold
    ood_cutoff = float(np.percentile(dev_mahalanobis, 99.0))
    print(f"  Dev Mahalanobis Median: {np.median(dev_mahalanobis):.2f}, 99th pct Cutoff: {ood_cutoff:.2f}")

    # Build model artifact
    os.makedirs(OUTPUT_MODEL_DIR, exist_ok=True)
    artifact_payload = {
        "model_name": winning_name,
        "pipeline": final_model,
        "feature_names": feature_names,
        "decision_threshold": winning_cv["screening_threshold"],
        "default_threshold": 0.5,
        "cv_metrics": winning_cv["overall_metrics"],
        "all_model_cv_results": {k: v["overall_metrics"] for k, v in cv_results.items()},
        "biomarker_importance": biomarker_importance,
        "permutation_test": {
            "trials": perm_aucs,
            "mean_auc": float(np.mean(perm_aucs)),
            "passed": True
        },
        "ood_detector": {
            "scaler": ood_scaler,
            "covariance_model": cov_model,
            "distance_cutoff_99": ood_cutoff,
            "mean_vector": cov_model.location_,
            "covariance_matrix": cov_model.covariance_
        },
        "training_metadata": {
            "timestamp": time.time(),
            "n_dev_samples": len(X_dev),
            "jaundice_prevalence": float(np.mean(y_dev)),
            "source": "BioMedInformatics NJN Iraq (2023) Stratified Group CV",
            "optical_corrections": "UnifiedPreprocessor (Shades-of-Gray Minkowski p=6, Lab+YCrCb)"
        }
    }

    joblib.dump(artifact_payload, OUTPUT_MODEL_FILE)
    print(f"\nSuccessfully exported active model to:\n  {OUTPUT_MODEL_FILE}")
    print(f"Artifact size: {os.path.getsize(OUTPUT_MODEL_FILE) / 1024:.1f} KB")


if __name__ == "__main__":
    train_and_export_final_model()
