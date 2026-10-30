"""
Unit tests for accurate CIE b* yellowness calculation and scaling.
Validates OpenCV BGR->Lab float conversion on standard colorimetric patches
against CIE D65 2-degree observer reference values within Delta b* < 0.5 tolerance.
"""

import unittest
import numpy as np
import cv2


def srgb_to_cie_lab_reference(r: int, g: int, b: int) -> tuple[float, float, float]:
    """Standard CIE D65 2-degree observer sRGB to CIELAB reference formula."""
    # Linearize sRGB
    def lin(c: float) -> float:
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    rl, gl, bl = lin(r), lin(g), lin(b)

    # Convert linear RGB to XYZ (sRGB D65 matrix)
    X = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375
    Y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750
    Z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041

    # D65 white point reference (Xn, Yn, Zn)
    Xn, Yn, Zn = 0.95047, 1.00000, 1.08883

    xr, yr, zr = X / Xn, Y / Yn, Z / Zn

    def f(t: float) -> float:
        delta = 6.0 / 29.0
        return t ** (1.0 / 3.0) if t > delta ** 3 else (t / (3.0 * delta ** 2)) + (4.0 / 29.0)

    fx, fy, fz = f(xr), f(yr), f(zr)
    L = 116.0 * fy - 16.0
    a = 500.0 * (fx - fy)
    b_star = 200.0 * (fy - fz)
    return L, a, b_star


def opencv_float_lab(bgr_uint8: np.ndarray) -> np.ndarray:
    """Converts BGR uint8 array to float LAB using OpenCV (as used in neoscan_ml)."""
    f = (bgr_uint8.astype(np.float32) / 255.0)
    lab = cv2.cvtColor(f, cv2.COLOR_BGR2LAB)
    return lab


class TestBStarScale(unittest.TestCase):
    def test_neutral_gray_has_zero_b_star(self):
        # 128, 128, 128 neutral gray
        patch = np.full((10, 10, 3), 128, dtype=np.uint8)
        lab = opencv_float_lab(patch)
        b_star = np.median(lab[:, :, 2])
        self.assertAlmostEqual(b_star, 0.0, places=2)

    def test_pure_white_has_zero_b_star(self):
        patch = np.full((10, 10, 3), 255, dtype=np.uint8)
        lab = opencv_float_lab(patch)
        b_star = np.median(lab[:, :, 2])
        self.assertAlmostEqual(b_star, 0.0, places=2)

    def test_yellow_patch_matches_reference_within_tolerance(self):
        # ColorChecker Yellow patch: R=231, G=199, B=31 (BGR: 31, 199, 231)
        patch = np.zeros((10, 10, 3), dtype=np.uint8)
        patch[:, :] = [31, 199, 231]
        
        _, _, ref_b = srgb_to_cie_lab_reference(231, 199, 31)
        lab = opencv_float_lab(patch)
        cv_b = float(np.median(lab[:, :, 2]))
        
        delta = abs(cv_b - ref_b)
        self.assertLess(delta, 0.5, f"OpenCV b* ({cv_b:.2f}) differs from CIE reference ({ref_b:.2f}) by {delta:.2f} (tol < 0.5)")

    def test_skin_tone_patches_match_reference(self):
        # Moderate jaundiced skin tone: R=240, G=205, B=150 (BGR: 150, 205, 240)
        patch = np.zeros((10, 10, 3), dtype=np.uint8)
        patch[:, :] = [150, 205, 240]
        
        _, _, ref_b = srgb_to_cie_lab_reference(240, 205, 150)
        lab = opencv_float_lab(patch)
        cv_b = float(np.median(lab[:, :, 2]))
        
        delta = abs(cv_b - ref_b)
        self.assertLess(delta, 0.5, f"OpenCV b* ({cv_b:.2f}) differs from reference ({ref_b:.2f}) by {delta:.2f}")

    def test_b_star_scale_classification_bands(self):
        # Validate band categorization logic
        def get_band(b: float) -> str:
            if b < 14.0:
                return "low"
            elif b < 20.0:
                return "moderate"
            return "elevated"

        self.assertEqual(get_band(10.5), "low")
        self.assertEqual(get_band(13.9), "low")
        self.assertEqual(get_band(14.0), "moderate")
        self.assertEqual(get_band(19.9), "moderate")
        self.assertEqual(get_band(20.0), "elevated")
        self.assertEqual(get_band(26.5), "elevated")


if __name__ == "__main__":
    unittest.main()
