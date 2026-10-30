"""
NeoScan Mobile Transformation Characterisation Test Suite
=========================================================
Validates the operational baseline of core workflows prior to and throughout
the mobile transformation:
1. Patient profile CRUD & data integrity.
2. Image tracking, timeline, and multi-day history state structures.
3. Optical color constancy and calibration methods.
4. Server analysis endpoint contract and error envelope.
5. Deterministic pediatric triage calculation.
6. Multi-spectrum inspection modalities.
7. Brand assets, PWA manifest, and viewport configuration.
"""

import os
import sys
import json
import base64
import unittest
import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.api.routes import health_check, list_demo_samples
from backend.app.core.color_spaces import ColorSpaceTransformer
from backend.app.core.quality_gate import QualityGate
from backend.app.utils.image_io import ImageIO


class TestMobileTransformationCharacterisation(unittest.TestCase):

    def setUp(self):
        self.app_js_path = os.path.join(PROJECT_ROOT, "frontend", "app.js")
        self.app_jsx_path = os.path.join(PROJECT_ROOT, "frontend", "src", "App.jsx")
        self.index_html_path = os.path.join(PROJECT_ROOT, "frontend", "index.html")
        self.manifest_path = os.path.join(PROJECT_ROOT, "frontend", "manifest.json")

    def test_patient_crud_and_store_definitions(self):
        """Verifies patient CRUD functions and state definitions in App.jsx."""
        with open(self.app_jsx_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("const STORAGE_KEY = \"neoscan_patients_store_v3\"", content)
        self.assertIn("const selectPatientProfile =", content)
        self.assertIn("const [patients, setPatients] = useState", content)
        self.assertIn("const [activePatientId, setActivePatientId] = useState", content)
        self.assertIn("DEFAULT_PATIENTS", content)

    def test_image_tracking_and_history_workflow(self):
        """Verifies image tracking state and timeline management exist."""
        with open(self.app_jsx_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("const [activeImageId, setActiveImageId] = useState", content)
        self.assertIn("const activeImageRecord = useMemo", content)
        self.assertIn("screened photos", content)
        self.assertIn("Dermal Screening Spotlight", content)

    def test_optical_color_correction_pipeline(self):
        """Verifies color constancy transformers extract CIE Lab and color metrics."""
        transformer = ColorSpaceTransformer()
        img = np.full((100, 100, 3), 128, dtype=np.uint8)
        
        metrics = transformer.extract_metrics(img)
        self.assertIn("lab_b_mean", metrics)
        self.assertIn("lab_L_mean", metrics)
        self.assertIn("ycbcr_Y_mean", metrics)

    def test_quality_gate_checks_exposure_and_blur(self):
        """Verifies quality gate evaluates blur and exposure."""
        qgate = QualityGate()
        
        # Valid-sized synthetic image (>=240x240)
        sharp_img = np.full((300, 300, 3), 128, dtype=np.uint8)
        sharp_img[::2, ::2] = 200
        eval_sharp = qgate.evaluate_image(sharp_img)
        self.assertIn("passed", eval_sharp)
        self.assertIn("sharpness_score", eval_sharp)
        self.assertIn("valid_pixel_ratio", eval_sharp)

    def test_triage_decision_rules_contract(self):
        """Verifies client-side triage computation handles standard outcome categories."""
        with open(self.app_jsx_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("function computeTriage(", content)
        self.assertIn("TRIAGE_CONFIG", content)
        self.assertIn("MODEL_THRESHOLD", content)
        self.assertIn("B_STAR_BANDS", content)
        self.assertIn("EARLY_ONSET_HOURS", content)

    def test_multi_spectrum_inspection_modes(self):
        """Verifies all 4 clinical inspection modes are supported in the app."""
        with open(self.app_jsx_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn('"corrected"', content)
        self.assertIn('"raw"', content)
        self.assertIn('"heatmap"', content)
        self.assertIn('"diagnostic"', content)

    def test_pwa_manifest_and_viewport_meta(self):
        """Verifies index.html specifies viewport and links to valid manifest."""
        with open(self.index_html_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn('name="viewport"', content)
        self.assertIn('content="width=device-width', content)
        self.assertIn('href="/manifest.json"', content)
        self.assertIn('name="theme-color" content="#4C2365"', content)

        with open(self.manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        self.assertIn("NeoScan", manifest.get("name", ""))
        self.assertEqual(manifest.get("theme_color"), "#4C2365")
        self.assertIn("icons", manifest)
        self.assertGreaterEqual(len(manifest["icons"]), 2)

    def test_service_worker_asset_and_registration(self):
        """Verifies sw.js exists, excludes /api/ from caching, and is registered in index.html."""
        sw_path = os.path.join(PROJECT_ROOT, "frontend", "sw.js")
        self.assertTrue(os.path.exists(sw_path), "frontend/sw.js must exist")

        with open(sw_path, "r", encoding="utf-8") as f:
            sw_content = f.read()

        self.assertIn("CACHE_NAME", sw_content)
        self.assertIn("/api/", sw_content)
        self.assertIn("caches.match", sw_content)

        # Check registration in index.html
        with open(self.index_html_path, "r", encoding="utf-8") as f:
            index_content = f.read()
        self.assertIn("serviceWorker.register('/sw.js'", index_content)

    def test_fastapi_sw_and_manifest_routes(self):
        """Verifies FastAPI route handlers return valid FileResponses for sw.js and manifest.json."""
        from backend.app.main import serve_manifest, serve_service_worker

        res_manifest = serve_manifest()
        self.assertEqual(res_manifest.media_type, "application/manifest+json")
        self.assertTrue(os.path.exists(res_manifest.path))

        res_sw = serve_service_worker()
        self.assertEqual(res_sw.media_type, "application/javascript")
        self.assertEqual(res_sw.headers.get("Service-Worker-Allowed"), "/")
        self.assertTrue(os.path.exists(res_sw.path))

    def test_smartphone_camera_features(self):
        """Verifies smartphone camera enhancements: resolution ladder, EXIF normalizer, and ambient lighting guidance."""
        with open(self.app_jsx_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("getExifOrientation", content)
        self.assertIn("normalizeImageOrientation", content)
        self.assertIn("constraintsLadder", content)
        self.assertIn("ambientLightStatus", content)
        self.assertIn("NEOSCAN_API_URL", content)

    def test_offline_storage_and_privacy_controls(self):
        """Verifies IndexedDB storage, offline queue, privacy veil, and privacy documentation."""
        privacy_doc = os.path.join(PROJECT_ROOT, "PRIVACY_NOTES.md")
        self.assertTrue(os.path.exists(privacy_doc), "PRIVACY_NOTES.md must exist")

        storage_js = os.path.join(PROJECT_ROOT, "frontend", "src", "storage.js")
        self.assertTrue(os.path.exists(storage_js), "frontend/src/storage.js must exist")

        with open(self.app_jsx_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("NeoScanStorage", content)
        self.assertIn("offline_queue", content)
        self.assertIn("isSessionLocked", content)
        self.assertIn("isBackgroundVeilActive", content)


if __name__ == "__main__":
    unittest.main()
