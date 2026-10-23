"""
Skin Segmentation & Artifact Removal Engine
Combines multi-color-space skin chrominance modeling (YCbCr + HSV)
with morphological refinement and specular/shadow rejection to isolate
pure dermal tissue from hair, clothing, eyes, and background.

Design Rationale:
In infant photography, baby lanugo hair, eyebrows, nostrils, clothing neckline,
and bedsheets frequently contaminate landmark bounding boxes.
Simply averaging pixels inside a bounding box contaminates the yellow bilirubin
signal with brown/black hair or white cotton sheets.
Dual-space YCbCr + HSV segmentation creates an explicit dermal confidence mask,
ensuring only genuine cutaneous pixels feed into the feature extractor.
"""

import cv2
import numpy as np
from typing import Tuple

class SkinSegmenter:
    def __init__(self):
        # YCbCr empirical dermal bounds (Kovac et al. & Chai et al.)
        self.cr_min, self.cr_max = 133, 173
        self.cb_min, self.cb_max = 77, 127
        
        # HSV bounds: covers light, medium, and melanated Fitzpatrick types
        self.h_min1, self.h_max1 = 0, 28       # Red-orange-yellow
        self.h_min2, self.h_max2 = 165, 180   # Wrap-around red
        self.s_min, self.s_max = 20, 215
        self.v_min, self.v_max = 45, 250

    def compute_skin_mask(self, bgr_image: np.ndarray, quality_valid_mask: np.ndarray = None) -> np.ndarray:
        """
        Computes a binary skin segmentation mask across the entire image.
        Returns uint8 mask (255 = skin, 0 = non-skin).
        """
        # 1. YCbCr Chrominance Thresholding
        ycbcr = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2YCrCb)
        y, cr, cb = cv2.split(ycbcr)
        
        ycbcr_mask = (cr >= self.cr_min) & (cr <= self.cr_max) & \
                     (cb >= self.cb_min) & (cb <= self.cb_max)
        
        # 2. HSV Hue & Saturation Thresholding
        hsv = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        
        hsv_mask = ((h >= self.h_min1) & (h <= self.h_max1) | (h >= self.h_min2) & (h <= self.h_max2)) & \
                   (s >= self.s_min) & (s <= self.s_max) & \
                   (v >= self.v_min) & (v <= self.v_max)
                   
        # 3. Intersect both spaces for high-precision skin isolation
        skin_binary = (ycbcr_mask & hsv_mask).astype(np.uint8) * 255
        
        # 4. Filter out specular highlights and shadow clippings
        if quality_valid_mask is not None:
            skin_binary = cv2.bitwise_and(skin_binary, (quality_valid_mask.astype(np.uint8) * 255))
            
        # 5. Morphological Opening (removes hair strands) & Closing (fills pore holes)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        skin_binary = cv2.morphologyEx(skin_binary, cv2.MORPH_OPEN, kernel, iterations=1)
        skin_binary = cv2.morphologyEx(skin_binary, cv2.MORPH_CLOSE, kernel, iterations=1)
        
        return skin_binary

    def isolate_roi_skin(self, bgr_image: np.ndarray, roi_mask: np.ndarray, quality_valid_mask: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Intersects a landmark ROI mask with the skin mask.
        Returns:
            isolated_pixels: Nx3 array of valid skin BGR values
            combined_mask: 2D uint8 mask of valid skin within the ROI
            purity: ratio of valid skin pixels to total ROI area
        """
        if roi_mask is None or np.sum(roi_mask > 0) == 0:
            return np.empty((0, 3), dtype=np.uint8), np.zeros(bgr_image.shape[:2], dtype=np.uint8), 0.0
            
        full_skin_mask = self.compute_skin_mask(bgr_image, quality_valid_mask)
        combined_mask = cv2.bitwise_and(roi_mask, full_skin_mask)
        
        roi_total = np.sum(roi_mask > 0)
        skin_count = np.sum(combined_mask > 0)
        purity = float(skin_count / max(roi_total, 1))
        
        # If purity is extremely low (e.g. sclera ROI is NOT skin), allow non-hair pixels through
        if purity < 0.10:
            # For sclera or non-dermal regions, use the raw ROI minus extreme clipping
            if quality_valid_mask is not None:
                combined_mask = cv2.bitwise_and(roi_mask, (quality_valid_mask.astype(np.uint8) * 255))
            else:
                combined_mask = roi_mask
            skin_count = np.sum(combined_mask > 0)
            purity = float(skin_count / max(roi_total, 1))
            
        pixels = bgr_image[combined_mask > 0]
        return pixels, combined_mask, purity
