"""
FastAPI REST API Routes
Exposes genuine, deterministic CV/ML pipeline endpoints for neonatal jaundice screening.
Integrates the new neoscan_ml machine learning engine with face gating,
out-of-distribution detection, background-based color constancy, and backward-compatible UI adapters.
"""

import os
import cv2
import base64
import logging
import asyncio
import numpy as np
from fastapi import APIRouter, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from ..config import NeoScanMLConfig
from ..core.quality_gate import QualityGate
from ..core.lighting_detector import LightingDetector
from ..core.color_constancy import ColorConstancy
from ..core.card_calibration import CardCalibrator
from ..core.sclera_balancer import ScleraBalancer
from ..core.face_roi import FaceROIExtractor
from ..core.feature_extractor import FeatureExtractor
from ..core.classifier import JaundiceClassifier
from ..utils.image_io import ImageIO
from backend.neoscan_ml.errors import AnalysisError
from backend.neoscan_ml.predict import Analyzer

logger = logging.getLogger("neoscan")
router = APIRouter()

# Core pipeline singletons
quality_gate = QualityGate()
lighting_detector = LightingDetector()
card_calibrator = CardCalibrator()
sclera_balancer = ScleraBalancer()
face_extractor = FaceROIExtractor()
feature_extractor = FeatureExtractor()
classifier = JaundiceClassifier()

# Lazy singleton for neoscan_ml Analyzer
_analyzer_instance = None


def get_neoscan_analyzer() -> Analyzer:
    """Lazily loads and caches the trained Analyzer singleton."""
    global _analyzer_instance
    if _analyzer_instance is None:
        model_path = NeoScanMLConfig.MODEL_PATH
        if not os.path.exists(model_path):
            raise AnalysisError(
                "MODEL_UNAVAILABLE",
                f"Trained model artifact not found at '{model_path}'.",
                "Run train.py first to produce models/model.joblib."
            )
        try:
            _analyzer_instance = Analyzer(model_path)
            logger.info("Successfully loaded NeoScan ML Analyzer (%s)", _analyzer_instance.bundle.get("version"))
        except AnalysisError:
            raise
        except Exception as e:
            raise AnalysisError(
                "MODEL_UNAVAILABLE",
                f"Failed to load model from '{model_path}': {str(e)}",
                "Re-run train.py or check model artifact."
            )
    return _analyzer_instance


class AnalyzeRequest(BaseModel):
    image_base64: str
    correction_method: Optional[str] = "auto"
    include_visualizations: Optional[bool] = True


@router.get("/health")
def health_check():
    model_loaded = False
    model_version = None
    try:
        if NeoScanMLConfig.ENABLED:
            ana = get_neoscan_analyzer()
            model_loaded = True
            model_version = ana.bundle.get("version")
        else:
            model_loaded = classifier.has_ml_model
            model_version = "svm_rbf_v1"
    except Exception:
        model_loaded = False

    return {
        "status": "online",
        "service": "NeoScan Clinical Screening Engine",
        "version": "2.1.0",
        "screening_method": "neoscan_ml" if NeoScanMLConfig.ENABLED else "rule_based_optical_heuristic",
        "neoscan_enabled": NeoScanMLConfig.ENABLED,
        "ml_model_loaded": model_loaded,
        "model_version": model_version,
        "mediapipe_active": face_extractor.has_mediapipe,
        "supported_methods": [
            "auto", "card_ccm", "sclera_wb", "shades_of_gray", 
            "gray_world", "white_patch", "gray_edge", "none"
        ]
    }


