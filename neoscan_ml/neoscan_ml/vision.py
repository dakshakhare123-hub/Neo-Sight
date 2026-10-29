"""Image validation, face/skin gating, colour normalisation and ROI extraction.

Design rule: if the image is not a usable photo of a newborn's face, raise
AnalysisError. Never fall through to a score.
"""
from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from .errors import AnalysisError

# ---- Tunable thresholds (calibrate on your own data; do not treat as clinical) ----
MAX_SIDE = 1024          # images are downscaled so the longest side is at most this
MIN_SIDE = 240           # shorter side below this is rejected
BLUR_MIN = 40.0          # variance of Laplacian on a 640px image
BRIGHT_MIN, BRIGHT_MAX = 50.0, 210.0
CLIPPED_MAX = 0.25       # fraction of pixels >= 250
FACE_MIN_FRAC = 0.12     # face box must be at least this fraction of the short side
FACE_MIN_SKIN_FRAC = 0.25  # skin fraction inside the central face box (kills false positives)
MIN_ROI_PIXELS = 150     # usable skin pixels needed per region
REF_MIN_FRAC = 0.10      # non-skin reference pixels needed to estimate the light colour

import threading

_cascades = None
_cascade_lock = threading.Lock()


def _get_cascades():
    global _cascades
    if _cascades is None:
        import os
        local_data = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        loaded = []
        for name in ("haarcascade_frontalface_default.xml", "haarcascade_frontalface_alt2.xml"):
            p = os.path.join(getattr(cv2.data, "haarcascades", ""), name)
            if not os.path.exists(p):
                p = os.path.join(local_data, name)
            if not os.path.exists(p):
                p = os.path.join(os.path.dirname(__file__), "data", name)
            c = cv2.CascadeClassifier(p)
            if c.empty():
                raise AnalysisError(
                    "MODEL_UNAVAILABLE",
                    f"OpenCV face cascade '{name}' could not be loaded.",
                    "Reinstall opencv-python / opencv-python-headless.",
                )
            loaded.append(c)
        _cascades = loaded
    return _cascades


def decode_image(data) -> np.ndarray:
    """bytes | path | ndarray -> BGR uint8, validated and size-limited."""
    if isinstance(data, np.ndarray):
        img = data
    elif isinstance(data, (bytes, bytearray)):
        img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    else:
        img = cv2.imread(str(data), cv2.IMREAD_COLOR)
    if img is None or img.size == 0 or img.ndim != 3 or img.shape[2] != 3:
        raise AnalysisError("UNREADABLE_IMAGE", "The file could not be decoded as a colour image.",
                            "Upload a JPEG or PNG photo.")
    img = np.ascontiguousarray(img.astype(np.uint8, copy=False))
    h, w = img.shape[:2]
    if min(h, w) < MIN_SIDE:
        raise AnalysisError("IMAGE_TOO_SMALL", f"Image is {w}x{h}px; the shorter side must be >= {MIN_SIDE}px.",
                            "Move closer or use a higher camera resolution.")
    scale = MAX_SIDE / max(h, w)
    if scale < 1:
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def quality_check(img: np.ndarray) -> dict:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    s = 640 / max(gray.shape)
    small = cv2.resize(gray, None, fx=s, fy=s, interpolation=cv2.INTER_AREA) if s < 1 else gray
    sharpness = float(cv2.Laplacian(small, cv2.CV_64F).var())
    brightness = float(gray.mean())
    clipped = float((gray >= 250).mean())
    dark = float((gray <= 5).mean())
    # Exposure is checked first: sharpness of a black or blown-out frame is meaningless.
    if brightness < BRIGHT_MIN or dark > 0.40:
        raise AnalysisError("POOR_EXPOSURE", "Image is too dark.", "Move to even, bright, indirect light.")
    if brightness > BRIGHT_MAX or clipped > CLIPPED_MAX:
        raise AnalysisError("POOR_EXPOSURE", "Image is over-exposed or has blown-out highlights.",
                            "Avoid flash and direct sunlight on the face.")
    if sharpness < BLUR_MIN:
        raise AnalysisError("IMAGE_TOO_BLURRY", f"Sharpness {sharpness:.1f} is below {BLUR_MIN}.",
                            "Hold the camera steady and tap to focus on the baby's face.")
    return {"sharpness": round(sharpness, 1), "brightness": round(brightness, 1),
            "clipped_fraction": round(clipped, 4)}


def skin_mask(img: np.ndarray) -> np.ndarray:
    """Binary (0/255) mask of skin-like pixels (YCrCb AND HSV rules, cleaned up)."""
    ycc = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    cr, cb = ycc[..., 1], ycc[..., 2]
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    m1 = (cr >= 133) & (cr <= 177) & (cb >= 77) & (cb <= 130)
    m2 = (h <= 30) & (s >= 20) & (s <= 200) & (v >= 50)
    mask = (m1 & m2).astype(np.uint8) * 255
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k)
    return mask


