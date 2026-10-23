"""
FastAPI REST API Routes
Exposes full CV/ML pipeline endpoints for neonatal jaundice screening.
"""

import os
import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from ..core.quality_gate import QualityGate
from ..core.lighting_detector import LightingDetector
from ..core.color_constancy import ColorConstancy
from ..core.card_calibration import CardCalibrator
from ..core.sclera_balancer import ScleraBalancer
from ..core.face_roi import FaceROIExtractor
from ..core.feature_extractor import FeatureExtractor
from ..core.classifier import JaundiceClassifier
from ..utils.image_io import ImageIO

router = APIRouter()

# Initialize core pipeline singletons
quality_gate = QualityGate()
lighting_detector = LightingDetector()
card_calibrator = CardCalibrator()
sclera_balancer = ScleraBalancer()
face_extractor = FaceROIExtractor()
feature_extractor = FeatureExtractor()
classifier = JaundiceClassifier()

class AnalyzeRequest(BaseModel):
    image_base64: str
    correction_method: Optional[str] = "auto"
    include_visualizations: Optional[bool] = True

@router.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "NeoScan Pediatric Screening Engine",
        "version": "1.0.0",
        "mediapipe_active": face_extractor.has_mediapipe,
        "model_loaded": classifier is not None,
        "supported_methods": [
            "auto", "card_ccm", "sclera_wb", "shades_of_gray", 
            "gray_world", "white_patch", "gray_edge", "none"
        ]
    }

