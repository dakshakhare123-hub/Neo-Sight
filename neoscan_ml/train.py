"""Train and honestly evaluate the normal-vs-jaundiced classifier.

Usage:
  python train.py --manifest data/manifest.csv --out models/ [--target-sens 0.90 --safe-sens 0.97]

Manifest columns: image_path, group_id, label (0 normal, 1 jaundiced), source (optional)

What this script guarantees:
  * every image goes through the SAME face/quality gate used at inference; rejects are logged, never hidden
  * splits are by group_id (infant), so one baby never sits in both train and test
  * a held-out test set is used exactly once, for the reported numbers
  * a label-shuffle control proves the model is learning signal, not leakage
  * thresholds come from out-of-fold predictions, never from the test set
"""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.covariance import LedoitWolf
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score, roc_curve
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from neoscan_ml.errors import AnalysisError
from neoscan_ml.features import FEATURE_NAMES, extract_features


def candidates(seed):
    return {
        "logreg": make_pipeline(StandardScaler(), LogisticRegression(C=0.5, class_weight="balanced", max_iter=3000)),
        "hgb": HistGradientBoostingClassifier(max_depth=3, learning_rate=0.05, max_iter=200,
                                              l2_regularization=1.0, class_weight="balanced", random_state=seed),
        "rf": RandomForestClassifier(n_estimators=300, min_samples_leaf=3, class_weight="balanced_subsample",
                                     n_jobs=-1, random_state=seed),
    }


def oof_proba(model, X, y, groups, seed, n_splits=5):
    cv = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=seed)
    p = np.zeros(len(y))
    for tr, te in cv.split(X, y, groups):
        m = clone(model).fit(X[tr], y[tr])
        p[te] = m.predict_proba(X[te])[:, 1]
    return p


def threshold_for_sensitivity(y, p, target):
    """Highest threshold that still catches at least `target` of the jaundiced cases."""
    pos = p[y == 1]
    for t in sorted(set(p), reverse=True):
        if (pos >= t).mean() >= target:
            return float(t)
    return float(p.min())


def outcome_metrics(y, p, thr_low, thr_high):
    pos, neg = p[y == 1], p[y == 0]
    return {
        "auc": float(roc_auc_score(y, p)),
        "sens_flagged": float((pos >= thr_high).mean()),            # jaundiced caught as 'possible signs'
        "sens_not_cleared": float((pos >= thr_low).mean()),         # jaundiced NOT told 'no visible signs'
        "spec_cleared": float((neg < thr_low).mean()),              # normals correctly cleared
        "false_flag_rate": float((neg >= thr_high).mean()),         # normals flagged as possible jaundice
        "inconclusive_rate": float(((p >= thr_low) & (p < thr_high)).mean()),
        "brier": float(brier_score_loss(y, p)),
    }


