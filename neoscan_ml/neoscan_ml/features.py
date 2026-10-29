"""Colour features computed from real skin pixels. Same code is used for training and inference."""
from __future__ import annotations

import cv2
import numpy as np

from .vision import Prepared, prepare

PER_ROI = ["L", "a", "b", "b_spread", "H", "S", "V", "Cr", "Cb", "rn", "gn", "yi"]
FEATURE_NAMES = [f"{r}_{n}" for r in ("fh", "ck") for n in PER_ROI] + ["d_b_fh_ck", "d_yi_fh_ck"]


def _region_stats(pix_bgr: np.ndarray) -> dict:
    f = (pix_bgr.astype(np.float32) / 255.0).reshape(-1, 1, 3)
    lab = cv2.cvtColor(f, cv2.COLOR_BGR2LAB).reshape(-1, 3)   # L 0-100, a/b ~ -127..127
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV).reshape(-1, 3)   # H degrees, S/V 0-1
    ycc = cv2.cvtColor(f, cv2.COLOR_BGR2YCrCb).reshape(-1, 3)
    rgb_sum = f.reshape(-1, 3).sum(axis=1) + 1e-6
    med = np.median
    L, a, b = med(lab, axis=0)
    spread = 1.4826 * med(np.abs(lab[:, 2] - b))
    return {
        "L": L, "a": a, "b": b, "b_spread": spread,
        "H": med(hsv[:, 0]), "S": med(hsv[:, 1]), "V": med(hsv[:, 2]),
        "Cr": med(ycc[:, 1]), "Cb": med(ycc[:, 2]),
        "rn": med(f.reshape(-1, 3)[:, 2] / rgb_sum), "gn": med(f.reshape(-1, 3)[:, 1] / rgb_sum),
        "yi": b / (L + 1.0),
    }


def features_from_prepared(p: Prepared) -> dict:
    fh = _region_stats(p.pools["fh"])
    ck = _region_stats(p.pools["ck"])
    feats = {f"fh_{k}": float(v) for k, v in fh.items()}
    feats.update({f"ck_{k}": float(v) for k, v in ck.items()})
    feats["d_b_fh_ck"] = float(fh["b"] - ck["b"])
    feats["d_yi_fh_ck"] = float(fh["yi"] - ck["yi"])
    return feats


def extract_features(data):
    """data -> (feature dict, metadata dict). Raises AnalysisError if the image is unusable."""
    p = prepare(data)
    meta = {
        "face_box": list(map(int, p.face_box)),
        "quality": p.quality,
        "colour_normalised": p.colour_normalised,
        "roi_pixels": {k: int(len(v)) for k, v in p.pools.items()},
        "rotation_k": p.rotation_k,
    }
    return features_from_prepared(p), meta, p
