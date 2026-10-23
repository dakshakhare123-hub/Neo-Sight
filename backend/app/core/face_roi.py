"""
Face & ROI Detection Engine
Extracts clinically validated Regions of Interest (ROIs) for neonatal jaundice:
1. Forehead (Primary dermal site, high capillary perfusion)
2. Nose Tip (Cartilaginous base, minimal subcutaneous fat variability)
3. Sclera (Left & Right eye whites, physiological white reference & icterus marker)
4. Sternum / Chest (Confirmatory progression site per Kramer's Cephalo-Caudal rule)

Uses MediaPipe Face Mesh with high-precision landmark indices, backed by an
OpenCV anthropometric detector fallback to ensure 100% demo uptime.
"""

import cv2
import numpy as np
from typing import Dict, Any, Optional, Tuple, List

class FaceROIExtractor:
    def __init__(self):
        self._init_mediapipe()
        self._init_opencv_fallback()

    def _init_mediapipe(self):
        """Initializes Google MediaPipe Face Mesh."""
        self.has_mediapipe = False
        try:
            import mediapipe as mp
            # Try mp.solutions.face_mesh
            if hasattr(mp, 'solutions') and hasattr(mp.solutions, 'face_mesh'):
                self.mp_face_mesh = mp.solutions.face_mesh
                self.face_mesh = self.mp_face_mesh.FaceMesh(
                    static_image_mode=True,
                    max_num_faces=1,
                    refine_landmarks=True,
                    min_detection_confidence=0.4
                )
                self.has_mediapipe = True
        except Exception as e:
            print(f"[FaceROIExtractor] MediaPipe init notice: {e}. Using OpenCV DNN/Haar engine.")
            self.has_mediapipe = False

    def _init_opencv_fallback(self):
        """Initializes OpenCV Haar cascades as a resilient fallback."""
        self.face_cascade = None
        self.eye_cascade = None
        try:
            import os
            p_face = getattr(cv2.data, 'haarcascades', '') + 'haarcascade_frontalface_default.xml'
            if os.path.exists(p_face):
                fc = cv2.CascadeClassifier()
                if fc.load(p_face):
                    self.face_cascade = fc
            p_eye = getattr(cv2.data, 'haarcascades', '') + 'haarcascade_eye.xml'
            if os.path.exists(p_eye):
                ec = cv2.CascadeClassifier()
                if ec.load(p_eye):
                    self.eye_cascade = ec
        except Exception:
            self.face_cascade = None
            self.eye_cascade = None

    def extract_rois(self, bgr_image: np.ndarray) -> Dict[str, Any]:
        """
        Detects face landmarks and returns bounding boxes, polygon masks,
        and cropped ROI patches.
        """
        h, w, _ = bgr_image.shape
        
        # Try MediaPipe first
        if self.has_mediapipe:
            try:
                rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
                results = self.face_mesh.process(rgb)
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0].landmark
                    pts = np.array([[int(lm.x * w), int(lm.y * h)] for lm in landmarks])
                    return self._extract_from_mediapipe_landmarks(bgr_image, pts, h, w)
            except Exception as e:
                print(f"[FaceROIExtractor] MediaPipe runtime error: {e}. Falling back to OpenCV.")

        # Fallback to OpenCV
        return self._extract_from_opencv(bgr_image, h, w)

    def _extract_from_mediapipe_landmarks(self, bgr_image: np.ndarray, pts: np.ndarray, h: int, w: int) -> Dict[str, Any]:
        """
        MediaPipe Landmark Indices:
        Forehead: 10, 67, 109, 338, 297, 9
        Nose tip: 1, 2, 4, 19, 94
        Left eye: 33, 133, 159, 145, 153, 154
        Right eye: 362, 263, 386, 374, 380, 381
        Chin / Jaw: 152
        """
        # 1. Forehead Polygon
        # Key landmark 10 is the forehead center; 67/297 are mid-eyebrow
        forehead_indices = [10, 67, 109, 108, 151, 337, 338, 297, 9]
        fh_pts = pts[forehead_indices]
        fh_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillConvexPoly(fh_mask, fh_pts, 255)
        # Dilate slightly to capture dermal patch
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fh_mask = cv2.dilate(fh_mask, kernel, iterations=1)
        fh_bbox = cv2.boundingRect(fh_pts)

        # 2. Nose Tip
        nose_indices = [1, 2, 4, 19, 94, 278, 48]
        nose_pts = pts[nose_indices]
        nose_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillConvexPoly(nose_mask, nose_pts, 255)
        nose_bbox = cv2.boundingRect(nose_pts)

        # 3. Eyes (Sclera)
        left_eye_indices = [33, 133, 159, 145, 153, 154, 155]
        right_eye_indices = [362, 263, 386, 374, 380, 381, 382]
        
        left_eye_pts = pts[left_eye_indices]
        right_eye_pts = pts[right_eye_indices]
        
        left_eye_mask = np.zeros((h, w), dtype=np.uint8)
        right_eye_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillConvexPoly(left_eye_mask, left_eye_pts, 255)
        cv2.fillConvexPoly(right_eye_mask, right_eye_pts, 255)
        
        combined_sclera_mask = cv2.bitwise_or(left_eye_mask, right_eye_mask)

        # 4. Sternum / Chest Projection
        # Anatomically, the sternum is located directly below the chin (landmark 152)
        chin_pt = pts[152]
        face_top = np.min(pts[:, 1])
        face_bottom = np.max(pts[:, 1])
        face_height = face_bottom - face_top
        face_width = np.max(pts[:, 0]) - np.min(pts[:, 0])
        
        chest_y1 = min(h - 5, int(chin_pt[1] + 0.15 * face_height))
        chest_y2 = min(h - 1, int(chin_pt[1] + 0.85 * face_height))
        chest_x1 = max(0, int(chin_pt[0] - 0.35 * face_width))
        chest_x2 = min(w - 1, int(chin_pt[0] + 0.35 * face_width))
        
        chest_mask = np.zeros((h, w), dtype=np.uint8)
        has_chest = (chest_y2 - chest_y1 > 15) and (chest_x2 - chest_x1 > 15)
        if has_chest:
            chest_mask[chest_y1:chest_y2, chest_x1:chest_x2] = 255
            chest_bbox = (chest_x1, chest_y1, chest_x2 - chest_x1, chest_y2 - chest_y1)
        else:
            chest_bbox = None

        return {
            "detection_method": "mediapipe_face_mesh",
            "face_detected": True,
            "rois": {
                "forehead": {"mask": fh_mask, "bbox": fh_bbox, "weight": 0.40},
                "nose": {"mask": nose_mask, "bbox": nose_bbox, "weight": 0.25},
                "sclera": {"mask": combined_sclera_mask, "bbox": cv2.boundingRect(pts[left_eye_indices + right_eye_indices]), "weight": 0.15},
                "chest": {"mask": chest_mask if has_chest else None, "bbox": chest_bbox, "weight": 0.20}
            },
            "eye_masks": [left_eye_mask, right_eye_mask],
            "landmarks_count": len(pts)
        }

    def _extract_from_opencv(self, bgr_image: np.ndarray, h: int, w: int) -> Dict[str, Any]:
        """
        OpenCV Anthropometric Fallback:
        Detects frontal face bounding box and estimates anatomically proportional regions.
        """
        gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60)) if self.face_cascade else []

        if len(faces) == 0:
            # If no frontal face detected, assume center frame baby portrait
            fx, fy, fw, fh = int(w * 0.25), int(h * 0.20), int(w * 0.50), int(h * 0.50)
            face_detected = False
        else:
            fx, fy, fw, fh = faces[0]
            face_detected = True

        # Anthropometric proportions of newborn face:
        # Forehead: top 15% to 38% of face height, middle 60% of face width
        fh_x1, fh_y1 = max(0, int(fx + 0.20 * fw)), max(0, int(fy + 0.10 * fh))
        fh_x2, fh_y2 = min(w, int(fx + 0.80 * fw)), min(h, int(fy + 0.35 * fh))
        fh_mask = np.zeros((h, w), dtype=np.uint8)
        fh_mask[fh_y1:fh_y2, fh_x1:fh_x2] = 255

        # Nose: 45% to 65% of face height, middle 30% of face width
        nose_x1, nose_y1 = max(0, int(fx + 0.35 * fw)), max(0, int(fy + 0.45 * fh))
        nose_x2, nose_y2 = min(w, int(fx + 0.65 * fw)), min(h, int(fy + 0.65 * fh))
        nose_mask = np.zeros((h, w), dtype=np.uint8)
        nose_mask[nose_y1:nose_y2, nose_x1:nose_x2] = 255

        # Eyes: Left and right eye boxes
        eye_y1, eye_y2 = max(0, int(fy + 0.30 * fh)), min(h, int(fy + 0.45 * fh))
        l_eye_x1, l_eye_x2 = max(0, int(fx + 0.18 * fw)), min(w, int(fx + 0.42 * fw))
        r_eye_x1, r_eye_x2 = max(0, int(fx + 0.58 * fw)), min(w, int(fx + 0.82 * fw))
        
        sclera_mask = np.zeros((h, w), dtype=np.uint8)
        sclera_mask[eye_y1:eye_y2, l_eye_x1:l_eye_x2] = 255
        sclera_mask[eye_y1:eye_y2, r_eye_x1:r_eye_x2] = 255
        
        l_eye_mask = np.zeros((h, w), dtype=np.uint8)
        l_eye_mask[eye_y1:eye_y2, l_eye_x1:l_eye_x2] = 255
        r_eye_mask = np.zeros((h, w), dtype=np.uint8)
        r_eye_mask[eye_y1:eye_y2, r_eye_x1:r_eye_x2] = 255

        # Sternum / Chest: directly below face
        chest_y1 = min(h - 5, int(fy + 1.05 * fh))
        chest_y2 = min(h - 1, int(fy + 1.60 * fh))
        chest_x1 = max(0, int(fx + 0.15 * fw))
        chest_x2 = min(w - 1, int(fx + 0.85 * fw))
        has_chest = (chest_y2 - chest_y1 > 15) and (chest_x2 - chest_x1 > 15)
        chest_mask = np.zeros((h, w), dtype=np.uint8)
        if has_chest:
            chest_mask[chest_y1:chest_y2, chest_x1:chest_x2] = 255

        return {
            "detection_method": "opencv_anthropometric" if face_detected else "geometric_center_prior",
            "face_detected": face_detected,
            "rois": {
                "forehead": {"mask": fh_mask, "bbox": (fh_x1, fh_y1, fh_x2 - fh_x1, fh_y2 - fh_y1), "weight": 0.40},
                "nose": {"mask": nose_mask, "bbox": (nose_x1, nose_y1, nose_x2 - nose_x1, nose_y2 - nose_y1), "weight": 0.25},
                "sclera": {"mask": sclera_mask, "bbox": (l_eye_x1, eye_y1, r_eye_x2 - l_eye_x1, eye_y2 - eye_y1), "weight": 0.15},
                "chest": {"mask": chest_mask if has_chest else None, "bbox": (chest_x1, chest_y1, chest_x2 - chest_x1, chest_y2 - chest_y1) if has_chest else None, "weight": 0.20}
            },
            "eye_masks": [l_eye_mask, r_eye_mask],
            "landmarks_count": 4 if face_detected else 0
        }
