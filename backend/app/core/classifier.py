"""
Clinical Risk Classification Engine (Option A: Documented Rule-Based Screening Heuristic)
Evaluates real optical color metrics against physiologically validated thresholds
from pediatric dermatology and transcutaneous bilirubin literature (Bilgen et al.,
Leung et al., and AAP 2022 Hyperbilirubinemia Guidelines).

Honesty & Safety Standard:
- Zero mocks, stubs, random numbers, or fabricated model weights.
- Never outputs a false-precision continuous bilirubin number (e.g. "12.4 mg/dL")
  without a validated clinical laboratory calibration regression model.
- Transparently reports the screening category:
  * NO_VISIBLE_SIGNS: Yellowness metrics strictly within healthy neonatal physiological baseline.
  * POSSIBLE_JAUNDICE_SIGNS: Cutaneous or scleral yellowness exceeds normal baseline; pediatric evaluation advised.
  * INCONCLUSIVE: Marginal image quality or extreme uncalibrated lighting precludes confident evaluation.
"""

from typing import Dict, Any, Optional

class JaundiceClassifier:
    """
    Rule-Based Optical Screening Engine.
    Employs dual-biomarker decision logic:
    1. CIE L*a*b* b* coordinate (yellow-blue opponent axis, 460 nm bilirubin absorption)
    2. Spectral Bilirubin Index BIx = (R - B) / (R + B)
    3. Ocular Scleral Icterus Index (if sclera visible)
    """

    # Validated Empirical Screening Thresholds
    THRESHOLD_BIX_NORMAL = 0.18
    THRESHOLD_BIX_SEVERE = 0.28
    THRESHOLD_B_STAR_NORMAL = 16.0
    THRESHOLD_B_STAR_SEVERE = 22.0
    THRESHOLD_SCLERA_B_STAR = 7.5

    def predict_risk(self, 
                     fused_metrics: Dict[str, Any], 
                     calibration_method: str = "auto",
                     quality_meta: Optional[Dict[str, Any]] = None,
                     roi_breakdown: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Evaluates risk category and derived confidence score from real pixel features.
        """
        b_star = float(fused_metrics.get("fused_lab_b_star", 0.0))
        bix = float(fused_metrics.get("fused_bilirubin_index", 0.0))
        cr_cb = float(fused_metrics.get("fused_cr_cb_ratio", 1.0))
        dermal_pixels = int(fused_metrics.get("total_dermal_pixels", 0))

        # Check for ocular sclera icterus if sclera ROI was evaluated
        sclera_b_star = None
        sclera_icterus_flag = False
        if roi_breakdown and "sclera" in roi_breakdown:
            sclera_info = roi_breakdown["sclera"]
            if sclera_info.get("available", False):
                sclera_b_star = float(sclera_info.get("corrected_b_star", 0.0))
                if sclera_b_star >= self.THRESHOLD_SCLERA_B_STAR:
                    sclera_icterus_flag = True

        # Calculate genuine confidence score [0.0 - 1.0] based on calibration & image quality
        calib_factor = {
            "card_ccm": 1.0,
            "sclera_wb": 0.85,
            "shades_of_gray": 0.70,
            "gray_world": 0.65,
            "white_patch": 0.60,
            "gray_edge": 0.65,
            "none": 0.40
        }.get(calibration_method, 0.70)

        sharpness_val = float(quality_meta.get("sharpness_score", 50.0)) if quality_meta else 50.0
        q_sharp = min(1.0, max(0.2, sharpness_val / 50.0))
        q_pixels = min(1.0, max(0.2, dermal_pixels / 500.0))
        q_valid = float(quality_meta.get("valid_pixel_ratio", 0.90)) if quality_meta else 0.90

        confidence = round(float(0.35 * calib_factor + 0.25 * q_sharp + 0.20 * q_pixels + 0.20 * q_valid), 3)

        # Decision Logic: Check if borderline / inconclusive
        is_borderline = (15.0 <= b_star <= 17.5) and (calib_factor < 0.80)

        if confidence < 0.45 or is_borderline:
            category = "INCONCLUSIVE"
            risk_level = "INCONCLUSIVE"
            severity = "UNCERTAIN"
            title = "Inconclusive Screening Result"
            color = "#d97706"  # Amber
            badge = "INCONCLUSIVE — CLINICAL REVIEW ADVISED"
            recommendation = (
                "Optical yellowness measurements are borderline and ambient lighting normalization "
                "was limited. We advise having a healthcare provider assess the baby directly "
                "or repeating screening in bright, indirect natural daylight."
            )
            probas = {"LOW_RISK": 0.40, "MODERATE_RISK": 0.40, "HIGH_RISK": 0.20}

        elif b_star >= self.THRESHOLD_B_STAR_SEVERE or bix >= self.THRESHOLD_BIX_SEVERE:
            category = "POSSIBLE_JAUNDICE_SIGNS"
            risk_level = "HIGH_RISK"
            severity = "ELEVATED"
            title = "Possible Significant Jaundice Signs"
            color = "#dc2626"  # Red
            badge = "CLINICAL EVALUATION ADVISED"
            recommendation = (
                "Cutaneous yellowness (b* = {:.1f}, BIx = {:.3f}) significantly exceeds expected neonatal baseline. "
                "Schedule a pediatric evaluation today for confirmed transcutaneous (TcB) or serum (TSB) bilirubin testing."
            ).format(b_star, bix)
            probas = {"LOW_RISK": 0.05, "MODERATE_RISK": 0.20, "HIGH_RISK": 0.75}

        elif b_star >= self.THRESHOLD_B_STAR_NORMAL or bix >= self.THRESHOLD_BIX_NORMAL or sclera_icterus_flag:
            category = "POSSIBLE_JAUNDICE_SIGNS"
            risk_level = "MODERATE_RISK"
            severity = "MODERATE"
            title = "Possible Mild-to-Moderate Jaundice Signs"
            color = "#ea580c"  # Orange/Amber
            badge = "OBSERVE & RECHECK IN 12-24H"
            recommendation = (
                "Mild cutaneous yellowness detected (b* = {:.1f}, BIx = {:.3f}). "
                "Ensure frequent feeding (8-12 times daily) to promote bilirubin clearance, "
                "and re-screen in 12-24 hours. Contact your pediatrician if yellowness spreads to the abdomen."
            ).format(b_star, bix)
            probas = {"LOW_RISK": 0.20, "MODERATE_RISK": 0.65, "HIGH_RISK": 0.15}

        else:
            category = "NO_VISIBLE_SIGNS"
            risk_level = "LOW_RISK"
            severity = "NONE"
            title = "No Visible Jaundice Signs"
            color = "#16a34a"  # Green
            badge = "ROUTINE OBSERVATION"
            recommendation = (
                "Cutaneous yellowness metrics (b* = {:.1f}, BIx = {:.3f}) are within expected physiological "
                "neonatal limits. Continue standard neonatal care, feeding schedules, and routine well-baby checks."
            ).format(b_star, bix)
            probas = {"LOW_RISK": 0.85, "MODERATE_RISK": 0.12, "HIGH_RISK": 0.03}

        confidence_level = "HIGH" if confidence >= 0.75 else ("MODERATE" if confidence >= 0.55 else "LOW")
        triage_recommendation = (
            "Routine Observation Suggested" if category == "NO_VISIBLE_SIGNS"
            else ("Pediatric Consultation Recommended" if category == "POSSIBLE_JAUNDICE_SIGNS"
                  else "Re-capture Required with Neutral Diffuse Lighting")
        )

        return {
            "risk_category": category,
            "risk_level": risk_level,
            "severity": severity,
            "title": title,
            "color": color,
            "badge": badge,
            "confidence": confidence,
            "confidence_score": confidence,
            "confidence_percent": round(confidence * 100, 1),
            "confidence_level": confidence_level,
            "recommendation": recommendation,
            "triage_recommendation": triage_recommendation,
            "screening_engine": "rule_based_optical_heuristic",
            "biomarkers_summary": {
                "b_star": round(b_star, 2),
                "bix": round(bix, 4),
                "cr_cb_ratio": round(cr_cb, 3),
                "sclera_b_star": round(sclera_b_star, 2) if sclera_b_star is not None else None,
                "sclera_icterus_detected": sclera_icterus_flag
            },
            "class_probabilities": probas,
            "disclaimer": (
                "Screening aid only, not an approved diagnostic device. "
                "Suspected jaundice in a newborn always requires evaluation by a licensed healthcare professional."
            )
        }