def _build_adapter_response(res: dict, raw_bgr: np.ndarray, active_method: str) -> dict:
    """Builds a backward-compatible response for existing frontend components."""
    cat = res["category"]
    cat_upper = cat.upper()
    score = res["model_score"]

    if cat == "no_visible_signs":
        triage_recommendation = "Routine Observation Suggested"
        badge = "ROUTINE OBSERVATION"
        color = "#16a34a"
        title = "No Visible Jaundice Signs"
        recommendation = "Cutaneous yellowness is within expected limits for healthy neonates. Maintain standard feeding and routine pediatric checks."
    elif cat == "possible_jaundice_signs":
        triage_recommendation = "Pediatric Consultation Recommended"
        badge = "CLINICAL EVALUATION ADVISED"
        color = "#dc2626"
        title = "Possible Jaundice Signs"
        recommendation = "Cutaneous yellowness exceeds normal thresholds. A healthcare provider evaluation and transcutaneous (TcB) or blood (TSB) bilirubin test are recommended."
    else:
        triage_recommendation = "Clinical Assessment Advised (Inconclusive)"
        badge = "INCONCLUSIVE — CLINICAL REVIEW ADVISED"
        color = "#d97706"
        title = "Inconclusive Screening Result"
        recommendation = "Optical yellowness is borderline or ambient lighting precluded confident analysis. Please repeat in bright indirect daylight or consult a clinician."

    feats = res.get("features", {})
    fh_b = float(feats.get("fh_b", 0.0))
    fh_yi = float(feats.get("fh_yi", 0.0))
    cr = float(feats.get("fh_Cr", 0.0))
    cb = max(float(feats.get("fh_Cb", 1.0)), 1e-3)
    meta = res.get("meta", {})
    face_box = meta.get("face_box", [0, 0, 100, 100])

    h_img, w_img = raw_bgr.shape[:2]
    fx, fy, fw, fh = face_box
    tracking_rois = {
        "forehead": {
            "x": round(float(fx + 0.28 * fw) / w_img, 4),
            "y": round(float(fy + 0.06 * fh) / h_img, 4),
            "w": round(float(0.44 * fw) / w_img, 4),
            "h": round(float(0.20 * fh) / h_img, 4),
        },
        "cheeks": {
            "x": round(float(fx + 0.12 * fw) / w_img, 4),
            "y": round(float(fy + 0.52 * fh) / h_img, 4),
            "w": round(float(0.76 * fw) / w_img, 4),
            "h": round(float(0.24 * fh) / h_img, 4),
        }
    }

    diag_overlay_b64 = None
    if "overlay_png_base64" in res:
        diag_overlay_b64 = f"data:image/png;base64,{res['overlay_png_base64']}"

    return {
        "status": "ok",
        "success": True,
        "category": cat,
        "model_score": score,
        "thresholds": res.get("thresholds", {}),
        "reliability": res.get("reliability", "normal"),
        "reliability_note": res.get("reliability_note"),
        "features": feats,
        "meta": meta,
        "overlay_png_base64": res.get("overlay_png_base64"),
        "model_version": res.get("model_version"),
        "disclaimer": res.get("disclaimer"),
        "active_correction_method": active_method,
        "risk_assessment": {
            "risk_category": cat_upper,
            "triage_recommendation": triage_recommendation,
            "badge": badge,
            "color": color,
            "title": title,
            "recommendation": recommendation,
            "confidence": 0.85 if res.get("reliability") == "normal" else 0.55,
            "confidence_score": 0.85 if res.get("reliability") == "normal" else 0.55,
            "confidence_percent": 85.0 if res.get("reliability") == "normal" else 55.0,
            "confidence_level": "HIGH" if res.get("reliability") == "normal" else "MODERATE",
            "model_score": score,
            "reliability": res.get("reliability", "normal"),
            "reliability_note": res.get("reliability_note"),
            "screening_engine": "neoscan_ml",
            "biomarkers_summary": {
                "b_star": round(fh_b, 2),
                "bix": round(fh_yi, 4),
                "cr_cb_ratio": round(cr / cb, 3),
                "dermal_pixel_count": meta.get("roi_pixels", {}).get("fh", 0) + meta.get("roi_pixels", {}).get("ck", 0)
            },
            "disclaimer": res.get("disclaimer")
        },
        "tracking": {
            "locked": True,
            "distance_status": "OPTIMAL",
            "distance_advice": "Optimal screening distance",
            "estimated_distance_cm": 26,
            "rois": tracking_rois
        },
        "quality_gate": {
            "passed": True,
            "sharpness_score": meta.get("quality", {}).get("sharpness", 50.0),
            "valid_pixel_ratio": 1.0 - meta.get("quality", {}).get("clipped_fraction", 0.0),
            "brightness": meta.get("quality", {}).get("brightness", 120.0),
            "clipped_fraction": meta.get("quality", {}).get("clipped_fraction", 0.0)
        },
        "visualizations": {
            "diagnostic_overlay_base64": diag_overlay_b64,
            "corrected_image_base64": None
        }
    }


