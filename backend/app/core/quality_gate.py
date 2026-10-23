"""
Quality Gating Module
Evaluates image usability, removes clipped highlights & shadows,
and assesses camera focus / motion blur via Laplacian variance.

Design Rationale:
In clinical smartphone imaging, specular flash glare (saturated white) and
deep shadows (underexposed sensor noise) carry no chromaticity information.
If included in ROI mean calculations, specular highlights falsely bleach yellow
pigment, while shadows corrupt color ratios. Discarding them upstream guarantees
that subsequent color constancy and classification operate purely on unclipped dermal reflectance.
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple
from ..config import QualityThresholds

class QualityGate:
    def __init__(self, 
                 min_intensity: int = QualityThresholds.MIN_VALID_INTENSITY,
                 max_intensity: int = QualityThresholds.MAX_VALID_INTENSITY,
                 min_sharpness: float = QualityThresholds.MIN_SHARPNESS_LAPLACIAN_VAR):
        self.min_intensity = min_intensity
        self.max_intensity = max_intensity
        self.min_sharpness = min_sharpness

    def evaluate_image(self, bgr_image: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes full image quality metrics.
        Returns quality flags, valid pixel mask, and blur diagnostics.
        """
        h, w, c = bgr_image.shape
        total_pixels = h * w
        
        # 1. Convert to grayscale for structural sharpness assessment
        gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
        
        # 2. Laplacian operator computes second spatial derivative (detects rapid edge transitions)
        # Low variance => blurred / out of focus; High variance => crisp textures
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness_var = float(laplacian.var())
        is_sharp = sharpness_var >= self.min_sharpness

        # 3. Detect over-exposed (specular highlight) and under-exposed (dark shadow) pixels
        # A pixel is considered clipped if all channels are <= min_intensity or >= max_intensity
        under_exposed_mask = np.all(bgr_image < self.min_intensity, axis=-1)
        over_exposed_mask = np.all(bgr_image > self.max_intensity, axis=-1)
        
        # In addition, check for single-channel saturation (sensor clipping)
        saturated_any_channel = np.any(bgr_image >= 254, axis=-1)
        
        clipped_mask = under_exposed_mask | over_exposed_mask | saturated_any_channel
        valid_mask = ~clipped_mask
        
        under_ratio = float(np.sum(under_exposed_mask) / total_pixels)
        over_ratio = float(np.sum(over_exposed_mask | saturated_any_channel) / total_pixels)
        valid_ratio = float(np.sum(valid_mask) / total_pixels)
        
        # 4. Overall usability verdict
        passed = is_sharp and (valid_ratio >= 0.50) and (over_ratio < 0.35)
        
        warnings = []
        if not is_sharp:
            warnings.append(f"Image is blurry (Sharpness: {sharpness_var:.1f} < {self.min_sharpness:.1f}). Hold phone steady.")
        if over_ratio > 0.20:
            warnings.append(f"High specular glare / overexposure detected ({over_ratio*100:.1f}%). Avoid direct harsh flash.")
        if under_ratio > 0.30:
            warnings.append(f"Severe underexposure detected ({under_ratio*100:.1f}%). Increase ambient room lighting.")
            
        return {
            "passed": passed,
            "sharpness_score": round(sharpness_var, 2),
            "is_sharp": is_sharp,
            "valid_pixel_ratio": round(valid_ratio, 4),
            "overexposed_ratio": round(over_ratio, 4),
            "underexposed_ratio": round(under_ratio, 4),
            "warnings": warnings,
            "valid_mask": valid_mask  # 2D boolean mask
        }

    def filter_roi_pixels(self, bgr_roi: np.ndarray) -> Tuple[np.ndarray, float]:
        """
        Filters an extracted ROI to retain only valid unclipped pixels.
        Returns:
            clean_pixels: Nx3 array of valid BGR values
            valid_ratio: fraction of valid pixels in this ROI
        """
        if bgr_roi.size == 0:
            return np.empty((0, 3), dtype=np.uint8), 0.0
            
        pixels = bgr_roi.reshape(-1, 3)
        valid = (
            (pixels[:, 0] >= self.min_intensity) & (pixels[:, 0] <= self.max_intensity) &
            (pixels[:, 1] >= self.min_intensity) & (pixels[:, 1] <= self.max_intensity) &
            (pixels[:, 2] >= self.min_intensity) & (pixels[:, 2] <= self.max_intensity)
        )
        valid_ratio = float(np.mean(valid))
        return pixels[valid], valid_ratio
