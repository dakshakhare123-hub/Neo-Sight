"""Inference: gate -> features -> out-of-distribution check -> model -> three-way outcome."""
from __future__ import annotations

import base64

import cv2
import joblib
import numpy as np

from .errors import AnalysisError
from .features import extract_features
from .vision import draw_overlay

DISCLAIMER = ("Screening aid only, not a diagnosis. A yellow newborn, or one who feeds poorly or is very "
              "sleepy, needs urgent clinical assessment. Bilirubin must be confirmed by a blood or "
              "transcutaneous measurement.")


class Analyzer:
    def __init__(self, bundle_path: str):
        try:
            self.bundle = joblib.load(bundle_path)
        except FileNotFoundError:
            raise AnalysisError("MODEL_UNAVAILABLE", f"No trained model at '{bundle_path}'.",
                                "Run train.py first.") from None
        self.names = self.bundle["feature_names"]

    def analyse(self, data, with_overlay: bool = True, return_prepared: bool = False):
        feats, meta, prepared = extract_features(data)   # raises on non-face / bad images
        x = np.array([[feats[n] for n in self.names]], dtype=np.float64)
        if not np.isfinite(x).all():
            raise AnalysisError("ANALYSIS_FAILED", "Non-finite feature values.", "Retake the photo.")

        o = self.bundle["ood"]
        z = (x[0] - o["mean"]) / o["scale"]
        d = z - o["loc"]
        md2 = float(d @ o["precision"] @ d)
        if md2 > o["limit"]:
            raise AnalysisError("OUT_OF_DISTRIBUTION",
                                "This image is unlike the data the model was trained on, so no result is given.",
                                "Retake in even daylight, face front-on. If it keeps happening, the model "
                                "needs training data from this camera/lighting.")

        p = float(self.bundle["model"].predict_proba(x)[0, 1])
        thr_low, thr_high = self.bundle["thr_low"], self.bundle["thr_high"]
        if p >= thr_high:
            category = "possible_jaundice_signs"
        elif p < thr_low:
            category = "no_visible_signs"
        else:
            category = "inconclusive"

        out = {
            "status": "ok",
            "category": category,
            "model_score": round(p, 4),            # model score, NOT a bilirubin value or true probability
            "thresholds": {"clear_below": thr_low, "flag_at_or_above": thr_high},
            "reliability": "normal" if meta["colour_normalised"] else "reduced",
            "reliability_note": None if meta["colour_normalised"] else
                "Not enough background to correct for lighting colour; treat as lower confidence.",
            "features": {k: round(float(v), 4) for k, v in feats.items()},
            "meta": meta,
            "model_version": self.bundle["version"],
            "disclaimer": DISCLAIMER,
        }
        if with_overlay:
            ok, buf = cv2.imencode(".png", draw_overlay(prepared))
            if ok:
                out["overlay_png_base64"] = base64.b64encode(buf.tobytes()).decode()
        if return_prepared:
            return out, prepared
        return out
