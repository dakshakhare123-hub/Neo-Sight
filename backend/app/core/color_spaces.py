"""
Color Space Transformations & Bilirubin Biomarkers
Extracts illumination-invariant representations and clinical yellowness indices:
1. CIE L*a*b* (b* yellow-blue channel)
2. YCbCr (Cb chrominance blue, Cr/Cb ratio)
3. Bilirubin Index BIx = (R - B) / (R + B)
4. Invariant Log-Chromaticity u = ln(R/G), v = ln(B/G)

Design Rationale:
Direct RGB values are highly sensitive to overall illumination intensity and sensor gain.
By transforming into opponent color spaces (LAB) and chromaticity ratio spaces,
luminance (L*) is explicitly decoupled from chromaticity (b*), isolating the specific
spectral absorption signature of cutaneous bilirubin (~460 nm blue absorption peak).
"""

import cv2
import numpy as np
from typing import Dict, Any

class ColorSpaceTransformer:
    @staticmethod
    def extract_metrics(bgr_pixels: np.ndarray) -> Dict[str, float]:
        """
        Computes statistical color features across multiple color spaces
        for a collection of Nx3 BGR pixels.
        """
        if bgr_pixels.size == 0 or len(bgr_pixels) == 0:
            return {
                "lab_L_mean": 0.0, "lab_a_mean": 0.0, "lab_b_mean": 0.0, "lab_b_std": 0.0,
                "ycbcr_Y_mean": 0.0, "ycbcr_Cb_mean": 0.0, "ycbcr_Cr_mean": 0.0,
                "cr_cb_ratio": 1.0,
                "bilirubin_index": 0.0,
                "yellow_blue_diff": 0.0,
                "log_u_mean": 0.0, "log_v_mean": 0.0
            }
            
        # Ensure float representation
        bgr_float = bgr_pixels.astype(np.float64)
        b, g, r = bgr_float[:, 0], bgr_float[:, 1], bgr_float[:, 2]
        
        # 1. CIE L*a*b*
        # OpenCV cvtColor on (1, N, 3) uint8 gives L in [0, 255], a, b in [0, 255]
        # Standard LAB scales: L in [0, 100], a in [-128, 127], b in [-128, 127]
        pixels_uint8 = np.clip(bgr_pixels, 0, 255).astype(np.uint8).reshape(1, -1, 3)
        lab = cv2.cvtColor(pixels_uint8, cv2.COLOR_BGR2Lab).reshape(-1, 3).astype(np.float64)
        
        # Convert OpenCV LAB scale to standard scientific LAB scale
        # In OpenCV: L = L * 255 / 100; a = a + 128; b = b + 128
        lab_L = lab[:, 0] * (100.0 / 255.0)
        lab_a = lab[:, 1] - 128.0
        lab_b = lab[:, 2] - 128.0
        
        # 2. YCbCr
        ycbcr = cv2.cvtColor(pixels_uint8, cv2.COLOR_BGR2YCrCb).reshape(-1, 3).astype(np.float64)
        Y_val = ycbcr[:, 0]
        Cr_val = ycbcr[:, 1]
        Cb_val = ycbcr[:, 2]
        
        cr_mean = float(np.mean(Cr_val))
        cb_mean = float(np.mean(Cb_val))
        cr_cb_ratio = float(cr_mean / max(cb_mean, 1e-4))
        
        # 3. Bilirubin Index BIx = (R - B) / (R + B)
        denom = r + b
        denom[denom < 1e-4] = 1e-4
        bix_array = (r - b) / denom
        bix_mean = float(np.mean(bix_array))
        
        # Normalized yellow-blue difference: (R - B) / G
        g_safe = np.clip(g, 1e-4, 255.0)
        yb_diff = float(np.mean((r - b) / g_safe))
        
        # 4. Invariant Log-Chromaticity Coordinates: u = ln(R/G), v = ln(B/G)
        u_array = np.log(np.clip(r, 1e-4, 255.0) / g_safe)
        v_array = np.log(np.clip(b, 1e-4, 255.0) / g_safe)
        
        return {
            "lab_L_mean": round(float(np.mean(lab_L)), 2),
            "lab_a_mean": round(float(np.mean(lab_a)), 2),
            "lab_b_mean": round(float(np.mean(lab_b)), 2),
            "lab_b_std": round(float(np.std(lab_b)), 2),
            "lab_b_median": round(float(np.median(lab_b)), 2),
            "ycbcr_Y_mean": round(float(np.mean(Y_val)), 2),
            "ycbcr_Cb_mean": round(cb_mean, 2),
            "ycbcr_Cr_mean": round(cr_mean, 2),
            "cr_cb_ratio": round(cr_cb_ratio, 3),
            "bilirubin_index": round(bix_mean, 4),
            "yellow_blue_diff": round(yb_diff, 4),
            "log_u_mean": round(float(np.mean(u_array)), 4),
            "log_v_mean": round(float(np.mean(v_array)), 4)
        }
