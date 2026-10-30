# Clinical Triage Rules & Decision Matrix

**Module:** NeoScan Pediatric Triage Engine  
**Version:** 2.2.0  
**Compliance:** AAP (American Academy of Pediatrics) 2022 Hyperbilirubinemia Screening Guidelines  
**Date:** 2026-10-30  

---

## 1. Decision Matrix & Urgency Levels

| Analysis Category | Reliability | Patient Red Flags | Triage Level | Headline | Badge | Core Actionable Recommendation |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **`possible_jaundice_signs`** | Any | Age < 24h OR Preterm OR Poor Feeding | **`urgent`** | **Immediate Pediatric Evaluation Required** | `URGENT EVALUATION` | Same-day clinical assessment and immediate total serum bilirubin (TSB) measurement required due to high-risk clinical factors. |
| **`possible_jaundice_signs`** | `normal` | None | **`elevated`** | **Pediatric Consultation Recommended** | `CLINICAL EVALUATION ADVISED` | Cutaneous yellowness exceeds normal thresholds. A healthcare provider evaluation and transcutaneous (TcB) or blood (TSB) bilirubin test are recommended. |
| **`possible_jaundice_signs`** | `reduced` | None | **`elevated`** | **Pediatric Consultation Recommended (Lower Confidence)** | `CLINICAL EVALUATION ADVISED` | Cutaneous yellowness is elevated, but ambient lighting was uneven. Clinical assessment is advised; never downgrade urgency for reduced reliability. |
| **`inconclusive`** | Any | Age < 24h OR Preterm | **`urgent`** | **Clinical Assessment Advised (Risk Factors Present)** | `CLINICAL REVIEW ADVISED` | Optical yellowness is borderline, but patient risk factors warrant direct clinical evaluation. |
| **`inconclusive`** | Any | None | **`warning`** | **Inconclusive: Retake in Daylight** | `INCONCLUSIVE — RETAKE PHOTO` | Optical yellowness is borderline or ambient lighting precluded confident analysis. Retake photo in bright, indirect daylight or consult a pediatrician if concerned. |
| **`no_visible_signs`** | Any | Age < 24h (Onset < 24h) | **`urgent`** | **Pediatric Review Advised (Early Postnatal Age)** | `EARLY ONSET REVIEW` | While skin analysis detected no severe signs, any suspected icterus in the first 24 hours of life is non-physiological and warrants medical review. |
| **`no_visible_signs`** | Any | None | **`normal`** | **No Visible Signs Detected — Routine Monitoring** | `ROUTINE OBSERVATION` | Cutaneous yellowness is within expected limits for healthy neonates. Continue regular feeding (8–12 times/24h) and routine pediatric checks. Never a substitute for medical diagnosis. |
| **`error` / Failed** | Any | Any | **`none`** | **Assessment Unavailable (Quality Alert)** | `RETAKE PHOTO` | Image did not pass quality gating (e.g. blur, darkness, non-face). No triage recommendation is rendered. Review corrective action and retake. |
| **Missing Image** | None | Any | **`none`** | **Awaiting Screening Capture** | `READY FOR SCREENING` | No patient photo has been evaluated yet. Capture or upload a photo to generate an objective screening recommendation. |

---

## 2. Configurable Screening Thresholds

These thresholds are defined in `frontend/src/triageConfig.js` and `backend/app/config/triage_rules.json` to allow clinical oversight and adjustment without touching core analysis code:

```json
{
  "version": "2.2.0",
  "author": "NeoScan Clinical Advisory Board",
  "b_star_scale": {
    "min_axis": 0.0,
    "max_axis": 30.0,
    "low_threshold": 14.0,
    "high_threshold": 20.0,
    "bands": [
      {
        "id": "low",
        "label": "Low / Routine Yellowness",
        "range": [0.0, 14.0],
        "color_hex": "#FACC15",
        "bg_hex": "#FEF9C3",
        "description": "Within normal dermal chrominance limits"
      },
      {
        "id": "moderate",
        "label": "Moderate / Borderline",
        "range": [14.0, 20.0],
        "color_hex": "#EA580C",
        "bg_hex": "#FFEDD5",
        "description": "Mild cutaneous yellowness; monitor cephalocaudal progression"
      },
      {
        "id": "elevated",
        "label": "Elevated Yellowness",
        "range": [20.0, 30.0],
        "color_hex": "#DC2626",
        "bg_hex": "#FEE2E2",
        "description": "Pronounced dermal yellowness; clinical assessment advised"
      }
    ]
  },
  "clinical_red_flags": {
    "early_onset_hours_max": 24,
    "high_risk_gestations": ["preterm", "late-preterm"],
    "critical_symptoms": ["poor_feeding", "lethargy", "pale_stools", "dark_urine"]
  }
}
```

---

## 3. Explainability Output Contract

The pure triage function `computeTriage(input)` returns a structured object:

```typescript
interface TriageResult {
  level: "urgent" | "elevated" | "warning" | "normal" | "none";
  headline: string;
  badge: string;
  color: string;
  reasons: string[];
  advice: string[];
  confidenceNote: string | null;
  modelScore: number | null;
  bStarDisplay: {
    forehead: number | null;
    cheeks: number | null;
    combined: number | null;
    bandId: "low" | "moderate" | "elevated" | "none";
    bandLabel: string;
    ariaLabel: string;
  };
  disclaimer: string;
}
```