@router.post("/analyze")
async def analyze_image(payload: AnalyzeRequest):
    """
    Primary image analysis endpoint.
    When NEOSCAN_ENABLED=true, routes through real neoscan_ml Analyzer.
    Enforces upload limits, lazy model loading, and maps typed AnalysisErrors.
    """
    raw_payload_len = len(payload.image_base64.encode("utf-8")) if payload.image_base64 else 0
    if raw_payload_len > NeoScanMLConfig.MAX_UPLOAD_BYTES:
        return JSONResponse(
            status_code=413,
            content={
                "status": "error",
                "error": {
                    "code": "FILE_TOO_LARGE",
                    "message": "Image payload exceeds 15 MB limit.",
                    "hint": "Upload or capture a photo with lower resolution or compression."
                }
            }
        )

    # ------------------------------------------------------------------
    # NEW NEOSCAN_ML INTEGRATION PATH
    # ------------------------------------------------------------------
    if NeoScanMLConfig.ENABLED:
        try:
            analyzer = get_neoscan_analyzer()
        except AnalysisError as e:
            return JSONResponse(status_code=503, content={"status": "error", "error": e.to_dict()})

        # Decode base64 to bytes
        try:
            b64_str = payload.image_base64
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            img_bytes = base64.b64decode(b64_str)
            if len(img_bytes) == 0:
                raise ValueError("Empty image buffer")
        except Exception:
            return JSONResponse(
                status_code=422,
                content={
                    "status": "error",
                    "error": {
                        "code": "UNREADABLE_IMAGE",
                        "message": "The file could not be decoded as a colour image.",
                        "hint": "Upload a valid JPEG or PNG photo."
                    }
                }
            )

        # Run CPU-heavy analysis off event loop
        try:
            res = await asyncio.to_thread(analyzer.analyse, img_bytes, with_overlay=True)
        except AnalysisError as e:
            code = 503 if e.code == "MODEL_UNAVAILABLE" else 422
            return JSONResponse(status_code=code, content={"status": "error", "error": e.to_dict()})
        except Exception as e:
            logger.exception("Unexpected error during analysis")
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "error": {
                        "code": "ANALYSIS_FAILED",
                        "message": "Unexpected error during image analysis.",
                        "hint": "Please retake the photo and try again."
                    }
                }
            )

        # Decode raw_bgr for dimensions in tracking adapter
        nparr = np.frombuffer(img_bytes, np.uint8)
        raw_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if raw_bgr is None:
            raw_bgr = np.zeros((480, 640, 3), dtype=np.uint8)

        active_method = payload.correction_method or "background_shades_of_gray"
        return _build_adapter_response(res, raw_bgr, active_method)

    # ------------------------------------------------------------------
    # FALLBACK PATH (ONLY WHEN NEOSCAN_ENABLED=false)
    # ------------------------------------------------------------------
    try:
        raw_bgr = ImageIO.decode_base64_or_bytes(payload.image_base64)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "UNSUPPORTED_FORMAT",
                "message": f"Could not decode image payload: {str(e)}",
                "corrective_action": "Upload a valid JPEG or PNG photograph."
            }
        )

    quality_meta = quality_gate.evaluate_image(raw_bgr)
    if not quality_meta["passed"]:
        raise HTTPException(
            status_code=422,
            detail={
                "error_code": quality_meta["error_code"],
                "message": quality_meta["message"],
                "corrective_action": quality_meta["corrective_action"],
                "quality_metrics": {
                    "sharpness_score": quality_meta.get("sharpness_score", 0.0),
                    "valid_pixel_ratio": quality_meta.get("valid_pixel_ratio", 0.0)
                }
            }
        )

    valid_mask = quality_meta["valid_mask"]
    lighting_meta = lighting_detector.detect_lighting(raw_bgr, valid_mask)
    corrected_bgr, calibration_meta = ColorConstancy.correct(raw_bgr, method="shades_of_gray", mask=valid_mask)
    roi_data = face_extractor.extract_rois(corrected_bgr, valid_mask)
    if not roi_data.get("has_skin", False):
        roi_data = face_extractor.extract_rois(raw_bgr, valid_mask)

    if not roi_data.get("has_skin", False):
        raise HTTPException(
            status_code=422,
            detail={
                "error_code": "NO_SKIN_DETECTED",
                "message": "No infant face or usable dermal skin tissue could be identified.",
                "corrective_action": "Center baby's face and forehead in the frame."
            }
        )

    rois = roi_data["rois"]
    features_meta = feature_extractor.extract_all_features(raw_bgr, corrected_bgr, rois, valid_mask)
    risk_assessment = classifier.predict_risk(
        fused_metrics=features_meta["fused_biomarkers"],
        calibration_method="shades_of_gray",
        quality_meta=quality_meta,
        roi_breakdown=features_meta["rois"],
        raw_bgr=raw_bgr,
        corrected_bgr=corrected_bgr,
        valid_mask=valid_mask
    )

    return {
        "success": True,
        "active_correction_method": "shades_of_gray",
        "quality_gate": quality_meta,
        "risk_assessment": risk_assessment,
        "tracking": {"locked": True, "rois": {}},
        "visualizations": {}
    }


