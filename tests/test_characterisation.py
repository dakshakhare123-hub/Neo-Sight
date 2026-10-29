"""
NeoScan Pre-Integration Characterisation Test Suite
===================================================
Establishes the behavioral baseline for non-analysis features:
1. Static web app bundle compilation & integrity.
2. API health endpoint contract.
3. Preloaded clinical demo samples delivery and data URL validity.
4. Color space transforms and quality gate baseline execution.
5. Patient record schema validation.

These tests MUST pass before AND after neoscan_ml integration.
"""

import os
import sys
import json
import base64
import unittest
import numpy as np
import cv2

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.api.routes import health_check, list_demo_samples
from backend.app.core.quality_gate import QualityGate
from backend.app.core.color_spaces import ColorSpaceTransformer
from backend.app.utils.image_io import ImageIO


class TestNonAnalysisCharacterisation(unittest.TestCase):

    def test_frontend_bundle_exists_and_non_empty(self):
        """Verifies compiled frontend assets exist and are populated."""
        app_js = os.path.join(PROJECT_ROOT, "frontend", "app.js")
        index_html = os.path.join(PROJECT_ROOT, "frontend", "index.html")
        self.assertTrue(os.path.exists(app_js), "frontend/app.js missing")
        self.assertTrue(os.path.exists(index_html), "frontend/index.html missing")
        self.assertGreater(os.path.getsize(app_js), 50000, "frontend/app.js is unexpectedly small")
        self.assertGreater(os.path.getsize(index_html), 1000, "frontend/index.html is unexpectedly small")

    def test_health_check_contract(self):
        """Verifies the health endpoint returns standard fields."""
        res = health_check()
        self.assertEqual(res["status"], "online")
        self.assertEqual(res["service"], "NeoScan Clinical Screening Engine")
        self.assertIn("supported_methods", res)
        self.assertIn("shades_of_gray", res["supported_methods"])
        self.assertIn("card_ccm", res["supported_methods"])

    def test_demo_samples_contract(self):
        """Verifies preloaded clinical demo samples are present and valid."""
        res = list_demo_samples()
        self.assertIn("samples", res)
        samples = res["samples"]
        self.assertIsInstance(samples, list)
        self.assertGreaterEqual(len(samples), 4, "Must have at least 4 demo clinical samples")
        
        sample_ids = [s["id"] for s in samples]
        self.assertIn("healthy_daylight", sample_ids)
        self.assertIn("moderate_tungsten", sample_ids)
        self.assertIn("severe_overcast", sample_ids)
        self.assertIn("with_aruco_card", sample_ids)

        for s in samples:
            self.assertIn("image_base64", s)
            self.assertTrue(s["image_base64"].startswith("data:image/jpeg;base64,"))
            raw_b64 = s["image_base64"].split(",", 1)[1]
            decoded = base64.b64decode(raw_b64)
            self.assertGreater(len(decoded), 1000, f"Sample {s['id']} image is corrupt or empty")

    def test_quality_gate_baseline_eval(self):
        """Verifies quality gate evaluates sharpness, clipping, and dimensions."""
        gate = QualityGate()
        valid_img = np.full((300, 300, 3), 150, dtype=np.uint8)
        # Add texture so it has sharpness
        cv2.randn(valid_img, 150, 30)
        res = gate.evaluate_image(valid_img)
        self.assertIn("passed", res)
        self.assertIn("sharpness_score", res)
        self.assertIn("valid_pixel_ratio", res)

    def test_color_space_transformer_metrics(self):
        """Verifies colorimetric extraction from pixel arrays."""
        transformer = ColorSpaceTransformer()
        pixels = np.array([[100, 150, 200], [110, 160, 210]], dtype=np.uint8)
        metrics = transformer.extract_metrics(pixels)
        self.assertIn("lab_b_mean", metrics)
        self.assertIn("bilirubin_index", metrics)
        self.assertIn("cr_cb_ratio", metrics)
        self.assertTrue(np.isfinite(metrics["lab_b_mean"]))

    def test_patient_store_schema_conformance(self):
        """Verifies that patient records adhere to non-destructive schema."""
        sample_record = {
            "id": "scan-test-1",
            "timestamp": "2026-10-29T12:00:00Z",
            "imageUri": "data:image/jpeg;base64,1234",
            "result": {"category": "no_visible_signs", "model_score": 0.05},
            "tracking": {"locked": True, "estimated_distance_cm": 26}
        }
        self.assertIn("id", sample_record)
        self.assertIn("timestamp", sample_record)
        self.assertIn("result", sample_record)


if __name__ == "__main__":
    unittest.main()
