"""
Ambient Lighting Condition Detector
Estimates the ambient illuminant vector, calculates Correlated Color
Temperature (CCT) via McCamy's approximation, and categorizes the lighting context.

Design Rationale:
Neonatal skin yellowness is heavily confounded by ambient color temperature.
Under warm tungsten (2700K), Caucasian skin looks heavily jaundiced to human eyes
and naive RGB thresholds; under 7500K overcast light, severe jaundice is masked.
Detecting the scene illuminant and CCT provides transparency to the clinician/parent
and allows adaptive parameter tuning across the color constancy modules.
"""

import cv2
import numpy as np
from typing import Dict, Any
from ..config import LightingClassification

class LightingDetector:
    def __init__(self):
        pass

    @staticmethod
    def rgb_to_cct(r: float, g: float, b: float) -> float:
        """
        Estimates Correlated Color Temperature (CCT) in Kelvin from RGB using
        standard sRGB -> CIE 1931 XYZ transformation and McCamy's cubic polynomial.
        """
        # Normalize to [0, 1]
        r_n, g_n, b_n = max(r, 1e-4) / 255.0, max(g, 1e-4) / 255.0, max(b, 1e-4) / 255.0
        
        # Linearize sRGB gamma
        def srgb_to_linear(c):
            return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
            
        r_lin = srgb_to_linear(r_n)
        g_lin = srgb_to_linear(g_n)
        b_lin = srgb_to_linear(b_n)
        
        # Standard sRGB to CIE 1931 XYZ matrix (D65 white point reference)
        X = 0.4124564 * r_lin + 0.3575761 * g_lin + 0.1804375 * b_lin
        Y = 0.2126729 * r_lin + 0.7151522 * g_lin + 0.0721750 * b_lin
        Z = 0.0193339 * r_lin + 0.1191920 * g_lin + 0.9503041 * b_lin
        
        denom = X + Y + Z
        if denom < 1e-6:
            return 5500.0  # Default fallback daylight
            
        x = X / denom
        y = Y / denom
        
        # McCamy's formula
        # n = (x - x_e) / (y_e - y) where (x_e, y_e) = (0.3320, 0.1858) epicenter
        denom_y = 0.1858 - y
        if abs(denom_y) < 1e-6:
            denom_y = 1e-6
        n = (x - 0.3320) / denom_y
        
        cct = 449.0 * (n ** 3) + 3525.0 * (n ** 2) + 6823.3 * n + 5520.33
        return float(np.clip(cct, 1500.0, 15000.0))

    def detect_lighting(self, bgr_image: np.ndarray, mask: np.ndarray = None) -> Dict[str, Any]:
        """
        Estimates the ambient illuminant using Shades-of-Gray (p=6) illuminant estimation
        and determines CCT and qualitative lighting category.
        """
        # Convert BGR to RGB
        rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB).astype(np.float64)
        
        if mask is not None:
            valid_pixels = rgb[mask > 0]
        else:
            # Exclude extreme clipping by default
            valid_pixels = rgb[(rgb.min(axis=-1) > 15) & (rgb.max(axis=-1) < 242)]
            
        if len(valid_pixels) == 0:
            valid_pixels = rgb.reshape(-1, 3)

        # Shades-of-Gray illuminant vector (Minkowski p=6 norm)
        p = 6.0
        illuminant = (np.mean(valid_pixels ** p, axis=0)) ** (1.0 / p)
        
        # Mean luminance
        mean_lum = float(np.mean(valid_pixels[:, 0] * 0.299 + valid_pixels[:, 1] * 0.587 + valid_pixels[:, 2] * 0.114))
        
        # Normalize illuminant vector to sum to 3 (neutral is [1, 1, 1])
        illum_sum = np.sum(illuminant)
        if illum_sum > 0:
            norm_illum = (illuminant / illum_sum) * 3.0
        else:
            norm_illum = np.array([1.0, 1.0, 1.0])
            
        # Compute CCT from illuminant RGB
        cct = self.rgb_to_cct(illuminant[0], illuminant[1], illuminant[2])
        
        # Categorize
        if mean_lum < 40.0:
            category = "LOW_LIGHT"
            label = "Low-Light / Underexposed"
            description = "Ambient light is dim. Shadows may impair accurate skin color recovery."
            icon = "moon"
        elif cct < LightingClassification.CCT_WARM_THRESHOLD:
            category = "WARM_INCANDESCENT"
            label = "Warm Tungsten / Incandescent (< 3300K)"
            description = "Heavy yellow/red ambient spectral bias detected. Active color balancing is crucial."
            icon = "flame"
        elif cct <= LightingClassification.CCT_NEUTRAL_UPPER:
            category = "NEUTRAL_INDOOR"
            label = "Neutral / Office White (3300K - 5200K)"
            description = "Balanced indoor lighting with moderate warm bias."
            icon = "sun"
        elif cct <= LightingClassification.CCT_DAYLIGHT_UPPER:
            category = "BALANCED_DAYLIGHT"
            label = "Balanced Daylight (5200K - 6800K)"
            description = "Optimal color rendering index near standard D65 illuminant."
            icon = "sun-medium"
        else:
            category = "COOL_OVERCAST"
            label = "Cool / Overcast (> 6800K)"
            description = "High blue spectrum tint. Color correction will prevent false negative masking."
            icon = "cloud"

        return {
            "category": category,
            "label": label,
            "description": description,
            "cct_kelvin": round(cct),
            "illuminant_rgb": [round(float(c), 1) for c in illuminant],
            "norm_illuminant": [round(float(c), 3) for c in norm_illum],
            "mean_luminance": round(mean_lum, 1),
            "icon": icon
        }
