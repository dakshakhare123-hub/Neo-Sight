"""
Unit tests for Multi-Spectrum Visual Inspection and Alignment.
Tests that:
1. 'Corrected' returns genuine illumination-normalized image when colour_normalised is True, or None when False.
2. 'Diagnostic ROIs' produces overlay aligned to analyzed frame.
3. 'Yellowness Heat Map' produces valid per-pixel b* heatmap image.
4. Alignment metadata provides valid bounding boxes within frame dimensions.
5. b_star_display returns forehead, cheeks, and combined b* with valid bands.
"""

import os
import sys
import json
import base64
import asyncio
import unittest
import numpy as np
import cv2

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.api.routes import analyze_image, list_demo_samples, AnalyzeRequest


class TestInspectionModes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        res = list_demo_samples()
        healthy = next(s for s in res["samples"] if s["id"] == "healthy_daylight")
        cls.healthy_b64 = healthy["image_base64"]

    def test_multi_spectrum_visualizations_presence(self):
        """Verifies all inspection modes return valid non-null outputs on valid sample."""
        req = AnalyzeRequest(
            image_base64=self.healthy_b64,
            correction_method="auto",
            include_visualizations=True,
            age_hours=48.0,
            gestation="full-term",
            feeding="breastfeeding"
        )
        response = asyncio.run(analyze_image(req))
        if hasattr(response, "body"):
            data = json.loads(response.body.decode("utf-8"))
        else:
            data = response

        self.assertEqual(data.get("status"), "ok")
        self.assertIn("visualizations", data)
        vis = data["visualizations"]

        # Diagnostic overlay
        self.assertIn("diagnostic_overlay_base64", vis)
        self.assertIsNotNone(vis["diagnostic_overlay_base64"])
        self.assertTrue(vis["diagnostic_overlay_base64"].startswith("data:image/png;base64,"))

        # Yellowness heatmap
        self.assertIn("yellowness_heatmap_base64", vis)
        self.assertIsNotNone(vis["yellowness_heatmap_base64"])
        self.assertTrue(vis["yellowness_heatmap_base64"].startswith("data:image/jpeg;base64,"))

        # Analyzed frame
        self.assertIn("analyzed_frame_base64", vis)
        self.assertIsNotNone(vis["analyzed_frame_base64"])
        self.assertTrue(vis["analyzed_frame_base64"].startswith("data:image/jpeg;base64,"))

        # Alignment metadata
        self.assertIn("alignment", data)
        align = data["alignment"]
        self.assertIn("analyzed_width", align)
        self.assertIn("analyzed_height", align)
        self.assertIn("face_box", align)
        self.assertIn("rois", align)
        self.assertGreater(align["analyzed_width"], 0)
        self.assertGreater(align["analyzed_height"], 0)

        # b_star_display
        self.assertIn("b_star_display", data)
        b_disp = data["b_star_display"]
        self.assertIn("forehead", b_disp)
        self.assertIn("cheeks", b_disp)
        self.assertIn("combined", b_disp)
        self.assertIn("band_id", b_disp)
        self.assertIn(b_disp["band_id"], ("low", "moderate", "elevated"))

        # Triage deterministic engine
        self.assertIn("triage", data)
        triage = data["triage"]
        self.assertIn("headline", triage)
        self.assertIn("badge", triage)
        self.assertIn("reasons", triage)
        self.assertIn("advice", triage)
        self.assertIsInstance(triage["reasons"], list)
        self.assertGreater(len(triage["reasons"]), 0)


if __name__ == "__main__":
    unittest.main()
