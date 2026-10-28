"""
Multi-ROI Feature Extraction & Quality-Weighted Fusion
Extracts statistical color features per ROI (forehead, nose, sternum, sclera)
both before and after color correction, and fuses them into a composite
feature representation weighted by image quality, sharpness, and dermal purity.

Strict Policy:
Never fabricates features when no genuine dermal pixels exist.
Computes real statistical metrics (mean, median, standard deviation) from actual pixels.
"""

import cv2
import numpy as np
from typing import Dict, Any, List
from .color_spaces import ColorSpaceTransformer
from .skin_segmentation import SkinSegmenter

class FeatureExtractor:
    def __init__(self):
        self.skin_segmenter = SkinSegmenter()
        self.transformer = ColorSpaceTransformer()
        self.weights = {
            "forehead": 0.45,
            "nose": 0.25,
            "chest": 0.15,
            "sclera": 0.15
        }

    def compute_roi_sharpness(self, bgr_image: np.ndarray, mask: np.ndarray) -> float:
        """Computes Laplacian variance inside the specific ROI."""
        if mask is None or np.sum(mask > 0) < 30:
            return 0.0
            
        gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
        x, y, w, h = cv2.boundingRect(mask)
        roi_gray = gray[y : y + h, x : x + w]
        if roi_gray.size == 0:
            return 0.0
            
        return float(cv2.Laplacian(roi_gray, cv2.CV_64F).var())

    def extract_all_features(self, 
                             raw_bgr: np.ndarray, 
                             corrected_bgr: np.ndarray, 
                             rois: Dict[str, Any],
                             quality_valid_mask: np.ndarray) -> Dict[str, Any]:
        """
        Extracts comprehensive color metrics across ROIs.
        Returns:
            dict containing roi_breakdown, fused_biomarkers, total_skin_pixels,
            and has_sufficient_skin.
        """
        roi_results = {}
        total_quality_weight = 0.0
        total_dermal_pixels = 0
        
        fused_b_star = 0.0
        fused_bix = 0.0
        fused_cr_cb = 0.0
        fused_yb_diff = 0.0

        for name, roi_info in rois.items():
            if roi_info is None or roi_info.get("mask") is None:
                continue
                
            mask = roi_info["mask"]
            nominal_weight = self.weights.get(name, 0.20)
            
            # Isolate genuine unclipped skin pixels
            if name == "sclera":
                # For sclera, extract unclipped eye white pixels
                if quality_valid_mask is not None:
                    sclera_valid = cv2.bitwise_and(mask, (quality_valid_mask.astype(np.uint8) * 255))
                else:
                    sclera_valid = mask
                raw_pixels = raw_bgr[sclera_valid > 0]
                corrected_pixels = corrected_bgr[sclera_valid > 0]
                purity = float(len(corrected_pixels) / max(np.sum(mask > 0), 1))
            else:
                raw_pixels, _, purity = self.skin_segmenter.isolate_roi_skin(
                    raw_bgr, mask, quality_valid_mask
                )
                corrected_pixels, _, _ = self.skin_segmenter.isolate_roi_skin(
                    corrected_bgr, mask, quality_valid_mask
                )
            
            if len(corrected_pixels) < 25:
                roi_results[name] = {
                    "available": False,
                    "reason": "Insufficient valid pixels in ROI",
                    "pixel_count": len(corrected_pixels)
                }
                continue

            if name != "sclera":
                total_dermal_pixels += len(corrected_pixels)
                
            sharpness = self.compute_roi_sharpness(corrected_bgr, mask)
            sharpness_factor = min(1.0, max(0.1, sharpness / 35.0))
            valid_ratio = float(len(corrected_pixels) / max(np.sum(mask > 0), 1))
            
            Q_r = sharpness_factor * valid_ratio * max(0.2, purity)
            effective_weight = nominal_weight * Q_r
            
            raw_metrics = self.transformer.extract_metrics(raw_pixels)
            corrected_metrics = self.transformer.extract_metrics(corrected_pixels)
            
            roi_results[name] = {
                "available": True,
                "nominal_weight": nominal_weight,
                "effective_weight": round(effective_weight, 4),
                "quality_score": round(Q_r, 3),
                "sharpness": round(sharpness, 1),
                "purity": round(purity, 3),
                "pixel_count": len(corrected_pixels),
                "raw_metrics": raw_metrics,
                "corrected_metrics": corrected_metrics
            }
            
            total_quality_weight += effective_weight
            fused_b_star += effective_weight * corrected_metrics["lab_b_mean"]
            fused_bix += effective_weight * corrected_metrics["bilirubin_index"]
            fused_cr_cb += effective_weight * corrected_metrics["cr_cb_ratio"]
            fused_yb_diff += effective_weight * corrected_metrics["yellow_blue_diff"]

        has_sufficient_skin = (total_dermal_pixels >= 100)

        if total_quality_weight > 1e-4:
            fused_b_star /= total_quality_weight
            fused_bix /= total_quality_weight
            fused_cr_cb /= total_quality_weight
            fused_yb_diff /= total_quality_weight

        fused_summary = {
            "fused_lab_b_star": round(float(fused_b_star), 2),
            "fused_bix": round(float(fused_bix), 4),
            "fused_bilirubin_index": round(float(fused_bix), 4),
            "fused_cr_cb_ratio": round(float(fused_cr_cb), 3),
            "fused_yellow_blue_diff": round(float(fused_yb_diff), 4),
            "total_confidence_weight": round(float(total_quality_weight), 3),
            "total_dermal_pixels": total_dermal_pixels
        }

        return {
            "has_sufficient_skin": has_sufficient_skin,
            "total_dermal_pixels": total_dermal_pixels,
            "rois": roi_results,
            "fused_biomarkers": fused_summary
        }
