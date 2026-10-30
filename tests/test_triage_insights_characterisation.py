"""
NeoScan Triage and Insights Characterisation Test Suite
======================================================
Establishes the baseline behavior of the Triage and Insights page (Step 3):
1. Health endpoint and demo samples availability.
2. Demo samples response structure and biomarker fields.
3. Analysis response schema backward-compatibility.
4. Patient image history records linking to Step 3 display.
5. Error response schema contract (typed errors must not crash UI).

These tests MUST pass before AND after fixes to triage logic, b* scale, and inspection modes.
"""

import os
import sys
import json
import asyncio
import unittest

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.api.routes import (
    health_check,
    list_demo_samples,
    analyze_image,
    AnalyzeRequest
)


class TestTriageInsightsCharacterisation(unittest.TestCase):

    def test_health_endpoint_contract(self):
        """Verifies health endpoint is online and reports neoscan_ml active."""
        res = health_check()
        self.assertEqual(res["status"], "online")
        self.assertTrue(res["neoscan_enabled"])
        self.assertTrue(res["ml_model_loaded"])
        self.assertIn("neoscan-hgb", res["model_version"])

    def test_demo_samples_baseline(self):
        """Verifies demo samples contract for clinical screening tests."""
        res = list_demo_samples()
        self.assertIn("samples", res)
        samples = res["samples"]
        self.assertGreaterEqual(len(samples), 4)

        sample_ids = [s["id"] for s in samples]
        self.assertIn("healthy_daylight", sample_ids)

    def test_healthy_daylight_sample_analysis_contract(self):
        """Verifies that healthy_daylight passes gate and returns required triage fields."""
        res = list_demo_samples()
        healthy = next(s for s in res["samples"] if s["id"] == "healthy_daylight")

        req = AnalyzeRequest(
            image_base64=healthy["image_base64"],
            correction_method="auto",
            include_visualizations=True
        )
        response = asyncio.run(analyze_image(req))
        if hasattr(response, "body"):
            data = json.loads(response.body.decode("utf-8"))
        else:
            data = response

        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("category"), "no_visible_signs")
        self.assertIsInstance(data.get("model_score"), float)
        self.assertIn("features", data)
        self.assertIn("fh_b", data["features"])
        self.assertIn("risk_assessment", data)
        self.assertIn("triage_recommendation", data["risk_assessment"])
        self.assertIn("visualizations", data)

    def test_error_response_contract_for_corrupt_payload(self):
        """Verifies that unreadable/corrupt images return structured 422 error."""
        req = AnalyzeRequest(
            image_base64="data:image/jpeg;base64,corruptgarbagepayload123",
            correction_method="auto",
            include_visualizations=False
        )
        response = asyncio.run(analyze_image(req))
        self.assertEqual(response.status_code, 422)
        body = json.loads(response.body.decode("utf-8"))
        self.assertEqual(body.get("status"), "error")
        self.assertIn("error", body)
        self.assertIn("code", body["error"])
        self.assertIn("message", body["error"])
        self.assertIn("hint", body["error"])


if __name__ == "__main__":
    unittest.main()
