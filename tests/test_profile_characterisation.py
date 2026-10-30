"""
NeoScan Patient Profile Characterisation Test Suite
===================================================
Establishes the behavioral and data contract baseline for the Patient Profile page:
1. Default patient seed records schema (Leo, Maya, Sam, Noah).
2. Demographic fields integrity: name, ageValue, ageUnit, gestation, feeding, notes.
3. Patient switching and active patient derivation logic.
4. Patient demographic editing behavior (in-memory state update emulation).
5. Image record tracking structure (rawImage, activeCorrection, tracking distance, analysis).
6. Empty image gallery handling (empty state vs populated gallery).
7. Demo samples integration for profile seeding.

These tests MUST pass before AND after the layout and typography redesign.
"""

import os
import sys
import json
import unittest

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.api.routes import list_demo_samples


class TestPatientProfileCharacterisation(unittest.TestCase):

    def setUp(self):
        self.default_patients = [
            {
                "id": "patient-leo",
                "name": "Baby Leo",
                "ageValue": 72,
                "ageUnit": "hours",
                "gestation": "full-term",
                "feeding": "breastfeeding",
                "notes": "Healthy neonate in standard daylight (D65). Baseline physiological skin color.",
                "sampleId": "healthy_daylight",
                "images": []
            },
            {
                "id": "patient-maya",
                "name": "Baby Maya",
                "ageValue": 48,
                "ageUnit": "hours",
                "gestation": "full-term",
                "feeding": "breastfeeding",
                "notes": "Mild dermal icterus under warm incandescent lighting (2800K).",
                "sampleId": "moderate_tungsten",
                "images": []
            },
            {
                "id": "patient-sam",
                "name": "Baby Sam",
                "ageValue": 96,
                "ageUnit": "hours",
                "gestation": "late-preterm",
                "feeding": "combination",
                "notes": "Deep cutaneous yellowness with scleral involvement under cool overcast light (7200K).",
                "sampleId": "severe_overcast",
                "images": []
            },
            {
                "id": "patient-noah",
                "name": "Baby Noah",
                "ageValue": 60,
                "ageUnit": "hours",
                "gestation": "full-term",
                "feeding": "breastfeeding",
                "notes": "Physical ArUco 4x4 ID 0 reference card calibration.",
                "sampleId": "with_aruco_card",
                "images": []
            }
        ]

    def test_default_patient_records_structure(self):
        """Verifies that all 4 default patients exist with standard fields."""
        self.assertEqual(len(self.default_patients), 4)
        expected_ids = {"patient-leo", "patient-maya", "patient-sam", "patient-noah"}
        actual_ids = {p["id"] for p in self.default_patients}
        self.assertEqual(expected_ids, actual_ids)

        for p in self.default_patients:
            self.assertTrue(p["name"].startswith("Baby "))
            self.assertIsInstance(p["ageValue"], int)
            self.assertIn(p["ageUnit"], ["hours", "days"])
            self.assertIn(p["gestation"], ["full-term", "late-preterm", "preterm"])
            self.assertIn(p["feeding"], ["breastfeeding", "formula", "combination"])
            self.assertIsInstance(p["notes"], str)
            self.assertIsInstance(p["images"], list)

    def test_patient_selection_derivation(self):
        """Verifies active patient selection matches ID or falls back to first patient."""
        patients = list(self.default_patients)
        
        # Select Baby Maya
        active_id = "patient-maya"
        active_patient = next((p for p in patients if p["id"] == active_id), patients[0])
        self.assertEqual(active_patient["name"], "Baby Maya")

        # Invalid ID falls back to index 0
        invalid_id = "non-existent"
        fallback_patient = next((p for p in patients if p["id"] == invalid_id), patients[0])
        self.assertEqual(fallback_patient["name"], "Baby Leo")

    def test_patient_demographic_edit_immutability(self):
        """Verifies patient fields can be updated while preserving image history."""
        patients = [dict(p) for p in self.default_patients]
        target_id = "patient-leo"

        # Update name, ageValue, ageUnit, gestation
        updated_patients = [
            {
                **p,
                "name": "Leo Alexander" if p["id"] == target_id else p["name"],
                "ageValue": 80 if p["id"] == target_id else p["ageValue"],
                "ageUnit": "days" if p["id"] == target_id else p["ageUnit"],
                "gestation": "late-preterm" if p["id"] == target_id else p["gestation"],
            }
            for p in patients
        ]

        leo = next(p for p in updated_patients if p["id"] == target_id)
        self.assertEqual(leo["name"], "Leo Alexander")
        self.assertEqual(leo["ageValue"], 80)
        self.assertEqual(leo["ageUnit"], "days")
        self.assertEqual(leo["gestation"], "late-preterm")

        # Other patients unchanged
        maya = next(p for p in updated_patients if p["id"] == "patient-maya")
        self.assertEqual(maya["name"], "Baby Maya")
        self.assertEqual(maya["ageValue"], 48)

    def test_empty_vs_populated_image_gallery(self):
        """Verifies empty image state vs populated image records."""
        empty_patient = dict(self.default_patients[0])
        self.assertEqual(len(empty_patient["images"]), 0)
        is_empty = not empty_patient["images"] or len(empty_patient["images"]) == 0
        self.assertTrue(is_empty, "Should detect empty image records")

        # Seed an image record
        populated_patient = dict(self.default_patients[0])
        sample_img = {
            "id": "img_leo_1",
            "timestamp": "2026-10-30T10:00:00Z",
            "formattedDate": "Oct 30, 10:00 AM",
            "rawImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
            "activeCorrection": "auto",
            "tracking": {"estimated_distance_cm": 24.5},
            "currentAnalysis": {
                "risk_assessment": {
                    "risk_category": "NO_VISIBLE_SIGNS",
                    "color": "#1E6F43",
                    "model_score": 0.082
                }
            }
        }
        populated_patient["images"] = [sample_img]
        self.assertEqual(len(populated_patient["images"]), 1)
        self.assertFalse(not populated_patient["images"])
        self.assertEqual(populated_patient["images"][0]["tracking"]["estimated_distance_cm"], 24.5)

    def test_demo_sample_seeding_contract(self):
        """Verifies demo samples API provides valid baseline image for each sampleId."""
        res = list_demo_samples()
        samples = res.get("samples", [])
        sample_map = {s["id"]: s for s in samples}

        for p in self.default_patients:
            sample_id = p["sampleId"]
            self.assertIn(sample_id, sample_map, f"Missing demo sample for {p['name']}: {sample_id}")
            self.assertTrue(sample_map[sample_id]["image_base64"].startswith("data:image/jpeg;base64,"))


if __name__ == "__main__":
    unittest.main()
