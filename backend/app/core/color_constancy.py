"""
Color Constancy Engine
Implements reference-free illumination correction algorithms:
1. Gray-World (Buchsbaum, 1980)
2. White-Patch Retinex (Land & McCann, 1971)
3. Shades-of-Gray (Finlayson & Trezzi, 2004)
4. Gray-Edge (van de Weijer et al., 2007)

Design Rationale:
In the von Kries diagonal model of illuminant adaptation:
I_c^{corr}(x) = (d_c / e_c) * I_c(x)
where e_c is the estimated illuminant in channel c, and d_c is the target canonical
illuminant (typically neutral white [128, 128, 128] or [255, 255, 255]).
Different assumptions yield different estimators:
- Gray-World assumes average scene reflectance is achromatic gray.
- White-Patch assumes the brightest specular reflection represents the illuminant.
- Shades-of-Gray generalizes both using the Minkowski p-norm (p=6 balances diffuse and specular cues).
- Gray-Edge computes spatial derivatives, assuming reflectance variations are independent of illumination.
"""

import cv2
import numpy as np
from typing import Tuple, Dict, Any

class ColorConstancy:
    @staticmethod
    def gray_world(bgr_image: np.ndarray, mask: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Gray-World Algorithm:
        Assumes average surface reflectance in a natural scene is achromatic gray.
        Illuminant e_c = (1/N) * sum(I_c(x, y))
        Scaling k_c = mean(e) / e_c
        """
        img_float = bgr_image.astype(np.float64)
        if mask is not None and np.sum(mask > 0) > 100:
            pixels = img_float[mask > 0]
        else:
            # Exclude extreme clipped pixels
            valid = (img_float.min(axis=-1) > 15) & (img_float.max(axis=-1) < 242)
            pixels = img_float[valid] if np.sum(valid) > 100 else img_float.reshape(-1, 3)

        # Average per channel in BGR
        avg_b = np.mean(pixels[:, 0])
        avg_g = np.mean(pixels[:, 1])
        avg_r = np.mean(pixels[:, 2])
        
        illuminant = np.array([avg_b, avg_g, avg_r], dtype=np.float64)
        avg_gray = np.mean(illuminant)
        
        scale_b = avg_gray / max(avg_b, 1e-4)
        scale_g = avg_gray / max(avg_g, 1e-4)
        scale_r = avg_gray / max(avg_r, 1e-4)
        
        corrected = np.empty_like(img_float)
        corrected[:, :, 0] = img_float[:, :, 0] * scale_b
        corrected[:, :, 1] = img_float[:, :, 1] * scale_g
        corrected[:, :, 2] = img_float[:, :, 2] * scale_r
        
        corrected = np.clip(corrected, 0, 255).astype(np.uint8)
        return corrected, illuminant

    @staticmethod
    def white_patch(bgr_image: np.ndarray, percentile: float = 99.0, mask: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        White-Patch Retinex:
        Assumes maximum reflectance corresponds to a specular highlight or white patch.
        Uses 99th percentile rather than absolute max to avoid single-pixel noise or dead pixels.
        Scaling k_c = 255.0 / e_c
        """
        img_float = bgr_image.astype(np.float64)
        if mask is not None and np.sum(mask > 0) > 100:
            pixels = img_float[mask > 0]
        else:
            pixels = img_float.reshape(-1, 3)
            
        max_b = np.percentile(pixels[:, 0], percentile)
        max_g = np.percentile(pixels[:, 1], percentile)
        max_r = np.percentile(pixels[:, 2], percentile)
        
        illuminant = np.array([max_b, max_g, max_r], dtype=np.float64)
        target = 255.0
        
        scale_b = target / max(max_b, 1e-4)
        scale_g = target / max(max_g, 1e-4)
        scale_r = target / max(max_r, 1e-4)
        
        corrected = np.empty_like(img_float)
        corrected[:, :, 0] = img_float[:, :, 0] * scale_b
        corrected[:, :, 1] = img_float[:, :, 1] * scale_g
        corrected[:, :, 2] = img_float[:, :, 2] * scale_r
        
        corrected = np.clip(corrected, 0, 255).astype(np.uint8)
        return corrected, illuminant

    @staticmethod
    def shades_of_gray(bgr_image: np.ndarray, p: float = 6.0, mask: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Shades-of-Gray Algorithm (Finlayson & Trezzi, 2004):
        Minkowski p-norm generalization:
        e_c = ( (1/N) * sum(I_c^p) )^(1/p)
        When p=1 -> Gray-World
        When p->inf -> White-Patch
        For natural and clinical skin imagery, p=6 provides the lowest median angular error.
        """
        img_float = bgr_image.astype(np.float64)
        if mask is not None and np.sum(mask > 0) > 100:
            pixels = img_float[mask > 0]
        else:
            valid = (img_float.min(axis=-1) > 15) & (img_float.max(axis=-1) < 242)
            pixels = img_float[valid] if np.sum(valid) > 100 else img_float.reshape(-1, 3)
            
        # Compute p-norm per channel
        e_b = (np.mean(pixels[:, 0] ** p)) ** (1.0 / p)
        e_g = (np.mean(pixels[:, 1] ** p)) ** (1.0 / p)
        e_r = (np.mean(pixels[:, 2] ** p)) ** (1.0 / p)
        
        illuminant = np.array([e_b, e_g, e_r], dtype=np.float64)
        # Use target luminance average
        norm_target = np.mean(illuminant)
        
        scale_b = norm_target / max(e_b, 1e-4)
        scale_g = norm_target / max(e_g, 1e-4)
        scale_r = norm_target / max(e_r, 1e-4)
        
        corrected = np.empty_like(img_float)
        corrected[:, :, 0] = img_float[:, :, 0] * scale_b
        corrected[:, :, 1] = img_float[:, :, 1] * scale_g
        corrected[:, :, 2] = img_float[:, :, 2] * scale_r
        
        corrected = np.clip(corrected, 0, 255).astype(np.uint8)
        return corrected, illuminant

    @staticmethod
    def gray_edge(bgr_image: np.ndarray, p: float = 1.0, sigma: float = 1.5, mask: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Gray-Edge Algorithm (van de Weijer et al., 2007):
        Assumes the average spatial derivative of reflectance in a scene is achromatic:
        e_c = ( sum( |nabla (G_sigma * I_c)|^p ) )^(1/p)
        Smooths image with Gaussian filter G_sigma, computes Sobel gradients in X and Y,
        and aggregates gradient magnitudes.
        """
        img_float = bgr_image.astype(np.float64)
        
        # Apply Gaussian smoothing to attenuate high-frequency sensor noise
        ksize = int(2 * round(3 * sigma) + 1)
        smoothed = cv2.GaussianBlur(img_float, (ksize, ksize), sigma)
        
        # Compute gradients along x and y for each channel
        grad_norms = []
        for c in range(3):
            gx = cv2.Sobel(smoothed[:, :, c], cv2.CV_64F, 1, 0, ksize=3)
            gy = cv2.Sobel(smoothed[:, :, c], cv2.CV_64F, 0, 1, ksize=3)
            magnitude = np.sqrt(gx**2 + gy**2)
            grad_norms.append(magnitude)
            
        grad_stack = np.stack(grad_norms, axis=-1)  # H x W x 3
        
        if mask is not None and np.sum(mask > 0) > 100:
            grad_pixels = grad_stack[mask > 0]
        else:
            grad_pixels = grad_stack.reshape(-1, 3)
            
        if p == 1.0:
            e_b = np.mean(grad_pixels[:, 0])
            e_g = np.mean(grad_pixels[:, 1])
            e_r = np.mean(grad_pixels[:, 2])
        else:
            e_b = (np.mean(grad_pixels[:, 0] ** p)) ** (1.0 / p)
            e_g = (np.mean(grad_pixels[:, 1] ** p)) ** (1.0 / p)
            e_r = (np.mean(grad_pixels[:, 2] ** p)) ** (1.0 / p)
            
        illuminant = np.array([e_b, e_g, e_r], dtype=np.float64)
        norm_target = np.mean(illuminant)
        
        scale_b = norm_target / max(e_b, 1e-4)
        scale_g = norm_target / max(e_g, 1e-4)
        scale_r = norm_target / max(e_r, 1e-4)
        
        corrected = np.empty_like(img_float)
        corrected[:, :, 0] = img_float[:, :, 0] * scale_b
        corrected[:, :, 1] = img_float[:, :, 1] * scale_g
        corrected[:, :, 2] = img_float[:, :, 2] * scale_r
        
        corrected = np.clip(corrected, 0, 255).astype(np.uint8)
        return corrected, illuminant

    @classmethod
    def correct(cls, bgr_image: np.ndarray, method: str = "shades_of_gray", mask: np.ndarray = None) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Master dispatcher for reference-free color constancy methods.
        """
        method_clean = method.lower().replace("-", "_").replace(" ", "_")
        
        if method_clean == "gray_world":
            corrected, illuminant = cls.gray_world(bgr_image, mask)
        elif method_clean == "white_patch":
            corrected, illuminant = cls.white_patch(bgr_image, mask=mask)
        elif method_clean == "gray_edge":
            corrected, illuminant = cls.gray_edge(bgr_image, mask=mask)
        elif method_clean == "shades_of_gray":
            corrected, illuminant = cls.shades_of_gray(bgr_image, p=6.0, mask=mask)
        elif method_clean == "none" or method_clean == "raw":
            return bgr_image.copy(), {"method": "none", "illuminant_bgr": [128.0, 128.0, 128.0]}
        else:
            # Fallback to shades_of_gray
            corrected, illuminant = cls.shades_of_gray(bgr_image, p=6.0, mask=mask)
            method_clean = "shades_of_gray"
            
        return corrected, {
            "method": method_clean,
            "illuminant_bgr": [round(float(c), 1) for c in illuminant],
            "illuminant_rgb": [round(float(illuminant[2]), 1), round(float(illuminant[1]), 1), round(float(illuminant[0]), 1)]
        }