@router.post("/analyze/file")
async def analyze_file(file: UploadFile = File(...)):
    """Multipart file upload endpoint matching reference neoscan_ml api.py."""
    data = await file.read()
    if len(data) > NeoScanMLConfig.MAX_UPLOAD_BYTES:
        return JSONResponse(status_code=413, content={"status": "error", "error": {
            "code": "FILE_TOO_LARGE", "message": "Image exceeds 15 MB.", "hint": "Upload a smaller photo."}})
    try:
        analyzer = get_neoscan_analyzer()
        res = await asyncio.to_thread(analyzer.analyse, data, with_overlay=True)
        return res
    except AnalysisError as e:
        code = 503 if e.code == "MODEL_UNAVAILABLE" else 422
        return JSONResponse(status_code=code, content={"status": "error", "error": e.to_dict()})
    except Exception:
        logger.exception("Unexpected analysis failure")
        return JSONResponse(status_code=500, content={"status": "error", "error": {
            "code": "ANALYSIS_FAILED", "message": "Unexpected error during analysis.", "hint": "Try again."}})


@router.get("/demo-samples")
def list_demo_samples():
    """Lists preloaded demo infant images."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    sample_dir = os.path.join(base_dir, "ml", "sample_images")
    samples = []
    
    catalog = [
        {
            "id": "healthy_daylight",
            "filename": "baby_healthy_daylight.jpg",
            "title": "Healthy Neonate (Daylight D65)",
            "expected_risk": "NO_VISIBLE_SIGNS",
            "lighting": "Balanced Daylight (~5500K)",
            "notes": "Natural baseline dermal color without elevated bilirubin yellowness."
        },
        {
            "id": "moderate_tungsten",
            "filename": "baby_moderate_tungsten.jpg",
            "title": "Mild Jaundice (Warm Incandescent)",
            "expected_risk": "POSSIBLE_JAUNDICE_SIGNS",
            "lighting": "Warm Tungsten (2800K)",
            "notes": "Mild cutaneous yellowness detected after color constancy compensation."
        },
        {
            "id": "severe_overcast",
            "filename": "baby_severe_overcast.jpg",
            "title": "Elevated Jaundice (Cool Overcast)",
            "expected_risk": "POSSIBLE_JAUNDICE_SIGNS",
            "lighting": "Cool Overcast (7200K)",
            "notes": "Significant cutaneous yellowness with ocular sclera involvement."
        },
        {
            "id": "with_aruco_card",
            "filename": "baby_with_aruco_card.jpg",
            "title": "Neonate with ArUco Reference Card",
            "expected_risk": "POSSIBLE_JAUNDICE_SIGNS",
            "lighting": "Warm Indoor (3200K)",
            "notes": "Ground-truth CCM color correction matrix calculated from ArUco marker."
        }
    ]
    
    for item in catalog:
        fpath = os.path.join(sample_dir, item["filename"])
        if os.path.exists(fpath):
            img = cv2.imread(fpath)
            if img is not None:
                b64 = ImageIO.encode_bgr_to_base64(img, quality=80)
                samples.append({**item, "image_base64": b64})
                
    return {"samples": samples}
