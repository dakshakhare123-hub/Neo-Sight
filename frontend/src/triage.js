/**
 * NeoScan Pure Deterministic Clinical Triage Engine
 * ==================================================
 * Direct client-side implementation of the clinical triage decision matrix.
 * Mirrored 1:1 with backend/app/core/triage_rules.py.
 *
 * Guaranteed properties:
 * - Deterministic: same inputs -> exact same outputs.
 * - Explainable: returns a clinical 'reasons' array ("Why this recommendation").
 * - Safe: Never returns a recommendation when analysis failed or is pending.
 * - Red-flag sensitive: Escalates early-onset (<24h), preterm, and lethargic infants.
 */

import { TRIAGE_CONFIG } from "./triageConfig.js";

/**
 * Computes deterministic clinical triage decision.
 *
 * @param {Object} params
 * @param {Object|null} params.analysisResult - The raw API response from /api/v1/analyze
 * @param {Object|null} params.patient - Patient profile object
 * @param {Object|string|null} params.error - Any active error object or string
 * @returns {Object} TriageDecision
 */
export function computeTriage({ analysisResult = null, patient = null, error = null } = {}) {
  const { COLORS, DISCLAIMER } = TRIAGE_CONFIG;

  // 1. Error state: Never render a recommendation on a failed image
  if (error) {
    const errMsg = typeof error === "string" ? error : (error.message || "Image quality check failed.");
    const errHint = typeof error === "object" ? (error.action || error.hint || "Adjust lighting and ensure the face is clearly visible.") : "Retake photo in natural daylight.";
    return {
      level: "none",
      headline: "Assessment Unavailable (Quality Alert)",
      recommendation: "",
      badge: "RETAKE PHOTO",
      color: COLORS.WARNING,
      reasons: [`Image rejected by quality gate: ${errMsg}`],
      advice: [errHint, "Ensure the baby is positioned front-on in soft indirect daylight."],
      confidenceNote: null,
      modelScore: null,
      category: "ERROR",
      disclaimer: DISCLAIMER,
      isActionable: false
    };
  }

  // 2. Missing analysis state: Never guess or output a default recommendation
  if (!analysisResult || (!analysisResult.category && !analysisResult.risk_assessment?.risk_category)) {
    return {
      level: "none",
      headline: "Awaiting Screening Capture",
      recommendation: "",
      badge: "READY FOR SCREENING",
      color: COLORS.NEUTRAL,
      reasons: ["No patient image has been evaluated yet."],
      advice: ["Capture or upload a clear photo of the infant's forehead or sternum in natural daylight."],
      confidenceNote: null,
      modelScore: null,
      category: "PENDING",
      disclaimer: DISCLAIMER,
      isActionable: false
    };
  }

  // Extract raw category and model score
  const ra = analysisResult.risk_assessment || {};
  const rawCat = analysisResult.category || ra.risk_category || "";
  const catNorm = String(rawCat).trim().toLowerCase();
  const modelScore = typeof analysisResult.model_score === "number" 
    ? analysisResult.model_score 
    : (typeof ra.model_score === "number" ? ra.model_score : null);

  const reliability = analysisResult.reliability || ra.reliability || "normal";
  const reliabilityNote = analysisResult.reliability_note || ra.reliability_note || null;

  // Extract b* biomarker
  const feats = analysisResult.features || {};
  const bStarVal = feats.fh_b ?? ra.primary_biomarkers?.dermal_yellowness_b_star ?? analysisResult.fused_biomarkers?.fused_lab_b_star ?? null;
  const bStar = typeof bStarVal === "number" && !isNaN(bStarVal) ? bStarVal : null;

  // Compute patient demographic inputs
  let ageHours = null;
  if (patient) {
    if (typeof patient.ageHours === "number") {
      ageHours = patient.ageHours;
    } else if (typeof patient.ageValue === "number") {
      const unit = (patient.ageUnit || "hours").toLowerCase();
      ageHours = unit.startsWith("day") ? patient.ageValue * 24.0 : patient.ageValue;
    }
  }

  const gestation = (patient?.gestation || "").toLowerCase();
  const feeding = (patient?.feeding || "").toLowerCase();
  const symptoms = Array.isArray(patient?.symptoms) ? patient.symptoms : [];

  const isEarlyOnset = ageHours !== null && ageHours < TRIAGE_CONFIG.EARLY_ONSET_HOURS;
  const isPreterm = gestation === "preterm" || gestation === "late-preterm";
  const isFeedingProblem = feeding === "poor" || feeding === "lethargic" || symptoms.some(s => ["poor_feeding", "lethargy", "difficult_to_wake"].includes(s));

  const reasons = [];
  const advice = [];

  // Demographic red flag explanations
  if (isEarlyOnset) {
    reasons.push(`Postnatal age is ${Math.round(ageHours)} hours (< 24 hours). Jaundice appearing in the first 24 hours of life is non-physiological and requires urgent evaluation.`);
  }
  if (isPreterm) {
    const gestLabel = gestation === "preterm" ? "Preterm (< 35 weeks)" : "Late preterm (35–36.6 weeks)";
    reasons.push(`Gestational maturity: ${gestLabel}. Preterm infants have higher susceptibility to bilirubin neurotoxicity.`);
  }
  if (isFeedingProblem) {
    reasons.push("Feeding difficulties or lethargy reported. Poor feeding impairs bilirubin excretion and increases risk.");
  }

  // Reliability note
  let confNote = null;
  if (reliability === "reduced") {
    confNote = reliabilityNote || "Ambient lighting was non-uniform or insufficient background was present for illuminant correction. Retake in better light; clinical evaluation should not be delayed.";
    reasons.push("Image reliability flag: Reduced confidence due to ambient lighting conditions.");
  }

  // Case A: Analysis shows POSSIBLE_JAUNDICE_SIGNS
  if (["possible_jaundice_signs", "possible", "jaundice"].includes(catNorm)) {
    if (modelScore !== null) {
      reasons.unshift(`Optical machine learning screening score (${modelScore.toFixed(4)}) indicates possible jaundice signs.`);
    }
    if (bStar !== null) {
      if (bStar >= 20.0) {
        reasons.splice(1, 0, `Calibrated cutaneous yellowness b* = ${bStar.toFixed(1)} (elevated dermal chrominance ≥ 20).`);
      } else if (bStar >= 14.0) {
        reasons.splice(1, 0, `Calibrated cutaneous yellowness b* = ${bStar.toFixed(1)} (moderate dermal chrominance).`);
      } else {
        reasons.splice(1, 0, `Calibrated cutaneous yellowness b* = ${bStar.toFixed(1)}.`);
      }
    }

    advice.push("Contact your paediatrician, GP, or midwife for an immediate in-person clinical assessment.");
    advice.push("A transcutaneous bilirubin (TcB) or total serum bilirubin (TSB) blood test is recommended to determine if phototherapy is indicated.");
    advice.push("Maintain regular, frequent feeding (8–12 times per 24 hours) to support bilirubin excretion.");

    if (isEarlyOnset || isPreterm || isFeedingProblem) {
      return {
        level: "urgent",
        headline: "Immediate Paediatric Evaluation Required",
        recommendation: "Paediatric consultation recommended",
        badge: "URGENT EVALUATION",
        color: COLORS.URGENT,
        reasons,
        advice,
        confidenceNote: confNote,
        modelScore,
        category: "POSSIBLE_JAUNDICE_SIGNS",
        disclaimer: DISCLAIMER,
        isActionable: true
      };
    }

    return {
      level: "elevated",
      headline: "Paediatric consultation recommended",
      recommendation: "Paediatric consultation recommended",
      badge: "CLINICAL EVALUATION ADVISED",
      color: COLORS.ELEVATED,
      reasons,
      advice,
      confidenceNote: confNote,
      modelScore,
      category: "POSSIBLE_JAUNDICE_SIGNS",
      disclaimer: DISCLAIMER,
      isActionable: true
    };
  }

  // Case B: Analysis is INCONCLUSIVE
  if (["inconclusive", "borderline", "referral"].includes(catNorm)) {
    if (modelScore !== null) {
      reasons.unshift(`Optical machine learning score (${modelScore.toFixed(4)}) falls in the indeterminate screening interval.`);
    }
    reasons.splice(1, 0, "Optical yellowness is borderline or ambient illuminant precluded definitive automated classification.");

    advice.push("Retake the screening photograph in bright, indirect, even daylight with the baby face front-on.");
    advice.push("Avoid artificial tungsten lamps, coloured casts, or harsh shadows on the infant's skin.");
    advice.push("If you have any clinical concerns, or if the infant appears visibly yellow, do not wait for a retake—seek healthcare provider evaluation.");

    if (isEarlyOnset || isPreterm || isFeedingProblem) {
      advice.unshift("Due to infant risk factors, proceed directly to clinical evaluation rather than relying on image retakes.");
      return {
        level: "urgent",
        headline: "Clinical Assessment Advised (Risk Factors Present)",
        recommendation: "Inconclusive: retake the photo in even daylight; seek clinical assessment if you are concerned",
        badge: "CLINICAL REVIEW ADVISED",
        color: COLORS.URGENT,
        reasons,
        advice,
        confidenceNote: confNote,
        modelScore,
        category: "INCONCLUSIVE",
        disclaimer: DISCLAIMER,
        isActionable: true
      };
    }

    return {
      level: "warning",
      headline: "Inconclusive: retake the photo in even daylight; seek clinical assessment if you are concerned",
      recommendation: "Inconclusive: retake the photo in even daylight; seek clinical assessment if you are concerned",
      badge: "INCONCLUSIVE — RETAKE PHOTO",
      color: COLORS.WARNING,
      reasons,
      advice,
      confidenceNote: confNote,
      modelScore,
      category: "INCONCLUSIVE",
      disclaimer: DISCLAIMER,
      isActionable: true
    };
  }

  // Case C: Analysis shows NO_VISIBLE_SIGNS
  if (["no_visible_signs", "normal", "routine"].includes(catNorm)) {
    if (modelScore !== null) {
      reasons.unshift(`Optical machine learning score (${modelScore.toFixed(4)}) is within normal physiological limits.`);
    }
    if (bStar !== null) {
      if (bStar < 14.0) {
        reasons.splice(1, 0, `Calibrated cutaneous yellowness b* = ${bStar.toFixed(1)} is within low baseline limits (< 14).`);
      } else if (bStar < 20.0) {
        reasons.splice(1, 0, `Calibrated cutaneous yellowness b* = ${bStar.toFixed(1)} is in the moderate band (14–20); optical screening score remains within normal limits.`);
      } else {
        reasons.splice(1, 0, `Calibrated cutaneous yellowness b* = ${bStar.toFixed(1)}.`);
      }
    }

    advice.push("Continue routine newborn monitoring and observe skin in natural daylight daily.");
    advice.push("Ensure regular infant feeding (8–12 times per 24 hours).");
    advice.push("Seek prompt medical care if the baby looks yellow later, feeds poorly, or is unusually sleepy or difficult to wake.");

    // RED FLAG ESCALATION: Jaundice in first 24h is pathological!
    if (isEarlyOnset) {
      advice.unshift("Jaundice appearing in the first 24 hours of life is non-physiological regardless of visual appearance. Have a clinician examine the baby.");
      return {
        level: "urgent",
        headline: "Paediatric Review Advised (Early Postnatal Age)",
        recommendation: "Paediatric Review Advised (Early Postnatal Age)",
        badge: "EARLY ONSET REVIEW",
        color: COLORS.URGENT,
        reasons,
        advice,
        confidenceNote: confNote,
        modelScore,
        category: "NO_VISIBLE_SIGNS",
        disclaimer: DISCLAIMER,
        isActionable: true
      };
    }

    if (isFeedingProblem) {
      advice.unshift("Feeding difficulties require clinical review regardless of skin color.");
      return {
        level: "elevated",
        headline: "Clinical Review Advised (Feeding Concern)",
        recommendation: "Clinical Review Advised (Feeding Concern)",
        badge: "CLINICAL REVIEW ADVISED",
        color: COLORS.ELEVATED,
        reasons,
        advice,
        confidenceNote: confNote,
        modelScore,
        category: "NO_VISIBLE_SIGNS",
        disclaimer: DISCLAIMER,
        isActionable: true
      };
    }

    return {
      level: "normal",
      headline: "No visible signs detected. Continue routine monitoring",
      recommendation: "No visible signs detected. Continue routine monitoring",
      badge: "ROUTINE OBSERVATION",
      color: COLORS.NORMAL,
      reasons,
      advice,
      confidenceNote: confNote,
      modelScore,
      category: "NO_VISIBLE_SIGNS",
      disclaimer: DISCLAIMER,
      isActionable: true
    };
  }

  // Fallback
  return {
    level: "warning",
    headline: "Clinical Assessment Advised (Unrecognized Output)",
    recommendation: "Clinical Assessment Advised (Unrecognized Output)",
    badge: "REVIEW REQUIRED",
    color: COLORS.WARNING,
    reasons: [`Unrecognized screening outcome category: '${rawCat}'.`],
    advice: ["Seek medical evaluation from a licensed pediatrician."],
    confidenceNote: null,
    modelScore,
    category: "UNKNOWN",
    disclaimer: DISCLAIMER,
    isActionable: false
  };
}
