"""
Image Utilities & Diagnostic Visualization
Handles Base64 / byte encoding/decoding, ROI overlay drawing,
and generating visual heatmap overlays for UI presentation.
"""

import cv2
import base64
import numpy as np
from typing import Dict, Any, Tuple

class ImageIO:
    @staticmethod
    def decode_base64_or_bytes(image_data: str) -> np.ndarray:
        """Decodes base64 string (with or without data URI prefix) into BGR numpy array."""
        if "," in image_data:
            image_data = image_data.split(",")[1]
            
        byte_data = base64.b64decode(image_data)
        np_arr = np.frombuffer(byte_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image from provided payload.")
        return img

    @staticmethod
    def encode_bgr_to_base64(bgr_image: np.ndarray, format: str = "jpeg", quality: int = 85) -> str:
        """Encodes BGR numpy image to base64 data URI."""
        if format.lower() == "png":
            success, encoded = cv2.imencode(".png", bgr_image)
            mime = "image/png"
        else:
            success, encoded = cv2.imencode(".jpg", bgr_image, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
            mime = "image/jpeg"
            
        if not success:
            raise RuntimeError("Failed to encode image to buffer.")
            
        b64_str = base64.b64encode(encoded).decode("utf-8")
        return f"data:{mime};base64,{b64_str}"

    @staticmethod
    def create_diagnostic_overlay(raw_bgr: np.ndarray, 
                                  corrected_bgr: np.ndarray, 
                                  rois: Dict[str, Any],
                                  card_meta: Dict[str, Any] = None) -> np.ndarray:
        """
        Draws visual annotations:
        - Forehead ROI in Cyan
        - Nose Tip ROI in Green
        - Sclera ROI in Magenta
        - Sternum/Chest ROI in Orange
        - ArUco card & patch sample points in Yellow
        """
        overlay = corrected_bgr.copy()
        
        # Colors (BGR)
        colors = {
            "forehead": (255, 200, 0),   # Cyan/light blue
            "nose": (0, 230, 100),       # Vibrant Green
            "sclera": (255, 0, 220),     # Magenta
            "chest": (0, 140, 255)       # Amber/Orange
        }

        # Draw ROIs
        for name, roi_info in rois.items():
            if roi_info is None:
                continue
            color = colors.get(name, (200, 200, 200))
            
            # Mask contour outline
            mask = roi_info.get("mask")
            if mask is not None and np.sum(mask > 0) > 0:
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                cv2.drawContours(overlay, contours, -1, color, 2)
                
            # Bbox label
            bbox = roi_info.get("bbox")
            if bbox is not None:
                x, y, w, h = bbox
                label = f"{name.capitalize()} (w={roi_info.get('weight', 0.2):.2f})"
                # Semi-transparent background tag
                cv2.rectangle(overlay, (x, max(0, y - 22)), (x + len(label) * 8 + 10, y), (20, 20, 20), -1)
                cv2.putText(overlay, label, (x + 4, max(14, y - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.42, color, 1, cv2.LINE_AA)

        # Draw ArUco card if detected
        if card_meta and card_meta.get("card_detected"):
            corners = card_meta.get("marker_corners")
            if corners:
                pts = np.array(corners, dtype=np.int32).reshape((-1, 1, 2))
                cv2.polylines(overlay, [pts], True, (0, 255, 255), 2)
                cv2.putText(overlay, f"ArUco Card #{card_meta.get('marker_id', 0)}", 
                            (int(corners[0][0]), int(corners[0][1] - 8)), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1, cv2.LINE_AA)
                            
            # Draw patch sample centers
            for p in card_meta.get("patches", []):
                coord = p.get("coord")
                if coord:
                    cx, cy = coord
                    cv2.circle(overlay, (cx, cy), 5, (0, 255, 255), -1)
                    cv2.circle(overlay, (cx, cy), 7, (0, 0, 0), 1)

        return overlay

    @staticmethod
    def generate_yellowness_heatmap(bgr_image: np.ndarray, skin_mask: np.ndarray = None) -> np.ndarray:
        """
        Generates a false-color thermal heatmap of the CIE b* yellowness distribution
        strictly bounded inside the dermal skin region.
        """
        # Convert to LAB
        lab = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2Lab)
        b_channel = lab[:, :, 2].astype(np.float32) - 128.0 # Standard b*
        
        # Clip b* to realistic infant dermal bounds [5.0, 35.0]
        norm_b = np.clip((b_channel - 8.0) / 24.0, 0.0, 1.0)
        heatmap_gray = (norm_b * 255).astype(np.uint8)
        
        # Apply JET / INFERNO colormap
        heatmap_color = cv2.applyColorMap(heatmap_gray, cv2.COLORMAP_JET)
        
        # Blend onto original image only where skin is present
        alpha = 0.55
        blended = cv2.addWeighted(heatmap_color, alpha, bgr_image, 1.0 - alpha, 0)
        
        if skin_mask is not None:
            result = np.where(skin_mask[:, :, None] > 0, blended, bgr_image)
        else:
            result = blended
            
        return result