@router.post("/analyze")
def analyze_image(payload: AnalyzeRequest):
    """
    Primary End-to-End Clinical Screening Endpoint.
    Executes stages 0 through 6:
    Quality Gating -> Lighting Detection -> Constancy / Card Calibration -> 
    ROI Extraction -> Skin Segmentation -> Feature Fusion -> ML Risk Scoring.
    """
    try:
        # Decode input image
        raw_bgr = ImageIO.decode_base64_or_bytes(payload.image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

    # Stage 0: Quality Gating
    quality_meta = quality_gate.evaluate_image(raw_bgr)
    valid_mask = quality_meta["valid_mask"]

    # Stage 1: Ambient Lighting Condition Detection
    lighting_meta = lighting_detector.detect_lighting(raw_bgr, valid_mask)

    # Stage 2: Color Constancy & Illumination Correction
    requested_method = (payload.correction_method or "auto").lower()
    calibration_meta = {}
    active_method = requested_method
    
    # Extract ROIs early if needed for sclera balancing
    roi_data = face_extractor.extract_rois(raw_bgr)
    
    if requested_method == "auto":
        # Smart Automatic Selection Hierarchy:
        # 1. If physical ArUco card is present, use Card CCM (Gold Standard)
        # 2. Else if sclera eye white is visible, use Sclera WB
        # 3. Else fallback to Shades-of-Gray (p=6)
        card_corrected, card_meta = card_calibrator.calibrate(raw_bgr)
        if card_meta.get("card_detected", False):
            corrected_bgr = card_corrected
            active_method = "card_ccm"
            calibration_meta = card_meta
        else:
            sclera_corrected, sclera_meta = sclera_balancer.calibrate(raw_bgr, roi_data["eye_masks"])
            if sclera_meta.get("sclera_detected", False):
                corrected_bgr = sclera_corrected
                active_method = "sclera_wb"
                calibration_meta = sclera_meta
            else:
                corrected_bgr, const_meta = ColorConstancy.correct(raw_bgr, method="shades_of_gray", mask=valid_mask)
                active_method = "shades_of_gray"
                calibration_meta = const_meta
    elif requested_method == "card_ccm":
        corrected_bgr, calibration_meta = card_calibrator.calibrate(raw_bgr)
        active_method = "card_ccm"
    elif requested_method == "sclera_wb":
        corrected_bgr, calibration_meta = sclera_balancer.calibrate(raw_bgr, roi_data["eye_masks"])
        active_method = "sclera_wb"
    elif requested_method in ["shades_of_gray", "gray_world", "white_patch", "gray_edge", "none"]:
        corrected_bgr, calibration_meta = ColorConstancy.correct(raw_bgr, method=requested_method, mask=valid_mask)
        active_method = requested_method
    else:
        corrected_bgr, calibration_meta = ColorConstancy.correct(raw_bgr, method="shades_of_gray", mask=valid_mask)
        active_method = "shades_of_gray"

    # Stage 3 & 4: Re-extract ROIs on corrected image if necessary or use detected masks
    # (Masks are geometric polygons invariant to color)
    rois = roi_data["rois"]

    # Stage 5: Multi-ROI Feature Extraction & Quality-Weighted Fusion
    features_meta = feature_extractor.extract_all_features(
        raw_bgr=raw_bgr,
        corrected_bgr=corrected_bgr,
        rois=rois,
        quality_valid_mask=valid_mask
    )

    # Stage 6: Clinical Risk Classification & Calibration
    fused_biomarkers = features_meta["fused_biomarkers"]
    risk_assessment = classifier.predict_risk(fused_biomarkers)

    # Real-Time Image Tracking Telemetry (Normalized 0.0 - 1.0 Coordinates)
    h_img, w_img = raw_bgr.shape[:2]
    tracking_rois = {}
    for name, r in rois.items():
        if r is not None and r.get("bbox") is not None:
            bx, by, bw, bh = r["bbox"]
            tracking_rois[name] = {
                "x": round(float(bx) / w_img, 4),
                "y": round(float(by) / h_img, 4),
                "w": round(float(bw) / w_img, 4),
                "h": round(float(bh) / h_img, 4),
            }

    card_tracking = None
    if calibration_meta.get("card_detected") and calibration_meta.get("marker_corners"):
        corners = calibration_meta["marker_corners"]
        card_tracking = {
            "corners": [[round(float(pt[0]) / w_img, 4), round(float(pt[1]) / h_img, 4)] for pt in corners],
            "marker_id": calibration_meta.get("marker_id", 0)
        }

    # Distance & Framing Telemetry based on apparent ROI proportions
    fh_box = tracking_rois.get("forehead")
    face_detected = roi_data.get("face_detected", False)

    if fh_box:
        apparent_width = fh_box["w"]
        if apparent_width < 0.16:
            distance_status = "TOO_FAR"
            distance_advice = "Move closer (approx 25-30 cm)"
            distance_cm = 45
        elif apparent_width > 0.52:
            distance_status = "TOO_CLOSE"
            distance_advice = "Move slightly further away"
            distance_cm = 16
        else:
            distance_status = "OPTIMAL"
            distance_advice = "Optimal screening distance"
            distance_cm = 28
    else:
        distance_status = "OPTIMAL" if face_detected else "SEARCHING"
        distance_advice = "Keep face centered in frame"
        distance_cm = 30

    tracking_data = {
        "locked": face_detected or bool(tracking_rois),
        "distance_status": distance_status,
        "distance_advice": distance_advice,
        "estimated_distance_cm": distance_cm,
        "rois": tracking_rois,
        "card": card_tracking
    }

    # Visualizations
    visualizations = {}
    if payload.include_visualizations:
        # 1. Corrected Image
        visualizations["corrected_image_base64"] = ImageIO.encode_bgr_to_base64(corrected_bgr)
        
        # 2. Diagnostic ROI & Calibration Overlay
        diag_overlay = ImageIO.create_diagnostic_overlay(raw_bgr, corrected_bgr, rois, calibration_meta)
        visualizations["diagnostic_overlay_base64"] = ImageIO.encode_bgr_to_base64(diag_overlay)
        
        # 3. Bilirubin Yellowness Thermal Heatmap
        # Full skin mask from segmenter
        full_skin_mask = feature_extractor.skin_segmenter.compute_skin_mask(corrected_bgr, valid_mask)
        heatmap_img = ImageIO.generate_yellowness_heatmap(corrected_bgr, full_skin_mask)
        visualizations["yellowness_heatmap_base64"] = ImageIO.encode_bgr_to_base64(heatmap_img)

    return {
        "success": True,
        "active_correction_method": active_method,
        "quality_gate": {
            "passed": quality_meta["passed"],
            "sharpness_score": quality_meta["sharpness_score"],
            "is_sharp": quality_meta["is_sharp"],
            "valid_pixel_ratio": quality_meta["valid_pixel_ratio"],
            "overexposed_ratio": quality_meta["overexposed_ratio"],
            "underexposed_ratio": quality_meta["underexposed_ratio"],
            "warnings": quality_meta["warnings"]
        },
        "lighting_condition": lighting_meta,
        "calibration_details": calibration_meta,
        "face_detection": {
            "detected": roi_data["face_detected"],
            "method": roi_data["detection_method"],
            "rois_found": [k for k, v in rois.items() if v.get("mask") is not None]
        },
        "fused_biomarkers": fused_biomarkers,
        "roi_breakdown": {
            k: {
                "available": v.get("available", False),
                "quality_score": v.get("quality_score", 0.0),
                "effective_weight": v.get("effective_weight", 0.0),
                "raw_b_star": v.get("raw_metrics", {}).get("lab_b_mean", 0.0),
                "corrected_b_star": v.get("corrected_metrics", {}).get("lab_b_mean", 0.0),
                "corrected_bix": v.get("corrected_metrics", {}).get("bilirubin_index", 0.0)
            } for k, v in features_meta["rois"].items()
        },
        "risk_assessment": risk_assessment,
        "tracking": tracking_data,
        "visualizations": visualizations
    }

@router.get("/demo-samples")
def list_demo_samples():
    """Lists preloaded demo infant images."""
    sample_dir = "/Users/dakshakhare/Desktop/Avishkar/ml/sample_images"
    samples = []
    
    catalog = [
        {
            "id": "healthy_daylight",
            "filename": "baby_healthy_daylight.jpg",
            "title": "Healthy Neonate (Daylight D65)",
            "expected_risk": "LOW_RISK",
            "lighting": "Balanced Daylight (~5500K)",
            "notes": "Natural baseline dermal color without hyperbilirubinemia."
        },
        {
            "id": "moderate_tungsten",
            "filename": "baby_moderate_tungsten.jpg",
            "title": "Moderate Jaundice (Warm Incandescent)",
            "expected_risk": "MODERATE_RISK",
            "lighting": "Warm Tungsten (2800K)",
            "notes": "Under warm bulbs, naive RGB produces false alarms. NeoScan's color constancy corrects the shift."
        },
        {
            "id": "severe_overcast",
            "filename": "baby_severe_overcast.jpg",
            "title": "Severe Jaundice (Cool Overcast)",
            "expected_risk": "HIGH_RISK",
            "lighting": "Cool Overcast (7200K)",
            "notes": "Cool blueish light masks severe jaundice. NeoScan reveals the critical risk."
        },
        {
            "id": "with_aruco_card",
            "filename": "baby_with_aruco_card.jpg",
            "title": "Neonate with ArUco Reference Card",
            "expected_risk": "MODERATE_RISK",
            "lighting": "Warm Indoor (3200K)",
            "notes": "Gold standard ground-truth CCM calibration using ArUco 4x4 ID 0 marker."
        }
    ]
    
    for item in catalog:
        fpath = os.path.join(sample_dir, item["filename"])
        if os.path.exists(fpath):
            img = cv2.imread(fpath)
            if img is not None:
                b64 = ImageIO.encode_bgr_to_base64(img, quality=75)
                samples.append({**item, "image_base64": b64})
                
    return {"samples": samples}
