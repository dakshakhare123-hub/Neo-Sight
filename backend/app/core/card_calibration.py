"""
Reference-Card Calibration Engine
Detects standard ArUco calibration targets, samples observed color patches,
and computes a Ridge-regularized Color Correction Matrix (CCM).

Design Rationale:
Reference-free constancy algorithms (Gray-World, Retinex) rely on statistical
assumptions about natural scenes that can fail if an infant is wearing a saturated
yellow shirt or resting on a colored blanket.
A physical calibration card placed in the frame provides invariant ground-truth
reflectances under identical scene illuminance. Solving a regularized CCM maps
the phone sensor's arbitrary device-dependent RGB space to canonical ground-truth colors.
"""

import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional
from ..config import CalibrationCardPatches

class CardCalibrator:
    def __init__(self, ridge_lambda: float = 0.05):
        self.ridge_lambda = ridge_lambda
        # Target ground truth RGBs in order: [White, Gray, Yellow, SkinLight, SkinMed, Cyan]
        self.ground_truth_order = ["white", "gray", "yellow", "skin_light", "skin_medium", "cyan"]
        self.P_gt = np.array([
            CalibrationCardPatches.GROUND_TRUTH_RGB[k] for k in self.ground_truth_order
        ], dtype=np.float64)  # Shape: (6, 3)

        # Initialize ArUco detector (compatible with both cv2 4.x and 5.x)
        self.aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
        try:
            self.detector_params = cv2.aruco.DetectorParameters()
            self.aruco_detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.detector_params)
            self._use_detector_obj = True
        except AttributeError:
            self.detector_params = cv2.aruco.DetectorParameters_create()
            self._use_detector_obj = False

    def detect_aruco(self, bgr_image: np.ndarray) -> Tuple[bool, Optional[np.ndarray], Optional[int]]:
        """
        Detects ArUco marker in the image.
        Returns: (found, corners, marker_id)
        """
        gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
        if self._use_detector_obj:
            corners, ids, rejected = self.aruco_detector.detectMarkers(gray)
        else:
            corners, ids, rejected = cv2.aruco.detectMarkers(gray, self.aruco_dict, parameters=self.detector_params)

        if ids is not None and len(ids) > 0:
            # Pick marker ID 0 (or first detected)
            best_idx = 0
            for i, mid in enumerate(ids.flatten()):
                if mid == 0:
                    best_idx = i
                    break
            marker_corners = corners[best_idx][0]  # Shape: (4, 2)
            return True, marker_corners, int(ids.flatten()[best_idx])
            
        return False, None, None

    def sample_card_patches(self, bgr_image: np.ndarray, marker_corners: np.ndarray) -> Tuple[np.ndarray, list]:
        """
        Samples the 6 calibration patches located around/adjacent to the ArUco marker.
        The standard NeoScan Card layout places the 6 patches in a 2x3 grid directly below the marker:
        Relative to the marker width (W) and height (H):
        Patch 0 (White):       dx = -0.8*W, dy = 1.3*H
        Patch 1 (Gray):        dx =  0.0*W, dy = 1.3*H
        Patch 2 (Yellow):      dx =  0.8*W, dy = 1.3*H
        Patch 3 (Skin Light):  dx = -0.8*W, dy = 2.1*H
        Patch 4 (Skin Medium): dx =  0.0*W, dy = 2.1*H
        Patch 5 (Cyan):        dx =  0.8*W, dy = 2.1*H
        """
        # Marker corners: 0=top-left, 1=top-right, 2=bottom-right, 3=bottom-left
        c0, c1, c2, c3 = marker_corners[0], marker_corners[1], marker_corners[2], marker_corners[3]
        
        # Center and orientation vectors
        center = np.mean(marker_corners, axis=0)
        vec_x = (c1 - c0 + c2 - c3) / 2.0  # Horizontal vector across marker
        vec_y = (c3 - c0 + c2 - c1) / 2.0  # Vertical vector down marker
        
        rel_positions = [
            (-0.8, 1.3),  # White
            ( 0.0, 1.3),  # Gray
            ( 0.8, 1.3),  # Yellow
            (-0.8, 2.1),  # Skin Light
            ( 0.0, 2.1),  # Skin Medium
            ( 0.8, 2.1),  # Cyan
        ]
        
        h_img, w_img, _ = bgr_image.shape
        observed_rgb = []
        patch_coords = []
        
        rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        
        # Sample radius proportional to marker scale (12% of marker width)
        marker_scale = np.linalg.norm(vec_x)
        sample_radius = max(3, int(marker_scale * 0.12))
        
        for dx, dy in rel_positions:
            patch_center = center + dx * vec_x + dy * vec_y
            px, py = int(round(patch_center[0])), int(round(patch_center[1]))
            
            # Bound within image
            px = np.clip(px, sample_radius, w_img - sample_radius - 1)
            py = np.clip(py, sample_radius, h_img - sample_radius - 1)
            
            patch_coords.append((px, py, sample_radius))
            
            # Extract central neighborhood and take median to avoid specular dust/noise
            sample_box = rgb_image[py - sample_radius : py + sample_radius + 1,
                                   px - sample_radius : px + sample_radius + 1]
            med_rgb = np.median(sample_box.reshape(-1, 3), axis=0)
            observed_rgb.append(med_rgb)
            
        return np.array(observed_rgb, dtype=np.float64), patch_coords

    def compute_ccm(self, P_obs: np.ndarray) -> np.ndarray:
        """
        Solves regularized Ridge Least Squares for 3x3 Color Correction Matrix M:
        argmin_M || P_obs * M - P_gt ||_F^2 + lambda * || M - I ||_F^2
        Solution:
        M = (P_obs^T * P_obs + lambda * I)^(-1) * (P_obs^T * P_gt + lambda * I)
        """
        # Ensure shapes match (6, 3)
        XtX = P_obs.T @ P_obs
        XtY = P_obs.T @ self.P_gt
        
        reg_eye = self.ridge_lambda * np.eye(3)
        # Regularize towards Identity matrix rather than zero to maintain channel geometry
        M = np.linalg.inv(XtX + reg_eye) @ (XtY + reg_eye)
        return M

    def apply_ccm(self, bgr_image: np.ndarray, M: np.ndarray) -> np.ndarray:
        """
        Applies CCM to entire image: I_corrected = I * M
        """
        # Convert to RGB float
        rgb = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB).astype(np.float64)
        h, w, c = rgb.shape
        flat = rgb.reshape(-1, 3)
        
        # Linear color correction
        corrected_flat = flat @ M
        corrected_rgb = np.clip(corrected_flat, 0, 255).astype(np.uint8).reshape(h, w, 3)
        
        # Return as BGR
        return cv2.cvtColor(corrected_rgb, cv2.COLOR_RGB2BGR)

    def calibrate(self, bgr_image: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Full end-to-end calibration attempt.
        Returns: (corrected_image, calibration_metadata)
        """
        found, corners, marker_id = self.detect_aruco(bgr_image)
        
        if not found:
            return bgr_image.copy(), {
                "card_detected": False,
                "message": "ArUco calibration card not detected in frame. Falling back to reference-free constancy."
            }
            
        P_obs, patch_coords = self.sample_card_patches(bgr_image, corners)
        M = self.compute_ccm(P_obs)
        corrected_bgr = self.apply_ccm(bgr_image, M)
        
        # Calculate residual calibration error (RMSE across the 6 patches)
        P_pred = P_obs @ M
        rmse_error = float(np.sqrt(np.mean((P_pred - self.P_gt) ** 2)))
        
        patch_info = []
        for i, name in enumerate(self.ground_truth_order):
            patch_info.append({
                "patch": name,
                "ground_truth_rgb": [int(c) for c in self.P_gt[i]],
                "observed_rgb": [round(float(c), 1) for c in P_obs[i]],
                "calibrated_rgb": [round(float(c), 1) for c in P_pred[i]],
                "coord": [int(patch_coords[i][0]), int(patch_coords[i][1])]
            })
            
        return corrected_bgr, {
            "card_detected": True,
            "marker_id": marker_id,
            "marker_corners": [[round(float(pt[0]), 1), round(float(pt[1]), 1)] for pt in corners],
            "ccm_matrix": [[round(float(val), 4) for val in row] for row in M],
            "rmse_calibration_error": round(rmse_error, 2),
            "patches": patch_info,
            "message": f"Card calibrated successfully (RMSE: {rmse_error:.2f})."
        }
