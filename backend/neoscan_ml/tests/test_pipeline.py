"""Run: python -m unittest discover -s tests -v"""
import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import cv2
import numpy as np

from neoscan_ml.errors import AnalysisError
from neoscan_ml.features import extract_features
from neoscan_ml.predict import Analyzer


def textured(bgr, size=480, seed=0):
    rng = np.random.default_rng(seed)
    base = np.full((size, size, 3), bgr, np.float32)
    noise = rng.normal(0, 18, (size, size, 3))
    img = np.clip(base + noise, 0, 255).astype(np.uint8)
    return cv2.GaussianBlur(img, (3, 3), 0.8)


class GateTests(unittest.TestCase):
    def code(self, img):
        with self.assertRaises(AnalysisError) as cm:
            extract_features(img)
        return cm.exception.code

    def test_yellow_wall_is_not_a_baby(self):
        # skin-/jaundice-coloured textured surface with no face: must be refused
        self.assertIn(self.code(textured((90, 170, 215))), {"NO_FACE_DETECTED", "IMAGE_TOO_BLURRY"})

    def test_random_noise_rejected(self):
        rng = np.random.default_rng(1)
        self.assertEqual(self.code(rng.integers(0, 255, (480, 480, 3), dtype=np.uint8)), "NO_FACE_DETECTED")

    def test_blank_rejected(self):
        self.assertEqual(self.code(np.full((480, 480, 3), 128, np.uint8)), "IMAGE_TOO_BLURRY")

    def test_dark_rejected(self):
        self.assertEqual(self.code(textured((8, 8, 8))), "POOR_EXPOSURE")

    def test_garbage_bytes(self):
        with self.assertRaises(AnalysisError) as cm:
            extract_features(b"not an image")
        self.assertEqual(cm.exception.code, "UNREADABLE_IMAGE")

    def test_tiny_image(self):
        self.assertEqual(self.code(np.zeros((50, 50, 3), np.uint8)), "IMAGE_TOO_SMALL")

    def test_missing_model(self):
        with self.assertRaises(AnalysisError) as cm:
            Analyzer("does/not/exist.joblib")
        self.assertEqual(cm.exception.code, "MODEL_UNAVAILABLE")


class FacePositive(unittest.TestCase):
    def test_real_face_passes_gate_and_features_vary(self):
        try:
            from skimage import data
        except ImportError:
            self.skipTest("scikit-image not installed")
        rgb = data.astronaut()
        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        f1, meta, _ = extract_features(bgr)
        warm = bgr.astype(np.float32)
        warm[..., 0] *= 0.8   # reduce blue -> yellower image
        f2, _, _ = extract_features(np.clip(warm, 0, 255).astype(np.uint8))
        self.assertTrue(all(np.isfinite(v) for v in f1.values()))
        self.assertNotEqual(f1["fh_b"], f2["fh_b"])      # different input -> different measurement
        self.assertGreater(meta["roi_pixels"]["fh"], 250)


if __name__ == "__main__":
    unittest.main()
