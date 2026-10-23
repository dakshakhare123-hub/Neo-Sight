"""
Sclera-Based White Balancing Engine
Uses the neonate's sclera (eye whites) as an in-scene physiological reference.

Design Rationale:
In resource-constrained settings where a physical calibration card is unavailable,
the infant's sclera provides a natural in-situ optical reference.
Human scleral tissue is predominantly composed of avascular collagen bundles with
spectrally flat high reflectance across visible wavelengths. While severe hyperbilirubinemia
eventually causes scleral icterus (yellowing of eye whites), in the mild-to-moderate range
or for overall illumination color temperature estimation, the sclera's chromaticity
tracks the ambient illuminant far more reliably than melanin-pigmented skin.
"""

import cv2
import numpy as np
from typing import Tuple, Dict, Any, Optional

class ScleraBalancer:
    def __init__(self, target_white: Tuple[float, float, float] = (235.0, 235.0, 235.0)):
        # Target canonical white point for sclera under balanced D65 illuminant
        self.target_white = np.array(target_white, dtype=np.float64)

    def extract_sclera_illuminant(self, bgr_image: np.ndarray, eye_masks: list) -> Optional[np.ndarray]:
        """
        Given the detected eye ROI masks, segments the white scleral pixels
        (excluding dark pupil, iris, and eyelid shadows) and calculates median chromaticity.
        """
        if not eye_masks:
            return None
            
        sclera_pixels = []
        for mask in eye_masks:
            if mask is None or np.sum(mask > 0) < 20:
                continue
                
            eye_pixels = bgr_image[mask > 0]
            # Convert to HSV to separate saturation & brightness
            hsv = cv2.cvtColor(eye_pixels.reshape(-1, 1, 3), cv2.COLOR_BGR2HSV).reshape(-1, 3)
            
            # Sclera is characterized by high Value (brightness) and low Saturation
            # Pupil/Iris has either low Value (dark pupil) or high Saturation (brown/blue/green iris)
            is_sclera = (hsv[:, 2] > 70) & (hsv[:, 1] < 110)
            
            if np.sum(is_sclera) >= 15:
                sclera_pixels.append(eye_pixels[is_sclera])
                
        if not sclera_pixels:
            return None
            
        all_sclera = np.vstack(sclera_pixels).astype(np.float64)
        # Use median to resist eyelash specular highlights and iris border bleeding
        median_bgr = np.median(all_sclera, axis=0)
        return median_bgr

    def balance_image(self, bgr_image: np.ndarray, sclera_bgr: np.ndarray) -> np.ndarray:
        """
        Applies von Kries diagonal scaling based on the detected scleral illuminant:
        I_corr(c) = min(255, I(c) * (target_c / sclera_c))
        """
        img_float = bgr_image.astype(np.float64)
        
        # Sclera target in BGR
        scale_b = self.target_white[2] / max(sclera_bgr[0], 1e-4)
        scale_g = self.target_white[1] / max(sclera_bgr[1], 1e-4)
        scale_r = self.target_white[0] / max(sclera_bgr[2], 1e-4)
        
        # Limit extreme scaling factors to avoid color explosions in dark images
        scale_b = np.clip(scale_b, 0.4, 2.5)
        scale_g = np.clip(scale_g, 0.4, 2.5)
        scale_r = np.clip(scale_r, 0.4, 2.5)
        
        corrected = np.empty_like(img_float)
        corrected[:, :, 0] = img_float[:, :, 0] * scale_b
        corrected[:, :, 1] = img_float[:, :, 1] * scale_g
        corrected[:, :, 2] = img_float[:, :, 2] * scale_r
        
        return np.clip(corrected, 0, 255).astype(np.uint8)

    def calibrate(self, bgr_image: np.ndarray, eye_masks: list) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Calibrates the image using in-scene scleral white balance.
        """
        sclera_bgr = self.extract_sclera_illuminant(bgr_image, eye_masks)
        
        if sclera_bgr is None:
            return bgr_image.copy(), {
                "sclera_detected": False,
                "message": "Sclera region not sufficiently visible (eyes closed or occluded). Falling back to Shades-of-Gray."
            }
            
        corrected = self.balance_image(bgr_image, sclera_bgr)
        sclera_rgb = [round(float(sclera_bgr[2]), 1), round(float(sclera_bgr[1]), 1), round(float(sclera_bgr[0]), 1)]
        
        return corrected, {
            "sclera_detected": True,
            "sclera_rgb_observed": sclera_rgb,
            "target_white_rgb": [int(c) for c in self.target_white],
            "message": f"Sclera white-balancing applied (Observed sclera: RGB{sclera_rgb})."
        }