def detect_face(img: np.ndarray):
    """Return (image_rotated_if_needed, (x, y, w, h), k) or raise NO_FACE_DETECTED.

    Haar cascades produce false positives on textured objects, so every candidate
    must also contain enough skin-coloured pixels in its central region.
    """
    cascades = _get_cascades()
    gray_full = cv2.equalizeHist(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    for k in (0, 1, 3):  # upright, and the two sideways phone orientations
        g = np.ascontiguousarray(np.rot90(gray_full, k))
        min_size = int(FACE_MIN_FRAC * min(g.shape))
        cands = []
        with _cascade_lock:
            for c in cascades:
                for (x, y, w, h) in c.detectMultiScale(g, scaleFactor=1.08, minNeighbors=3,
                                                       minSize=(min_size, min_size)):
                    cands.append((int(x), int(y), int(w), int(h)))
        if not cands:
            continue
        rot = np.ascontiguousarray(np.rot90(img, k))
        mask = skin_mask(rot)
        for (x, y, w, h) in sorted(cands, key=lambda b: b[2] * b[3], reverse=True):
            cx0, cx1 = x + int(0.2 * w), x + int(0.8 * w)
            cy0, cy1 = y + int(0.2 * h), y + int(0.8 * h)
            region = mask[cy0:cy1, cx0:cx1]
            if region.size and (region > 0).mean() >= FACE_MIN_SKIN_FRAC:
                return rot, (x, y, w, h), k
    raise AnalysisError("NO_FACE_DETECTED", "No human face was found in the image.",
                        "Frame the baby's face clearly, front-on, filling a good part of the picture.")


def normalise_colour(img: np.ndarray, skin: np.ndarray):
    """Shades-of-Gray illuminant correction estimated from NON-skin pixels only.

    Estimating the light from a skin-dominated image would remove the very yellow
    tint we are trying to measure, so the light colour is taken from the background.
    If there is not enough background, no correction is applied and the result is
    flagged as reduced-reliability.
    """
    f = img.astype(np.float32)
    gray = f.mean(axis=2)
    ref = (skin == 0) & (gray > 30) & (gray < 235) & ((f.max(axis=2) - f.min(axis=2)) < 80)
    if ref.mean() < REF_MIN_FRAC:
        return img, False
    p = 6
    illum = np.power(np.mean(np.power(f[ref], p), axis=0), 1.0 / p)  # BGR
    gain = np.clip(illum.mean() / np.maximum(illum, 1e-6), 0.6, 1.6)
    out = np.clip(f * gain, 0, 255).astype(np.uint8)
    return out, True


def _roi_boxes(face_box, shape):
    x, y, w, h = face_box
    H, W = shape[:2]

    def box(x0, y0, x1, y1):
        return (max(0, int(x + x0 * w)), max(0, int(y + y0 * h)),
                min(W, int(x + x1 * w)), min(H, int(y + y1 * h)))

    return {"fh": box(0.28, 0.06, 0.72, 0.26),
            "ckL": box(0.12, 0.52, 0.34, 0.76),
            "ckR": box(0.66, 0.52, 0.88, 0.76)}


def _pool(img, skin, box):
    x0, y0, x1, y1 = box
    sub = img[y0:y1, x0:x1]
    m = skin[y0:y1, x0:x1] > 0
    v = cv2.cvtColor(sub, cv2.COLOR_BGR2HSV)[..., 2]
    m &= (v >= 40) & (v <= 240)  # drop shadows and specular highlights
    return sub[m]


@dataclass
class Prepared:
    raw: np.ndarray
    norm: np.ndarray
    face_box: tuple
    rois: dict
    pools: dict
    quality: dict
    colour_normalised: bool
    rotation_k: int


def prepare(data) -> Prepared:
    """Full gate. Raises AnalysisError for anything that is not a usable newborn-face photo."""
    img = decode_image(data)
    quality = quality_check(img)
    raw, box, k = detect_face(img)
    skin_raw = skin_mask(raw)
    norm, applied = normalise_colour(raw, skin_raw)
    skin_n = skin_mask(norm)
    rois = _roi_boxes(box, norm.shape)
    fh = _pool(norm, skin_n, rois["fh"])
    ck = np.concatenate([_pool(norm, skin_n, rois["ckL"]), _pool(norm, skin_n, rois["ckR"])])
    if len(fh) < MIN_ROI_PIXELS:
        raise AnalysisError("SKIN_REGION_TOO_SMALL", "Not enough visible forehead skin.",
                            "Remove hats or hair from the forehead and avoid shadows.")
    if len(ck) < MIN_ROI_PIXELS:
        raise AnalysisError("SKIN_REGION_TOO_SMALL", "Not enough visible cheek skin.",
                            "Face the camera directly with both cheeks visible.")
    return Prepared(raw, norm, box, rois, {"fh": fh, "ck": ck}, quality, applied, k)


def draw_overlay(p: Prepared) -> np.ndarray:
    out = p.raw.copy()
    x, y, w, h = p.face_box
    cv2.rectangle(out, (x, y), (x + w, y + h), (255, 200, 0), 2)
    for name, (x0, y0, x1, y1) in p.rois.items():
        cv2.rectangle(out, (x0, y0), (x1, y1), (0, 200, 0), 2)
    return out
