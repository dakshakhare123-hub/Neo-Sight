"""
NeoScan Deterministic Clinical Triage Engine
============================================
A pure, side-effect-free clinical decision module for neonatal jaundice screening.
Conforms to American Academy of Pediatrics (AAP) 2022 Hyperbilirubinemia Guidelines.

Rules:
1. No analysis result or error -> NO recommendation. Show error/hint or "Awaiting assessment".
2. Category 'possible_jaundice_signs' -> "Paediatric consultation recommended".
3. Category 'inconclusive' -> "Inconclusive: retake the photo in even daylight and seek clinical assessment if concerned".
4. Category 'no_visible_signs' -> "No visible signs detected. Continue routine monitoring". NEVER presents as "no jaundice" or clearance.
5. Reliability 'reduced' -> adds explicit lower-confidence advisory; NEVER downgrades urgency.
6. Red-flag inputs (age < 24h, gestation < 37w, feeding issues/lethargy) escalate urgency regardless of image result.
7. Explanations ('reasons' array) are returned for clinical explainability.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class TriageDecision:
    level: str  # "urgent" | "elevated" | "warning" | "normal" | "none"
    headline: str
    badge: str
    color: str
    reasons: List[str]
    advice: List[str]
    confidence_note: Optional[str]
    model_score: Optional[float]
    category: str
    recommendation: str = ""
    disclaimer: str = (
        "NeoScan is an AI-assisted screening companion designed to support parents and pediatric care teams. "
        "It is not an invasive diagnostic device and does not replace confirmed laboratory serum bilirubin (TSB) "
        "or clinical transcutaneous bilirubin (TcB) testing. Always seek medical guidance from a licensed pediatrician."
    )

    def __post_init__(self):
        if not self.recommendation:
            self.recommendation = self.headline

    def to_dict(self) -> Dict[str, Any]:
        return {
            "level": self.level,
            "headline": self.headline,
            "recommendation": self.recommendation,
            "badge": self.badge,
            "color": self.color,
            "reasons": self.reasons,
            "advice": self.advice,
            "confidence_note": self.confidence_note,
            "model_score": self.model_score,
            "category": self.category,
            "disclaimer": self.disclaimer,
        }


def compute_triage(
    category: Optional[str],
    model_score: Optional[float] = None,
    reliability: str = "normal",
    reliability_note: Optional[str] = None,
    b_star: Optional[float] = None,
    age_hours: Optional[float] = None,
    gestation: Optional[str] = None,
    feeding: Optional[str] = None,
    symptoms: Optional[List[str]] = None,
    error: Optional[Dict[str, Any]] = None,
) -> TriageDecision:
    """
    Pure, side-effect-free clinical triage evaluation.
    """
    symptoms = symptoms or []

    # 1. Error state: Never render a recommendation on a failed image
    if error:
        err_msg = error.get("message", "Image quality check failed.")
        err_hint = error.get("hint") or error.get("action", "Adjust lighting and ensure the face is clearly visible.")
        return TriageDecision(
            level="none",
            headline="Assessment Unavailable (Quality Alert)",
            recommendation="",
            badge="RETAKE PHOTO",
            color="#9E5700",
            reasons=[f"Image rejected by quality gate: {err_msg}"],
            advice=[err_hint, "Ensure the baby is positioned front-on in soft indirect daylight."],
            confidence_note=None,
            model_score=None,
            category="ERROR",
        )

    # 2. Missing analysis state: Never guess or output a default recommendation
    if not category or category.strip().lower() in ("pending", "none", ""):
        return TriageDecision(
            level="none",
            headline="Awaiting Screening Capture",
            recommendation="",
            badge="READY FOR SCREENING",
            color="#725B7E",
            reasons=["No patient image has been evaluated yet."],
            advice=["Capture or upload a clear photo of the infant's forehead or sternum in natural daylight."],
            confidence_note=None,
            model_score=None,
            category="PENDING",
        )

    cat_norm = category.strip().lower()
    reasons: List[str] = []
    advice: List[str] = []

    # 3. Assess Clinical Red Flags from patient demographic inputs
    is_early_onset = age_hours is not None and age_hours < 24.0
    is_preterm = gestation in ("preterm", "late-preterm")
    is_feeding_problem = feeding in ("poor", "lethargic") or any(
        s in ("poor_feeding", "lethargy", "difficult_to_wake") for s in symptoms
    )

    if is_early_onset:
        reasons.append(f"Postnatal age is {age_hours:.0f} hours (< 24 hours). Jaundice appearing in the first 24 hours of life is non-physiological and requires urgent evaluation.")
    if is_preterm:
        gest_label = "Preterm (< 35 weeks)" if gestation == "preterm" else "Late preterm (35–36.6 weeks)"
        reasons.append(f"Gestational maturity: {gest_label}. Preterm infants have higher susceptibility to bilirubin neurotoxicity.")
    if is_feeding_problem:
        reasons.append("Feeding difficulties or lethargy reported. Poor feeding impairs bilirubin excretion and increases risk.")

    # 4. Confidence / Reliability Note
    conf_note = None
    if reliability == "reduced":
        conf_note = reliability_note or "Ambient lighting was non-uniform or insufficient background was present for illuminant correction. Retake in better light; clinical evaluation should not be delayed."
        reasons.append("Image reliability flag: Reduced confidence due to ambient lighting conditions.")

    # 5. Core Decision Logic Combining Image Analysis + Clinical Red Flags
    # Case A: Analysis shows POSSIBLE_JAUNDICE_SIGNS
    if cat_norm in ("possible_jaundice_signs", "possible", "jaundice"):
        if model_score is not None:
            reasons.insert(0, f"Optical machine learning screening score ({model_score:.4f}) indicates possible jaundice signs.")
        if b_star is not None:
            if b_star >= 20.0:
                reasons.insert(1, f"Calibrated cutaneous yellowness b* = {b_star:.1f} (elevated dermal chrominance ≥ 20).")
            elif b_star >= 14.0:
                reasons.insert(1, f"Calibrated cutaneous yellowness b* = {b_star:.1f} (moderate dermal chrominance).")
            else:
                reasons.insert(1, f"Calibrated cutaneous yellowness b* = {b_star:.1f}.")

        advice.append("Contact your paediatrician, GP, or midwife for an immediate in-person clinical assessment.")
        advice.append("A transcutaneous bilirubin (TcB) or total serum bilirubin (TSB) blood test is recommended to determine if phototherapy is indicated.")
        advice.append("Maintain regular, frequent feeding (8–12 times per 24 hours) to support bilirubin excretion.")

        if is_early_onset or is_preterm or is_feeding_problem:
            return TriageDecision(
                level="urgent",
                headline="Immediate Paediatric Evaluation Required",
                recommendation="Paediatric consultation recommended",
                badge="URGENT EVALUATION",
                color="#8F1D40",  # Crimson-Plum (WCAG AAA)
                reasons=reasons,
                advice=advice,
                confidence_note=conf_note,
                model_score=model_score,
                category="POSSIBLE_JAUNDICE_SIGNS",
            )
        return TriageDecision(
            level="elevated",
            headline="Paediatric consultation recommended",
            recommendation="Paediatric consultation recommended",
            badge="CLINICAL EVALUATION ADVISED",
            color="#8F1D40",
            reasons=reasons,
            advice=advice,
            confidence_note=conf_note,
            model_score=model_score,
            category="POSSIBLE_JAUNDICE_SIGNS",
        )

    # Case B: Analysis is INCONCLUSIVE
    if cat_norm in ("inconclusive", "borderline", "referral"):
        if model_score is not None:
            reasons.insert(0, f"Optical machine learning score ({model_score:.4f}) falls in the indeterminate screening interval.")
        reasons.insert(1, "Optical yellowness is borderline or ambient illuminant precluded definitive automated classification.")

        advice.append("Retake the screening photograph in bright, indirect, even daylight with the baby face front-on.")
        advice.append("Avoid artificial tungsten lamps, coloured casts, or harsh shadows on the infant's skin.")
        advice.append("If you have any clinical concerns, or if the infant appears visibly yellow, do not wait for a retake—seek clinical assessment.")

        if is_early_onset or is_preterm or is_feeding_problem:
            advice.insert(0, "Due to infant risk factors, proceed directly to clinical evaluation rather than relying on image retakes.")
            return TriageDecision(
                level="urgent",
                headline="Clinical Assessment Advised (Risk Factors Present)",
                recommendation="Inconclusive: retake the photo in even daylight; seek clinical assessment if you are concerned",
                badge="CLINICAL REVIEW ADVISED",
                color="#8F1D40",
                reasons=reasons,
                advice=advice,
                confidence_note=conf_note,
                model_score=model_score,
                category="INCONCLUSIVE",
            )
        return TriageDecision(
            level="warning",
            headline="Inconclusive: retake the photo in even daylight; seek clinical assessment if you are concerned",
            recommendation="Inconclusive: retake the photo in even daylight; seek clinical assessment if you are concerned",
            badge="INCONCLUSIVE — RETAKE PHOTO",
            color="#9E5700",  # Amber-Gold (WCAG AA)
            reasons=reasons,
            advice=advice,
            confidence_note=conf_note,
            model_score=model_score,
            category="INCONCLUSIVE",
        )

    # Case C: Analysis shows NO_VISIBLE_SIGNS
    if cat_norm in ("no_visible_signs", "normal", "routine"):
        if model_score is not None:
            reasons.insert(0, f"Optical machine learning score ({model_score:.4f}) is within normal physiological limits.")
        if b_star is not None:
            if b_star < 14.0:
                reasons.insert(1, f"Calibrated cutaneous yellowness b* = {b_star:.1f} is within low baseline limits (< 14).")
            elif b_star < 20.0:
                reasons.insert(1, f"Calibrated cutaneous yellowness b* = {b_star:.1f} is in the moderate band (14–20); optical screening score remains within normal limits.")
            else:
                reasons.insert(1, f"Calibrated cutaneous yellowness b* = {b_star:.1f}.")

        advice.append("Continue routine newborn monitoring and observe skin in natural daylight daily.")
        advice.append("Ensure regular infant feeding (8–12 times per 24 hours).")
        advice.append("Seek prompt medical care if the baby looks yellow later, feeds poorly, or is unusually sleepy or difficult to wake.")

        # RED FLAG ESCALATION: Even if the image appears normal, jaundice in the first 24h is pathological!
        if is_early_onset:
            advice.insert(0, "Jaundice appearing in the first 24 hours of life is non-physiological regardless of visual appearance. Have a clinician examine the baby.")
            return TriageDecision(
                level="urgent",
                headline="Paediatric Review Advised (Early Postnatal Age)",
                recommendation="Paediatric Review Advised (Early Postnatal Age)",
                badge="EARLY ONSET REVIEW",
                color="#8F1D40",
                reasons=reasons,
                advice=advice,
                confidence_note=conf_note,
                model_score=model_score,
                category="NO_VISIBLE_SIGNS",
            )
        if is_feeding_problem:
            advice.insert(0, "Feeding difficulties require clinical review regardless of skin color.")
            return TriageDecision(
                level="elevated",
                headline="Clinical Review Advised (Feeding Concern)",
                recommendation="Clinical Review Advised (Feeding Concern)",
                badge="CLINICAL REVIEW ADVISED",
                color="#8F1D40",
                reasons=reasons,
                advice=advice,
                confidence_note=conf_note,
                model_score=model_score,
                category="NO_VISIBLE_SIGNS",
            )

        return TriageDecision(
            level="normal",
            headline="No visible signs detected. Continue routine monitoring",
            recommendation="No visible signs detected. Continue routine monitoring",
            badge="ROUTINE OBSERVATION",
            color="#1E6F43",  # Sage-Emerald (WCAG AA)
            reasons=reasons,
            advice=advice,
            confidence_note=conf_note,
            model_score=model_score,
            category="NO_VISIBLE_SIGNS",
        )

    # Fallback safety (unknown string)
    return TriageDecision(
        level="warning",
        headline="Clinical Assessment Advised (Unrecognized Output)",
        recommendation="Clinical Assessment Advised (Unrecognized Output)",
        badge="REVIEW REQUIRED",
        color="#9E5700",
        reasons=[f"Unrecognized screening outcome category: '{category}'."],
        advice=["Seek medical evaluation from a licensed pediatrician."],
        confidence_note=None,
        model_score=model_score,
        category="UNKNOWN",
    )
