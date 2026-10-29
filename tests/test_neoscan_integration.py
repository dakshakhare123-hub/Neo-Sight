"""
Integration Tests for NeoScan ML Integration (neoscan_ml)
==========================================================
Verifies that:
1. The new ML analysis pipeline is safely wired into the API routes.
2. Error gating strictly rejects non-faces, blurry, tiny, and unreadable images with typed 422 errors.
3. Missing model paths fail cleanly with HTTP 503 MODEL_UNAVAILABLE.
4. Oversized payloads (>15MB) return HTTP 413 FILE_TOO_LARGE.
5. Valid infant images return deterministic outcomes with real model scores (no fakes or mocks).
6. Multi-threaded concurrent requests run safely.
"""

import os
import sys
import json
import base64
import asyncio
import io
import unittest
import numpy as np
import cv2
from concurrent.futures import ThreadPoolExecutor
from starlette.datastructures import UploadFile

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.config import NeoScanMLConfig
from backend.app.api.routes import (
    analyze_image,
    analyze_file,
    health_check,
    AnalyzeRequest
)
from backend.app.api import routes


def _run_async(coro):
    """Helper to run async route in current thread."""
    return asyncio.run(coro)


def _extract_response(res):
    """Unwraps JSONResponse or raw dict into (status_code, dict)."""
    if hasattr(res, "status_code"):
        body = json.loads(res.body.decode("utf-8")) if hasattr(res, "body") else {}
        return res.status_code, body
    return 200, res


class TestNeoScanIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.valid_face_b64 = None
        candidates = [
            os.path.join(PROJECT_ROOT, "data", "raw", "njn", "normal", "normal (1).jpg"),
            os.path.join(PROJECT_ROOT, "data", "raw", "njn", "jaundice", "jaundice (1).jpg"),
            os.path.join(PROJECT_ROOT, "ml", "sample_images", "baby_healthy_daylight.jpg"),
        ]
        for c in candidates:
            if os.path.exists(c):
                with open(c, "rb") as f:
                    cls.valid_face_b64 = base64.b64encode(f.read()).decode("ascii")
                break

    def test_01_health_endpoint(self):
        """Health check returns online and neoscan_ml enabled."""
        data = health_check()
        self.assertEqual(data["status"], "online")
        self.assertTrue(data.get("neoscan_enabled"))
        self.assertEqual(data.get("screening_method"), "neoscan_ml")
        self.assertTrue(data.get("ml_model_loaded"))

    def test_02_oversized_payload_rejected(self):
        """Payload exceeding 15MB returns HTTP 413 FILE_TOO_LARGE."""
        huge_payload = "A" * (16 * 1024 * 1024)
        req = AnalyzeRequest(image_base64=huge_payload)
        code, body = _extract_response(_run_async(analyze_image(req)))
        self.assertEqual(code, 413)
        self.assertEqual(body["status"], "error")
        self.assertEqual(body["error"]["code"], "FILE_TOO_LARGE")

    def test_03_unreadable_garbage_rejected(self):
        """Corrupt or non-image bytes return HTTP 422 UNREADABLE_IMAGE."""
        garbage_b64 = base64.b64encode(b"not an image at all").decode("ascii")
        req = AnalyzeRequest(image_base64=garbage_b64)
        code, body = _extract_response(_run_async(analyze_image(req)))
        self.assertEqual(code, 422)
        self.assertEqual(body["status"], "error")
        self.assertEqual(body["error"]["code"], "UNREADABLE_IMAGE")

    def test_04_tiny_image_rejected(self):
        """Images smaller than minimum dimensions return HTTP 422 IMAGE_TOO_SMALL."""
        tiny = np.full((100, 100, 3), 128, dtype=np.uint8)
        _, enc = cv2.imencode(".jpg", tiny)
        b64 = base64.b64encode(enc.tobytes()).decode("ascii")

        req = AnalyzeRequest(image_base64=b64)
        code, body = _extract_response(_run_async(analyze_image(req)))
        self.assertEqual(code, 422)
        self.assertEqual(body["status"], "error")
        self.assertEqual(body["error"]["code"], "IMAGE_TOO_SMALL")

    def test_05_non_face_rejected(self):
        """Non-face image (e.g. textured non-face) is strictly rejected with NO_FACE_DETECTED."""
        textured = np.full((480, 640, 3), 140, dtype=np.uint8)
        # High contrast grid to pass blur check
        textured[::20, :, :] = 240
        textured[:, ::20, :] = 40
        _, enc = cv2.imencode(".jpg", textured)
        b64 = base64.b64encode(enc.tobytes()).decode("ascii")

        req = AnalyzeRequest(image_base64=b64)
        code, body = _extract_response(_run_async(analyze_image(req)))
        self.assertEqual(code, 422)
        self.assertEqual(body["status"], "error")
        self.assertEqual(body["error"]["code"], "NO_FACE_DETECTED")
        self.assertIn("hint", body["error"])

    def test_05b_flat_blurry_image_rejected(self):
        """Flat uniform image fails the blur gate with IMAGE_TOO_BLURRY."""
        flat = np.full((480, 640, 3), 140, dtype=np.uint8)
        _, enc = cv2.imencode(".jpg", flat)
        b64 = base64.b64encode(enc.tobytes()).decode("ascii")

        req = AnalyzeRequest(image_base64=b64)
        code, body = _extract_response(_run_async(analyze_image(req)))
        self.assertEqual(code, 422)
        self.assertEqual(body["status"], "error")
        self.assertEqual(body["error"]["code"], "IMAGE_TOO_BLURRY")

    def test_06_missing_model_returns_503(self):
        """When NEOSCAN_MODEL points to a missing file, analyzer returns HTTP 503 MODEL_UNAVAILABLE."""
        orig_model = NeoScanMLConfig.MODEL_PATH
        orig_cached = routes._analyzer_instance
        try:
            routes._analyzer_instance = None
            NeoScanMLConfig.MODEL_PATH = "nonexistent_model_dir/missing.joblib"

            dummy = np.full((300, 300, 3), 128, dtype=np.uint8)
            _, enc = cv2.imencode(".jpg", dummy)
            b64 = base64.b64encode(enc.tobytes()).decode("ascii")

            req = AnalyzeRequest(image_base64=b64)
            code, body = _extract_response(_run_async(analyze_image(req)))
            self.assertEqual(code, 503)
            self.assertEqual(body["status"], "error")
            self.assertEqual(body["error"]["code"], "MODEL_UNAVAILABLE")
        finally:
            NeoScanMLConfig.MODEL_PATH = orig_model
            routes._analyzer_instance = orig_cached

    def test_07_valid_baby_image_success(self):
        """Real infant image produces valid deterministic analysis result without mock scores."""
        if not self.valid_face_b64:
            self.skipTest("No candidate face image found for test")

        req = AnalyzeRequest(image_base64=self.valid_face_b64)
        code, body = _extract_response(_run_async(analyze_image(req)))
        self.assertEqual(code, 200)
        self.assertEqual(body["status"], "ok")
        self.assertTrue(body["success"])
        self.assertIn(body["category"], ("no_visible_signs", "possible_jaundice_signs", "inconclusive"))

        # Verify model_score is a valid float in [0.0, 1.0]
        self.assertIsInstance(body["model_score"], (int, float))
        self.assertGreaterEqual(body["model_score"], 0.0)
        self.assertLessEqual(body["model_score"], 1.0)

        # Verify reliability and disclaimer
        self.assertIn(body["reliability"], ("normal", "reduced"))
        self.assertIn("disclaimer", body)
        self.assertTrue(len(body["disclaimer"]) > 10)

        # Verify adapter fields preserved for UI
        self.assertIn("risk_assessment", body)
        self.assertIn("tracking", body)
        self.assertIn("visualizations", body)
        self.assertTrue(body["visualizations"]["diagnostic_overlay_base64"].startswith("data:image/png;base64,"))

    def test_08_multipart_file_upload(self):
        """analyze_image_file works identically to base64 JSON endpoint."""
        if not self.valid_face_b64:
            self.skipTest("No candidate face image found for test")

        raw_bytes = base64.b64decode(self.valid_face_b64)
        file_obj = UploadFile(filename="test_baby.jpg", file=io.BytesIO(raw_bytes))
        code, body = _extract_response(_run_async(analyze_file(file=file_obj)))
        self.assertEqual(code, 200)
        self.assertEqual(body["status"], "ok")
        self.assertIn(body["category"], ("no_visible_signs", "possible_jaundice_signs", "inconclusive"))

    def test_09_concurrent_requests_safety(self):
        """Multiple concurrent requests process without thread-safety collisions or crashes."""
        if not self.valid_face_b64:
            self.skipTest("No candidate face image found for test")

        def _make_req():
            req = AnalyzeRequest(image_base64=self.valid_face_b64)
            return _extract_response(_run_async(analyze_image(req)))

        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = [pool.submit(_make_req) for _ in range(4)]
            results = [f.result() for f in futures]

        for code, body in results:
            self.assertEqual(code, 200, f"Concurrent request failed with body: {body}")
            self.assertEqual(body["status"], "ok")


if __name__ == "__main__":
    unittest.main()
