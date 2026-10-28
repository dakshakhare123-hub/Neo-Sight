"""
Quality Gating Module
Evaluates image usability, detects camera blur (Laplacian variance),
and identifies extreme sensor clipping (specular highlights / underexposed shadows).

Strict Failure Policy:
Never passes unanalyzable, pitch black, blown-out, or heavily blurred images downstream.
Returns specific error codes so users receive actionable corrective guidance.
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple

class QualityGate:
    def __init__(self, 
                 min_intensity: int = 15,
                 max_intensity: int = 245,
                 min_sharpness: float = 35.0,
                 min_dimension: int = 240,
                 max_overexposed_ratio: float = 0.25,
                 max_underexposed_ratio: float = 0.35):
        self.min_intensity = min_intensity
        self.max_intensity = max_intensity
        self.min_sharpness = min_sharpness
        self.min_dimension = min_dimension
        self.max_overexposed_ratio = max_overexposed_ratio
        self.max_underexposed_ratio = max_underexposed_ratio

    def evaluate_image(self, bgr_image: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes image quality metrics.
        Returns:
            dict containing passed (bool), error_code (str or None),
            sharpness_score, valid_pixel_ratio, and corrective guidance.
        """
        if bgr_image is None or bgr_image.size == 0:
            return {
                "passed": False,
                "error_code": "UNSUPPORTED_FORMAT",
                "message": "Image payload could not be decoded.",
                "corrective_action": "Upload a valid JPEG or PNG photograph.",
                "sharpness_score": 0.0,
                "valid_pixel_ratio": 0.0
            }

        h, w = bgr_image.shape[:2]
        total_pixels = h * w

        # 1. Dimension Check
        if h < self.min_dimension or w < self.min_dimension:
            return {
                "passed": False,
                "error_code": "IMAGE_TOO_SMALL",
                "message": f"Image resolution ({w}x{h}) is too low for clinical dermal analysis.",
                "corrective_action": f"Ensure image is at least {self.min_dimension}x{self.min_dimension} pixels.",
                "sharpness_score": 0.0,
                "valid_pixel_ratio": 0.0
            }

        # 2. Structural Sharpness (Laplacian variance on grayscale)
        gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness_var = float(laplacian.var())
        is_sharp = sharpness_var >= self.min_sharpness

        # 3. Exposure / Sensor Clipping Assessment
        # Severe underexposure: all channels very dark
        under_exposed_mask = np.all(bgr_image < self.min_intensity, axis=-1)
        # Severe overexposure / specular glare: all channels near 255 or luminance clipped
        over_exposed_mask = np.all(bgr_image > self.max_intensity, axis=-1) | (gray >= 250)

        under_ratio = float(np.sum(under_exposed_mask) / total_pixels)
        over_ratio = float(np.sum(over_exposed_mask) / total_pixels)

        clipped_mask = under_exposed_mask | over_exposed_mask
        valid_mask = ~clipped_mask
        valid_ratio = float(np.sum(valid_mask) / total_pixels)

        # 4. Strict Quality Verdicts with Actionable Errors
        if under_ratio >= self.max_underexposed_ratio:
            return {
                "passed": False,
                "error_code": "IMAGE_UNDEREXPOSED",
                "message": f"Image is too dark ({under_ratio*100:.1f}% underexposed pixels). Sensor cannot capture dermal chrominance.",
                "corrective_action": "Move baby to an area with brighter, even ambient room lighting and retake.",
                "sharpness_score": round(sharpness_var, 2),
                "valid_pixel_ratio": round(valid_ratio, 4),
                "valid_mask": valid_mask
            }

        if over_ratio >= self.max_overexposed_ratio:
            return {
                "passed": False,
                "error_code": "IMAGE_OVEREXPOSED",
                "message": f"Severe glare or flash blowout detected ({over_ratio*100:.1f}% clipped pixels). Specular reflection bleaches skin pigment.",
                "corrective_action": "Turn off camera flash and avoid direct harsh overhead light pointing at baby's face.",
                "sharpness_score": round(sharpness_var, 2),
                "valid_pixel_ratio": round(valid_ratio, 4),
                "valid_mask": valid_mask
            }

        if not is_sharp:
            return {
                "passed": False,
                "error_code": "IMAGE_TOO_BLURRY",
                "message": f"Image is out of focus or motion-blurred (sharpness score {sharpness_var:.1f} < {self.min_sharpness:.1f}).",
                "corrective_action": "Hold phone steady approximately 25-30 cm from infant's forehead and allow camera to focus.",
                "sharpness_score": round(sharpness_var, 2),
                "valid_pixel_ratio": round(valid_ratio, 4),
                "valid_mask": valid_mask
            }

        return {
            "passed": True,
            "error_code": None,
            "message": "Image passed optical quality criteria.",
            "corrective_action": None,
            "sharpness_score": round(sharpness_var, 2),
            "is_sharp": is_sharp,
            "valid_pixel_ratio": round(valid_ratio, 4),
            "overexposed_ratio": round(over_ratio, 4),
            "underexposed_ratio": round(under_ratio, 4),
            "valid_mask": valid_mask
        }