def group_bootstrap_ci(y, p, groups, thr_low, thr_high, n=1000, seed=0):
    rng = np.random.default_rng(seed)
    ug = np.unique(groups)
    idx_by_g = {g: np.where(groups == g)[0] for g in ug}
    keys = ["auc", "sens_flagged", "sens_not_cleared", "spec_cleared", "false_flag_rate"]
    acc = {k: [] for k in keys}
    for _ in range(n):
        pick = rng.choice(ug, size=len(ug), replace=True)
        idx = np.concatenate([idx_by_g[g] for g in pick])
        if len(set(y[idx])) < 2:
            continue
        m = outcome_metrics(y[idx], p[idx], thr_low, thr_high)
        for k in keys:
            acc[k].append(m[k])
    return {k: [float(np.percentile(v, 2.5)), float(np.percentile(v, 97.5))] for k, v in acc.items() if v}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--out", default="models")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--target-sens", type=float, default=0.90, help="sensitivity for the 'possible signs' flag")
    ap.add_argument("--safe-sens", type=float, default=0.97, help="sensitivity required before saying 'no visible signs'")
    ap.add_argument("--min-per-class", type=int, default=30)
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(a.manifest)
    for c in ("image_path", "group_id", "label"):
        if c not in df.columns:
            raise SystemExit(f"Manifest is missing column '{c}'.")
    if "source" not in df.columns:
        df["source"] = "unknown"

    # ---- 1. features through the exact inference gate; log every rejection ----
    rows, feats, rejects = [], [], []
    for i, r in enumerate(df.itertuples(index=False), 1):
        try:
            f, meta, _ = extract_features(r.image_path)
        except AnalysisError as e:
            if e.code == "MODEL_UNAVAILABLE":
                raise
            rejects.append({"image_path": r.image_path, "label": r.label, "source": r.source, "code": e.code})
            continue
        feats.append(f)
        rows.append({"image_path": r.image_path, "group_id": r.group_id, "label": int(r.label),
                     "source": r.source, "colour_normalised": meta["colour_normalised"]})
        if i % 50 == 0:
            print(f"  processed {i}/{len(df)}")
    pd.DataFrame(rejects).to_csv(out / "rejected_images.csv", index=False)
    if not rows:
        raise SystemExit("Every image was rejected by the gate. See rejected_images.csv.")
    meta_df = pd.DataFrame(rows)
    X_df = pd.DataFrame(feats)[FEATURE_NAMES]
    y = meta_df.label.to_numpy()
    groups = meta_df.group_id.to_numpy()

    print(f"\nKept {len(meta_df)} of {len(df)} images; rejected {len(rejects)} (see rejected_images.csv)")
    if rejects:
        print(pd.DataFrame(rejects).groupby(["label", "code"]).size().to_string())
        rr = pd.DataFrame(rejects).groupby("label").size() / df.groupby("label").size()
        if rr.max() - rr.min() > 0.15:
            print("WARNING: rejection rate differs a lot between classes; the kept data may be biased.")
    for cls in (0, 1):
        n_img, n_grp = int((y == cls).sum()), len(set(groups[y == cls]))
        print(f"class {cls}: {n_img} images, {n_grp} groups")
        if n_img < a.min_per_class or n_grp < 20:
            raise SystemExit(f"Not enough usable data for class {cls} (need >= {a.min_per_class} images and 20 groups). "
                             "Add data or relax nothing silently; training would not be trustworthy.")
    src = meta_df.groupby(["source", "label"]).size().unstack(fill_value=0)
    print("\nImages per source and class:\n", src.to_string())
    if ((src > 0).sum(axis=1) < 2).any():
        print("WARNING: at least one source contains only one class. The model may learn the source "
              "(camera/lighting/hospital) instead of jaundice. Validate on a different source.")

    X = X_df.to_numpy(dtype=np.float64)

    # ---- 2. held-out test set (by group), used once ----
    outer = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=a.seed)
    tr, te = next(outer.split(X, y, groups))
    Xtr, ytr, gtr, Xte, yte, gte = X[tr], y[tr], groups[tr], X[te], y[te], groups[te]
    assert not (set(gtr) & set(gte)), "group leakage between train and test"

    # ---- 3. model selection on out-of-fold predictions (train portion only) ----
    scores, oofs = {}, {}
    for name, m in candidates(a.seed).items():
        oofs[name] = oof_proba(m, Xtr, ytr, gtr, a.seed)
        scores[name] = float(roc_auc_score(ytr, oofs[name]))
        print(f"CV AUC {name}: {scores[name]:.3f}")
    best = max(scores, key=scores.get)
    print(f"Selected: {best}")
    thr_high = threshold_for_sensitivity(ytr, oofs[best], a.target_sens)
    thr_low = threshold_for_sensitivity(ytr, oofs[best], a.safe_sens)
    thr_low = min(thr_low, thr_high)

    # ---- 4. single evaluation on the held-out test set ----
    final_eval = clone(candidates(a.seed)[best]).fit(Xtr, ytr)
    pte = final_eval.predict_proba(Xte)[:, 1]
    test_metrics = outcome_metrics(yte, pte, thr_low, thr_high)
    test_ci = group_bootstrap_ci(yte, pte, gte, thr_low, thr_high, seed=a.seed)
    print("\nHELD-OUT TEST (infants never seen in training or tuning):")
    for k, v in test_metrics.items():
        ci = test_ci.get(k)
        print(f"  {k:18s} {v:.3f}" + (f"   95% CI [{ci[0]:.3f}, {ci[1]:.3f}]" if ci else ""))
    print(f"  test set: {len(yte)} images, {len(set(gte))} groups, {int(yte.sum())} jaundiced")

    # ---- 5. label-shuffle control ----
    rng = np.random.default_rng(a.seed)
    gl = pd.Series(ytr).groupby(gtr).agg(lambda s: int(round(s.mean())))
    shuffled_auc = []
    for _ in range(5):
        perm = dict(zip(gl.index, rng.permutation(gl.values)))
        ys = np.array([perm[g] for g in gtr])
        if len(set(ys)) < 2:
            continue
        shuffled_auc.append(roc_auc_score(ys, oof_proba(candidates(a.seed)[best], Xtr, ys, gtr, a.seed)))
    print(f"\nLabel-shuffle control AUC: {np.mean(shuffled_auc):.3f} +/- {np.std(shuffled_auc):.3f} (should be ~0.5)")
    if np.mean(shuffled_auc) > 0.62:
        print("WARNING: shuffled-label AUC is well above chance, which indicates leakage. Do not trust these results.")

    # ---- 6. final model on all usable data + out-of-distribution guard ----
    final = clone(candidates(a.seed)[best]).fit(X, y)
    scaler = StandardScaler().fit(X)
    Z = scaler.transform(X)
    lw = LedoitWolf().fit(Z)
    md2 = lw.mahalanobis(Z)
    ood = {"mean": scaler.mean_, "scale": scaler.scale_, "loc": lw.location_, "precision": lw.precision_,
           "limit": float(np.percentile(md2, 99.5) * 1.5)}
    version = f"neoscan-{best}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M')}"
    joblib.dump({"model": final, "feature_names": FEATURE_NAMES, "thr_low": thr_low, "thr_high": thr_high,
                 "ood": ood, "version": version}, out / "model.joblib")

    # ---- 7. reports ----
    fpr, tpr, _ = roc_curve(yte, pte)
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        plt.figure(figsize=(4.5, 4.5))
        plt.plot(fpr, tpr, label=f"AUC {test_metrics['auc']:.2f}")
        plt.plot([0, 1], [0, 1], "--", color="grey")
        plt.xlabel("False positive rate")
        plt.ylabel("Sensitivity")
        plt.title("Held-out test ROC")
        plt.legend()
        plt.tight_layout()
        plt.savefig(out / "roc_test.png", dpi=150)
    except Exception as e:  # plotting must never block saving the model
        print("ROC plot skipped:", e)
    report = {"version": version, "selected_model": best, "cv_auc": scores,
              "thresholds": {"clear_below": thr_low, "flag_at_or_above": thr_high,
                             "target_sens": a.target_sens, "safe_sens": a.safe_sens},
              "test": {"metrics": test_metrics, "ci95": test_ci, "n_images": int(len(yte)),
                       "n_groups": int(len(set(gte))), "n_jaundiced": int(yte.sum())},
              "label_shuffle_auc_mean": float(np.mean(shuffled_auc)),
              "n_images_used": int(len(y)), "n_rejected": len(rejects),
              "note": "Final deployed model is refit on all usable data; the test numbers above come from the "
                      "model fit on the training portion only."}
    (out / "metrics.json").write_text(json.dumps(report, indent=2))
    print(f"\nSaved {out/'model.joblib'}, metrics.json, rejected_images.csv")


if __name__ == "__main__":
    main()
