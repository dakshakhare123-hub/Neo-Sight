"""
NeoScan Unified Medical Image Preprocessing Engine (Phase 3)
============================================================
Shared by both offline training pipelines and the runtime web API.
Guarantees 100% algorithmic symmetry between training and inference:
1. Decode & Validate Image Payload.
2. Quality Gating (Laplacian Sharpness, Sensor Glare/Clipping, Dimensions).
3. Illumination Normalization (Shades-of-Gray Minkowski p=6 / ArUco CCM).
4. Dual-Space Dermal ROI Segmentation (YCbCr + HSV).
5. Feature Extraction (CIELAB, YCrCb, Bilirubin Index BIx, Quantiles).
6. ROI Dermal Crop Generation (Normalized 224x224 RGB tensor for CNN).
"""

import sys
import os
import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional, List

# Ensure parent directory is in path for importing backend.app.core
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.app.core.quality_gate import QualityGate
from backend.app.core.skin_segmentation import SkinSegmenter
from backend.app.core.color_constancy import ColorConstancy
from backend.app.core.face_roi import FaceROIExtractor


FEATURE_NAMES = [
    "lab_l_mean", "lab_l_std", "lab_l_p10", "lab_l_p90",
    "lab_a_mean", "lab_a_std", "lab_a_p10", "lab_a_p90",
    "lab_b_mean", "lab_b_std", "lab_b_p10", "lab_b_p90",
    "ycbcr_y_mean", "ycbcr_cr_mean", "ycbcr_cb_mean", "ycbcr_cr_cb_ratio",
    "bilirubin_index_bix", "yellow_blue_diff", "total_dermal_pixels", "skin_purity"
]


