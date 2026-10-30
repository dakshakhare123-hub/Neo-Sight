"""
NeoScan Triage Decision Matrix Unit Test Suite
==============================================
Validates the full decision matrix of compute_triage:
- Category x Reliability x Red-Flag demographic inputs x Errors x Missing data.
- Proves that normal and jaundiced inputs yield distinct, deterministic recommendations.
- Proves that failed/missing analyses never output a fabricated recommendation.
- Proves that red-flag inputs escalate clinical urgency appropriately.
"""

import os
import sys
import unittest

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.core.triage_rules import compute_triage, TriageDecision


class TestTriageDecisionMatrix(unittest.TestCase):

    def test_missing_analysis_produces_no_recommendation(self):
        """Rule 3: Missing analysis must show 'Awaiting screening capture' with level 'none'."""
        res_none = compute_triage(None)
        self.assertEqual(res_none.level, "none")
        self.assertEqual(res_none.headline, "Awaiting Screening Capture")
        self.assertEqual(res_none.category, "PENDING")

        res_empty = compute_triage("")
        self.assertEqual(res_empty.level, "none")

        res_pending = compute_triage("PENDING")
        self.assertEqual(res_pending.level, "none")

    def test_error_state_produces_no_recommendation(self):
        """Rule 3: Analysis error must show error hint with level 'none', never a clinical guess."""
        err = {"code": "NO_FACE_DETECTED", "message": "No face found", "hint": "Face the camera"}
        res = compute_triage("possible_jaundice_signs", error=err)
        self.assertEqual(res.level, "none")
        self.assertEqual(res.headline, "Assessment Unavailable (Quality Alert)")
        self.assertEqual(res.badge, "RETAKE PHOTO")
        self.assertIn("Image rejected by quality gate", res.reasons[0])
        self.assertIn("Face the camera", res.advice[0])

    def test_normal_image_without_red_flags_produces_routine_observation(self):
        """Rule 4: no_visible_signs must produce routine observation, never clearance or consultation."""
        res = compute_triage(
            category="no_visible_signs",
            model_score=0.012,
            reliability="normal",
            b_star=11.5,
            age_hours=72,
            gestation="full-term",
            feeding="breastfeeding"
        )
        self.assertEqual(res.level, "normal")
        self.assertEqual(res.headline, "No visible signs detected. Continue routine monitoring")
        self.assertEqual(res.recommendation, "No visible signs detected. Continue routine monitoring")
        self.assertEqual(res.badge, "ROUTINE OBSERVATION")
        self.assertIn("#1E6F43", res.color)
        self.assertFalse(res.headline.lower().startswith("paediatric consultation"))

    def test_jaundiced_image_produces_pediatric_consultation(self):
        """Rule 2: possible_jaundice_signs must produce paediatric consultation."""
        res = compute_triage(
            category="possible_jaundice_signs",
            model_score=0.885,
            reliability="normal",
            b_star=22.4,
            age_hours=72,
            gestation="full-term",
            feeding="breastfeeding"
        )
        self.assertEqual(res.level, "elevated")
        self.assertEqual(res.headline, "Paediatric consultation recommended")
        self.assertEqual(res.recommendation, "Paediatric consultation recommended")
        self.assertEqual(res.badge, "CLINICAL EVALUATION ADVISED")
        self.assertIn("#8F1D40", res.color)

    def test_inconclusive_image_produces_retake_warning(self):
        """Rule 3: inconclusive must advise daylight retake with level 'warning'."""
        res = compute_triage(
            category="inconclusive",
            model_score=0.35,
            reliability="normal",
            b_star=15.2,
            age_hours=72,
            gestation="full-term",
            feeding="breastfeeding"
        )
        self.assertEqual(res.level, "warning")
        self.assertEqual(res.headline, "Inconclusive: retake the photo in even daylight; seek clinical assessment if you are concerned")
        self.assertEqual(res.recommendation, "Inconclusive: retake the photo in even daylight; seek clinical assessment if you are concerned")
        self.assertEqual(res.badge, "INCONCLUSIVE — RETAKE PHOTO")
        self.assertIn("#9E5700", res.color)

    def test_moderate_b_star_normal_vs_jaundiced_produce_distinct_recommendations(self):
        """Regression test for bug: Moderate b* (14-20) alone must NOT force paediatric consultation for normal infant."""
        # 1. Normal infant with moderate b* (e.g. 16.5)
        res_normal_mod = compute_triage(
            category="no_visible_signs",
            model_score=0.016,
            reliability="normal",
            b_star=16.5,
            age_hours=72,
            gestation="full-term",
            feeding="breastfeeding"
        )
        self.assertEqual(res_normal_mod.level, "normal")
        self.assertEqual(res_normal_mod.headline, "No visible signs detected. Continue routine monitoring")
        self.assertNotIn("paediatric consultation recommended", res_normal_mod.headline.lower())

        # 2. Jaundiced infant with moderate b* (e.g. 16.5)
        res_jaund_mod = compute_triage(
            category="possible_jaundice_signs",
            model_score=0.72,
            reliability="normal",
            b_star=16.5,
            age_hours=72,
            gestation="full-term",
            feeding="breastfeeding"
        )
        self.assertEqual(res_jaund_mod.level, "elevated")
        self.assertEqual(res_jaund_mod.headline, "Paediatric consultation recommended")

        # Must differ definitively:
        self.assertNotEqual(res_normal_mod.headline, res_jaund_mod.headline)
        self.assertNotEqual(res_normal_mod.level, res_jaund_mod.level)

    def test_normal_and_jaundiced_inputs_produce_distinct_recommendations(self):
        """Requirement: Must fail if two clearly different inputs always give the same recommendation."""
        res_norm = compute_triage("no_visible_signs", model_score=0.01, age_hours=72, gestation="full-term")
        res_jaund = compute_triage("possible_jaundice_signs", model_score=0.85, age_hours=72, gestation="full-term")

        self.assertNotEqual(res_norm.headline, res_jaund.headline, "Normal and Jaundiced cannot share headline")
        self.assertNotEqual(res_norm.level, res_jaund.level, "Normal and Jaundiced cannot share level")
        self.assertNotEqual(res_norm.badge, res_jaund.badge, "Normal and Jaundiced cannot share badge")
        self.assertNotEqual(res_norm.color, res_jaund.color, "Normal and Jaundiced cannot share color")

    def test_reduced_reliability_adds_note_without_downgrading_urgency(self):
        """Rule 5: Reduced reliability must add confidence note and preserve elevated level."""
        res = compute_triage(
            category="possible_jaundice_signs",
            model_score=0.82,
            reliability="reduced",
            reliability_note="Uneven background lighting",
            age_hours=72,
            gestation="full-term"
        )
        self.assertEqual(res.level, "elevated")
        self.assertIsNotNone(res.confidence_note)
        self.assertIn("Uneven background lighting", res.confidence_note)

    def test_early_onset_red_flag_escalates_even_normal_image(self):
        """Rule 6: Age < 24h is pathological until proven otherwise and must escalate."""
        res = compute_triage(
            category="no_visible_signs",
            model_score=0.02,
            b_star=10.0,
            age_hours=18,  # Under 24 hours!
            gestation="full-term"
        )
        self.assertEqual(res.level, "urgent")
        self.assertIn("Early Postnatal Age", res.headline)
        self.assertTrue(any("first 24 hours" in r for r in res.reasons))

    def test_preterm_with_jaundice_escalates_to_urgent(self):
        """Rule 6: Preterm infant with possible jaundice escalates to urgent evaluation."""
        res = compute_triage(
            category="possible_jaundice_signs",
            model_score=0.75,
            age_hours=48,
            gestation="preterm",
            feeding="breastfeeding"
        )
        self.assertEqual(res.level, "urgent")
        self.assertEqual(res.headline, "Immediate Pediatric Evaluation Required")
        self.assertEqual(res.badge, "URGENT EVALUATION")

    def test_poor_feeding_escalates_recommendation(self):
        """Rule 6: Feeding difficulties escalate to immediate evaluation."""
        res = compute_triage(
            category="possible_jaundice_signs",
            model_score=0.60,
            age_hours=48,
            gestation="full-term",
            feeding="poor"
        )
        self.assertEqual(res.level, "urgent")
        self.assertIn("Feeding difficulties", "".join(res.reasons))


if __name__ == "__main__":
    unittest.main()
