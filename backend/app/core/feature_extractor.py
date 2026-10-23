"""
Multi-ROI Feature Extraction & Quality-Weighted Fusion
Extracts statistical color features per ROI (forehead, nose, sternum, sclera)
both before and after color correction, and fuses them into a composite
feature representation weighted by image quality, sharpness, and skin purity.

Design Rationale:
Neonatal jaundice presents along a cephalo-caudal gradient (face before chest).
However, real-world smartphone photos may have one eye closed, clothing partially
covering the chest, or motion blur. Rather than taking a naive unweighted average,
NeoScan calculates an optical quality confidence factor Q_r for each ROI:
Q_r = min(1.0, sharpness / 50.0) * valid_pixel_ratio * skin_purity
The fused biomarker is the quality-normalized weighted sum:
J_fused = sum(w_r * Q_r * J_r) / sum(w_r * Q_r)
"""

import cv2
import numpy as np
from typing import Dict, Any, List
from .color_spaces import ColorSpaceTransformer
from .skin_segmentation import SkinSegmenter
from ..config import ROIFusionWeights

class FeatureExtractor:
    def __init__(self):
        self.skin_segmenter = SkinSegmenter()
        self.transformer = ColorSpaceTransformer()
        self.weights = {
            "forehead": ROIFusionWeights.FOREHEAD_WEIGHT,
            "nose": ROIFusionWeights.NOSE_WEIGHT,
            "chest": ROIFusionWeights.STERNUM_WEIGHT,
            "sclera": ROIFusionWeights.SCLERA_WEIGHT
        }

    def compute_roi_sharpness(self, bgr_image: np.ndarray, mask: np.ndarray) -> float:
        """Computes Laplacian variance inside the specific ROI."""
        if mask is None or np.sum(mask > 0) < 50:
            return 0.0
            
        gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
        # Bounding box of mask
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
        Extracts comprehensive before-and-after color metrics for all ROIs,
        evaluates quality factors, and performs weighted fusion.
        """
        roi_results = {}
        total_quality_weight = 0.0
        
        # Accumulators for weighted fusion of corrected features
        fused_b_star = 0.0
        fused_bix = 0.0
        fused_cr_cb = 0.0
        fused_yb_diff = 0.0

        for name, roi_info in rois.items():
            if roi_info is None or roi_info.get("mask") is None:
                continue
                
            mask = roi_info["mask"]
            nominal_weight = self.weights.get(name, 0.20)
            
            # Extract valid skin pixels from both raw and corrected images
            raw_pixels, skin_mask, purity = self.skin_segmenter.isolate_roi_skin(
                raw_bgr, mask, quality_valid_mask
            )
            corrected_pixels, _, _ = self.skin_segmenter.isolate_roi_skin(
                corrected_bgr, mask, quality_valid_mask
            )
            
            if len(corrected_pixels) < 15:
                # Insufficient valid pixels in this ROI
                roi_results[name] = {
                    "available": False,
                    "reason": "Insufficient valid unclipped dermal pixels"
                }
                continue
                
            # Sharpness & Quality Factor
            sharpness = self.compute_roi_sharpness(corrected_bgr, mask)
            sharpness_factor = min(1.0, max(0.1, sharpness / 40.0))
            valid_ratio = float(len(corrected_pixels) / max(np.sum(mask > 0), 1))
            
            # Quality factor Q_r
            Q_r = sharpness_factor * valid_ratio * max(0.2, purity)
            effective_weight = nominal_weight * Q_r
            
            # Color Metrics Before & After
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

        # Final quality-normalized fused metrics
        if total_quality_weight > 1e-4:
            fused_b_star /= total_quality_weight
            fused_bix /= total_quality_weight
            fused_cr_cb /= total_quality_weight
            fused_yb_diff /= total_quality_weight
        else:
            # Fallback if no specific ROIs passed: use center face crop
            center_h, center_w = corrected_bgr.shape[:2]
            center_crop = corrected_bgr[int(center_h*0.3):int(center_h*0.6), int(center_w*0.3):int(center_w*0.7)]
            center_metrics = self.transformer.extract_metrics(center_crop.reshape(-1, 3))
            fused_b_star = center_metrics["lab_b_mean"]
            fused_bix = center_metrics["bilirubin_index"]
            fused_cr_cb = center_metrics["cr_cb_ratio"]
            fused_yb_diff = center_metrics["yellow_blue_diff"]

        fused_summary = {
            "fused_lab_b_star": round(float(fused_b_star), 2),
            "fused_bilirubin_index": round(float(fused_bix), 4),
            "fused_cr_cb_ratio": round(float(fused_cr_cb), 3),
            "fused_yellow_blue_diff": round(float(fused_yb_diff), 4),
            "total_confidence_weight": round(float(total_quality_weight), 3)
        }

        return {
            "rois": roi_results,
            "fused_biomarkers": fused_summary
        }