class UnifiedPreprocessor:
    def __init__(self,
                 min_sharpness: float = 35.0,
                 max_overexposed_ratio: float = 0.25,
                 max_underexposed_ratio: float = 0.35,
                 min_dimension: int = 240,
                 crop_size: Tuple[int, int] = (224, 224)):
        self.quality_gate = QualityGate(
            min_sharpness=min_sharpness,
            max_overexposed_ratio=max_overexposed_ratio,
            max_underexposed_ratio=max_underexposed_ratio,
            min_dimension=min_dimension
        )
        self.skin_segmenter = SkinSegmenter()
        self.face_extractor = FaceROIExtractor()
        self.crop_size = crop_size

    def decode_image(self, image_input: Any) -> Optional[np.ndarray]:
        """Loads and decodes image from filepath, byte buffer, or ndarray."""
        if isinstance(image_input, np.ndarray):
            return image_input.copy()
        if isinstance(image_input, str):
            if not os.path.exists(image_input):
                return None
            data = np.fromfile(image_input, dtype=np.uint8)
            return cv2.imdecode(data, cv2.IMREAD_COLOR)
        if isinstance(image_input, (bytes, bytearray)):
            nparr = np.frombuffer(image_input, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return None

    def process(self,
                image_input: Any,
                method: str = "shades_of_gray",
                enforce_quality: bool = True) -> Dict[str, Any]:
        """
        Executes full preprocessing pipeline.
        Returns:
            Dict containing passed (bool), error_code, features (1D np.ndarray),
            crop_224 (np.ndarray), and intermediate representations.
        """
        raw_bgr = self.decode_image(image_input)
        if raw_bgr is None or raw_bgr.size == 0:
            return {
                "passed": False,
                "error_code": "UNSUPPORTED_FORMAT",
                "message": "Image could not be decoded as a valid BGR photograph."
            }

        # 1. Quality Gate Check
        quality_res = self.quality_gate.evaluate_image(raw_bgr)
        if enforce_quality and not quality_res["passed"]:
            return {
                "passed": False,
                "error_code": quality_res["error_code"],
                "message": quality_res["message"],
                "quality_metrics": quality_res
            }

        valid_mask = quality_res.get("valid_mask", np.ones(raw_bgr.shape[:2], dtype=bool))

        # 2. Color Constancy Normalization
        if method in ["shades_of_gray", "gray_world", "white_patch", "gray_edge"]:
            corrected_bgr, calib_meta = ColorConstancy.correct(raw_bgr, method=method, mask=valid_mask)
        else:
            corrected_bgr = raw_bgr.copy()
            calib_meta = {"method": "none", "factor": 1.0}

        # 3. Dermal ROI Segmentation (evaluated on normalized image)
        roi_data = self.face_extractor.extract_rois(corrected_bgr, valid_mask)
        if not roi_data.get("has_skin", False):
            # Fallback to raw if normalized lost dermal tone
            roi_data = self.face_extractor.extract_rois(raw_bgr, valid_mask)

        full_skin_mask = self.skin_segmenter.compute_skin_mask(corrected_bgr, valid_mask)
        skin_pixel_count = int(np.sum(full_skin_mask > 0))

        if skin_pixel_count < 100:
            return {
                "passed": False,
                "error_code": "INSUFFICIENT_SKIN_PIXELS",
                "message": f"Only {skin_pixel_count} valid skin pixels found (minimum 100 required).",
                "quality_metrics": quality_res
            }

        # 4. Extract Skin Pixels in Lab, YCrCb, and RGB
        skin_bgr_pixels = corrected_bgr[full_skin_mask > 0]  # Shape: (N, 3) BGR

        # CIELAB Conversion
        lab_img = cv2.cvtColor(corrected_bgr, cv2.COLOR_BGR2Lab)
        skin_lab_pixels = lab_img[full_skin_mask > 0].astype(np.float32)
        # Convert to standardized CIE L*a*b*
        l_vals = skin_lab_pixels[:, 0] * 100.0 / 255.0
        a_vals = skin_lab_pixels[:, 1] - 128.0
        b_vals = skin_lab_pixels[:, 2] - 128.0

        # YCbCr Conversion
        ycbcr_img = cv2.cvtColor(corrected_bgr, cv2.COLOR_BGR2YCrCb)
        skin_ycbcr_pixels = ycbcr_img[full_skin_mask > 0].astype(np.float32)
        y_vals = skin_ycbcr_pixels[:, 0]
        cr_vals = skin_ycbcr_pixels[:, 1]
        cb_vals = skin_ycbcr_pixels[:, 2]

        # RGB Conversion
        b_channel = skin_bgr_pixels[:, 0].astype(np.float32)
        g_channel = skin_bgr_pixels[:, 1].astype(np.float32)
        r_channel = skin_bgr_pixels[:, 2].astype(np.float32)

        # 5. Compute Feature Vector
        total_pixels = raw_bgr.shape[0] * raw_bgr.shape[1]
        skin_purity = float(skin_pixel_count / max(total_pixels, 1))

        b_mean = float(np.mean(b_channel))
        g_mean = float(np.mean(g_channel))
        r_mean = float(np.mean(r_channel))
        cr_mean = float(np.mean(cr_vals))
        cb_mean = float(np.mean(cb_vals))
        cr_cb_ratio = float(cr_mean / max(cb_mean, 1e-3))

        bix = float((r_mean - b_mean) / max(r_mean + g_mean + b_mean, 1e-4))
        yb_diff = float((0.5 * (r_mean + g_mean) - b_mean) / 255.0)

        feature_values = [
            float(np.mean(l_vals)), float(np.std(l_vals)), float(np.percentile(l_vals, 10)), float(np.percentile(l_vals, 90)),
            float(np.mean(a_vals)), float(np.std(a_vals)), float(np.percentile(a_vals, 10)), float(np.percentile(a_vals, 90)),
            float(np.mean(b_vals)), float(np.std(b_vals)), float(np.percentile(b_vals, 10)), float(np.percentile(b_vals, 90)),
            float(np.mean(y_vals)), cr_mean, cb_mean, cr_cb_ratio,
            bix, yb_diff, float(skin_pixel_count), skin_purity
        ]
        features_np = np.array(feature_values, dtype=np.float32)

        # 6. Extract Standardized Dermal ROI Crop (for CNN)
        # Find bounding box of skin mask
        y_indices, x_indices = np.where(full_skin_mask > 0)
        ymin, ymax = int(np.min(y_indices)), int(np.max(y_indices))
        xmin, xmax = int(np.min(x_indices)), int(np.max(x_indices))

        # Pad to square
        box_w = xmax - xmin
        box_h = ymax - ymin
        max_dim = max(box_w, box_h)
        cx = (xmin + xmax) // 2
        cy = (ymin + ymax) // 2

        pad_x1 = max(0, cx - max_dim // 2)
        pad_x2 = min(corrected_bgr.shape[1], cx + max_dim // 2)
        pad_y1 = max(0, cy - max_dim // 2)
        pad_y2 = min(corrected_bgr.shape[0], cy + max_dim // 2)

        crop = corrected_bgr[pad_y1:pad_y2, pad_x1:pad_x2]
        if crop.size == 0:
            crop = corrected_bgr

        crop_resized = cv2.resize(crop, self.crop_size, interpolation=cv2.INTER_AREA)
        crop_rgb = cv2.cvtColor(crop_resized, cv2.COLOR_BGR2RGB)

        return {
            "passed": True,
            "raw_bgr": raw_bgr,
            "corrected_bgr": corrected_bgr,
            "skin_mask": full_skin_mask,
            "crop_rgb": crop_rgb,
            "features": features_np,
            "feature_names": FEATURE_NAMES,
            "quality_metrics": quality_res,
            "skin_pixel_count": skin_pixel_count,
            "b_star_mean": float(np.mean(b_vals)),
            "bix": bix
        }
