"""
NeoScan Capture Controls & Logo Characterisation Tests
======================================================
Validates baseline contract and interactive behaviors of Step 2 (Capture Screen)
and brand assets:
1. Camera state handlers and capture triggers exist in app bundle.
2. File upload handler and input specifications.
3. Reference card download endpoint accessibility.
4. Accessible labels, titles, and ARIA attributes for all capture controls.
"""

import os
import sys
import unittest

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


class TestCaptureControlsCharacterisation(unittest.TestCase):
    def setUp(self):
        self.app_js_path = os.path.join(PROJECT_ROOT, "frontend", "app.js")
        self.index_html_path = os.path.join(PROJECT_ROOT, "frontend", "index.html")
        self.app_jsx_path = os.path.join(PROJECT_ROOT, "frontend", "src", "App.jsx")

    def test_app_bundle_contains_camera_handlers(self):
        """Verifies core camera lifecycle handlers are compiled into production app bundle."""
        self.assertTrue(os.path.exists(self.app_js_path), "frontend/app.js must exist")
        with open(self.app_js_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("startCamera", content)
        self.assertIn("stopCamera", content)
        self.assertIn("toggleCameraFacing", content)
        self.assertIn("captureFrame", content)
        self.assertIn("handleFileUpload", content)

    def test_app_jsx_defines_capture_state(self):
        """Verifies captureMode, cameraFacing, continuousAnalysis states exist in App.jsx."""
        with open(self.app_jsx_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("const [captureMode, setCaptureMode] = useState", content)
        self.assertIn("const [cameraActive, setCameraActive] = useState", content)
        self.assertIn("const [cameraFacing, setCameraFacing] = useState", content)
        self.assertIn("const [continuousAnalysis, setContinuousAnalysis] = useState", content)
        self.assertIn("const [showBiometricOverlay, setShowBiometricOverlay] = useState", content)

    def test_reference_card_asset_exists(self):
        """Verifies printable ArUco calibration card asset is available in docs."""
        card_svg = os.path.join(PROJECT_ROOT, "docs", "CALIBRATION_CARD_PRINTABLE.svg")
        self.assertTrue(os.path.exists(card_svg), "CALIBRATION_CARD_PRINTABLE.svg must exist")

    def test_capture_controls_have_accessible_names(self):
        """Verifies all Step 2 capture controls have visible labels and accessible ARIA attributes."""
        with open(self.app_jsx_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Back navigation button
        self.assertIn('aria-label="Back to Patient Profile"', content)
        self.assertIn('title="Back to Patient Profile"', content)

        # Switch camera button
        self.assertIn('<span>Switch Camera</span>', content)
        self.assertIn('Switch camera (currently using', content)

        # Framing guide toggle
        self.assertIn('Framing Guide: ON', content)
        self.assertIn('Framing Guide: OFF', content)
        self.assertIn('aria-pressed={showBiometricOverlay}', content)

        # Continuous streaming toggle
        self.assertIn('aria-pressed={continuousAnalysis}', content)

        # Shutter capture button
        self.assertIn('Capture &amp; Screen Photo', content)
        self.assertIn('start clinical jaundice screening', content)

        # File upload dropzone & input
        self.assertIn('role="button"', content)
        self.assertIn('tabIndex={0}', content)
        self.assertIn('id="infant-photo-file-input"', content)

        # Color constancy dropdown
        self.assertIn('id="optical-method-select"', content)
        self.assertIn('aria-label="Select color constancy normalization method"', content)

    def test_brand_assets_and_logo_files_exist(self):
        """Verifies all required brand logo SVGs, favicons, PNG icons, and PWA manifest exist."""
        expected_files = [
            os.path.join(PROJECT_ROOT, "frontend", "assets", "logo.svg"),
            os.path.join(PROJECT_ROOT, "frontend", "assets", "logo-mark.svg"),
            os.path.join(PROJECT_ROOT, "frontend", "assets", "logo-light.svg"),
            os.path.join(PROJECT_ROOT, "frontend", "favicon.svg"),
            os.path.join(PROJECT_ROOT, "frontend", "favicon.ico"),
            os.path.join(PROJECT_ROOT, "frontend", "apple-touch-icon.png"),
            os.path.join(PROJECT_ROOT, "frontend", "icon-192.png"),
            os.path.join(PROJECT_ROOT, "frontend", "icon-512.png"),
            os.path.join(PROJECT_ROOT, "frontend", "manifest.json"),
        ]
        for file_path in expected_files:
            self.assertTrue(os.path.exists(file_path), f"Expected brand asset file missing: {file_path}")
            self.assertGreater(os.path.getsize(file_path), 0, f"Brand asset file is empty: {file_path}")

    def test_index_html_has_brand_meta_and_splash_logo(self):
        """Verifies index.html links to favicon, manifest, apple touch icon, and renders logo in splash screen."""
        with open(self.index_html_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn('<link rel="icon" type="image/svg+xml" href="/app/favicon.svg"', content)
        self.assertIn('<link rel="alternate icon" href="/favicon.ico"', content)
        self.assertIn('<link rel="apple-touch-icon" href="/app/apple-touch-icon.png"', content)
        self.assertIn('<link rel="manifest" href="/manifest.json"', content)
        self.assertIn('<meta name="theme-color" content="#4C2365"', content)
        self.assertIn('aria-label="NeoScan Logo Mark"', content)

    def test_app_jsx_renders_neoscan_logo(self):
        """Verifies NeoScanLogo component is defined and used in App.jsx."""
        with open(self.app_jsx_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("function NeoScanLogo(", content)
        self.assertIn("<NeoScanLogo onClick={() => setCurrentStep(1)} />", content)
        self.assertIn('aria-label="NeoScan Pediatric Screening home (go to Patient Profile)"', content)

    def test_fastapi_serves_brand_assets_and_favicons(self):
        """Verifies FastAPI endpoint handlers for /favicon.ico, /manifest.json, /apple-touch-icon.png."""
        from backend.app.main import serve_favicon, serve_manifest, serve_apple_touch_icon

        fav_resp = serve_favicon()
        self.assertTrue(os.path.exists(fav_resp.path), f"Favicon path {fav_resp.path} must exist")
        self.assertIn("image", fav_resp.media_type)

        man_resp = serve_manifest()
        self.assertTrue(os.path.exists(man_resp.path), f"Manifest path {man_resp.path} must exist")
        self.assertEqual(man_resp.media_type, "application/manifest+json")

        icon_resp = serve_apple_touch_icon()
        self.assertTrue(os.path.exists(icon_resp.path), f"Apple icon path {icon_resp.path} must exist")
        self.assertEqual(icon_resp.media_type, "image/png")


if __name__ == "__main__":
    unittest.main()
