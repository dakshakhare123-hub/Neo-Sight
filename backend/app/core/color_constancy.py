"""
Color Constancy Engine
Implements reference-free illumination correction algorithms:
1. Gray-World (Buchsbaum, 1980)
2. White-Patch Retinex (Land & McCann, 1971)
3. Shades-of-Gray (Finlayson & Trezzi, 2004, Minkowski p=6)
4. Gray-Edge (van de Weijer et al., 2007)

Strict Policy:
Never reverses the color temperature or distorts chromaticity through improper pixel exclusion.
Estimates the ambient illuminant vector using unclipped scene pixels and normalizes channels.
"""

import cv2
import numpy as np
from typing import Tuple, Dict, Any

class ColorConstancy:
    @staticmethod
    def _get_estimation_pixels(bgr_image: np.ndarray, mask: np.ndarray = None) -> np.ndarray:
        """Extracts unclipped pixels suitable for illuminant estimation."""
        img_float = bgr_image.astype(np.float64)
        if mask is not None and np.sum(mask > 0) > 100:
            return img_float[mask > 0]
        
        # Exclude extreme sensor saturation (>252 on all channels) or dead dark pixels (<5)
        valid = (img_float.max(axis=-1) < 252) & (img_float.mean(axis=-1) > 8)
        if np.sum(valid) > 200:
            return img_float[valid]
        return img_float.reshape(-1, 3)

    @classmethod
    def gray_world(cls, bgr_image: np.ndarray, mask: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Gray-World Algorithm:
        Assumes average surface reflectance in a natural scene is achromatic gray.
        """
        pixels = cls._get_estimation_pixels(bgr_image, mask)
        avg_b = float(np.mean(pixels[:, 0]))
        avg_g = float(np.mean(pixels[:, 1]))
        avg_r = float(np.mean(pixels[:, 2]))
        
        illuminant = np.array([avg_b, avg_g, avg_r], dtype=np.float64)
        avg_gray = float(np.mean(illuminant))
        
        scale_b = avg_gray / max(avg_b, 1e-4)
        scale_g = avg_gray / max(avg_g, 1e-4)
        scale_r = avg_gray / max(avg_r, 1e-4)
        
        img_float = bgr_image.astype(np.float64)
        corrected = np.empty_like(img_float)
        corrected[:, :, 0] = np.clip(img_float[:, :, 0] * scale_b, 0, 255)
        corrected[:, :, 1] = np.clip(img_float[:, :, 1] * scale_g, 0, 255)
        corrected[:, :, 2] = np.clip(img_float[:, :, 2] * scale_r, 0, 255)
        
        return corrected.astype(np.uint8), illuminant

    @classmethod
    def white_patch(cls, bgr_image: np.ndarray, percentile: float = 98.0, mask: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        White-Patch Retinex:
        Estimates illuminant from the maximum reflectance percentile.
        """
        pixels = cls._get_estimation_pixels(bgr_image, mask)
        max_b = float(np.percentile(pixels[:, 0], percentile))
        max_g = float(np.percentile(pixels[:, 1], percentile))
        max_r = float(np.percentile(pixels[:, 2], percentile))
        
        illuminant = np.array([max_b, max_g, max_r], dtype=np.float64)
        target = float(np.mean(illuminant))
        
        scale_b = target / max(max_b, 1e-4)
        scale_g = target / max(max_g, 1e-4)
        scale_r = target / max(max_r, 1e-4)
        
        img_float = bgr_image.astype(np.float64)
        corrected = np.empty_like(img_float)
        corrected[:, :, 0] = np.clip(img_float[:, :, 0] * scale_b, 0, 255)
        corrected[:, :, 1] = np.clip(img_float[:, :, 1] * scale_g, 0, 255)
        corrected[:, :, 2] = np.clip(img_float[:, :, 2] * scale_r, 0, 255)
        
        return corrected.astype(np.uint8), illuminant

    @classmethod
    def shades_of_gray(cls, bgr_image: np.ndarray, p: float = 6.0, mask: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Shades-of-Gray Algorithm (Minkowski p=6):
        Generalizes Gray-World and White-Patch with empirical p=6 optimal for human skin.
        """
        pixels = cls._get_estimation_pixels(bgr_image, mask)
        
        e_b = float((np.mean(pixels[:, 0] ** p)) ** (1.0 / p))
        e_g = float((np.mean(pixels[:, 1] ** p)) ** (1.0 / p))
        e_r = float((np.mean(pixels[:, 2] ** p)) ** (1.0 / p))
        
        illuminant = np.array([e_b, e_g, e_r], dtype=np.float64)
        norm_target = float(np.mean(illuminant))
        
        scale_b = norm_target / max(e_b, 1e-4)
        scale_g = norm_target / max(e_g, 1e-4)
        scale_r = norm_target / max(e_r, 1e-4)
        
        img_float = bgr_image.astype(np.float64)
        corrected = np.empty_like(img_float)
        corrected[:, :, 0] = np.clip(img_float[:, :, 0] * scale_b, 0, 255)
        corrected[:, :, 1] = np.clip(img_float[:, :, 1] * scale_g, 0, 255)
        corrected[:, :, 2] = np.clip(img_float[:, :, 2] * scale_r, 0, 255)
        
        return corrected.astype(np.uint8), illuminant

    @classmethod
    def gray_edge(cls, bgr_image: np.ndarray, p: float = 1.0, sigma: float = 1.5, mask: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Gray-Edge Algorithm:
        Estimates illuminant from the average spatial derivatives.
        """
        img_float = bgr_image.astype(np.float64)
        ksize = int(2 * round(3 * sigma) + 1)
        blurred = cv2.GaussianBlur(img_float, (ksize, ksize), sigma)
        
        grad_b = np.abs(cv2.Sobel(blurred[:, :, 0], cv2.CV_64F, 1, 0)) + np.abs(cv2.Sobel(blurred[:, :, 0], cv2.CV_64F, 0, 1))
        grad_g = np.abs(cv2.Sobel(blurred[:, :, 1], cv2.CV_64F, 1, 0)) + np.abs(cv2.Sobel(blurred[:, :, 1], cv2.CV_64F, 0, 1))
        grad_r = np.abs(cv2.Sobel(blurred[:, :, 2], cv2.CV_64F, 1, 0)) + np.abs(cv2.Sobel(blurred[:, :, 2], cv2.CV_64F, 0, 1))
        
        if mask is not None and np.sum(mask > 0) > 100:
            m = mask > 0
            e_b = float((np.mean(grad_b[m] ** p)) ** (1.0 / p))
            e_g = float((np.mean(grad_g[m] ** p)) ** (1.0 / p))
            e_r = float((np.mean(grad_r[m] ** p)) ** (1.0 / p))
        else:
            e_b = float((np.mean(grad_b ** p)) ** (1.0 / p))
            e_g = float((np.mean(grad_g ** p)) ** (1.0 / p))
            e_r = float((np.mean(grad_r ** p)) ** (1.0 / p))
            
        illuminant = np.array([max(e_b, 1e-4), max(e_g, 1e-4), max(e_r, 1e-4)], dtype=np.float64)
        norm_target = float(np.mean(illuminant))
        
        scale_b = norm_target / illuminant[0]
        scale_g = norm_target / illuminant[1]
        scale_r = norm_target / illuminant[2]
        
        corrected = np.empty_like(img_float)
        corrected[:, :, 0] = np.clip(img_float[:, :, 0] * scale_b, 0, 255)
        corrected[:, :, 1] = np.clip(img_float[:, :, 1] * scale_g, 0, 255)
        corrected[:, :, 2] = np.clip(img_float[:, :, 2] * scale_r, 0, 255)
        
        return corrected.astype(np.uint8), illuminant

    @classmethod
    def correct(cls, bgr_image: np.ndarray, method: str = "shades_of_gray", mask: np.ndarray = None) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Master dispatcher for reference-free color constancy."""
        method_clean = method.lower().replace("-", "_").replace(" ", "_")
        
        if method_clean == "gray_world":
            corrected, illuminant = cls.gray_world(bgr_image, mask)
        elif method_clean == "white_patch":
            corrected, illuminant = cls.white_patch(bgr_image, mask=mask)
        elif method_clean == "gray_edge":
            corrected, illuminant = cls.gray_edge(bgr_image, mask=mask)
        elif method_clean == "none" or method_clean == "raw":
            return bgr_image.copy(), {"method": "none", "illuminant_bgr": [128.0, 128.0, 128.0], "illuminant_rgb": [128.0, 128.0, 128.0]}
        else:
            corrected, illuminant = cls.shades_of_gray(bgr_image, p=6.0, mask=mask)
            method_clean = "shades_of_gray"
            
        return corrected, {
            "method": method_clean,
            "illuminant_bgr": [round(float(c), 1) for c in illuminant],
            "illuminant_rgb": [round(float(illuminant[2]), 1), round(float(illuminant[1]), 1), round(float(illuminant[0]), 1)]
        }
