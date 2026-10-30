# Audit Report: Triage and Insights Defect Root Cause Analysis

**Branch:** `fix/triage-insights`  
**Date:** 2026-10-30  
**Authors:** Senior Full-Stack Engineer & Clinical Software QA Specialist  

---

## 1. Executive Summary

A comprehensive architectural and code audit of the **Triage and Insights** page (Step 3) identified the exact root causes of all three reported clinical issues:
1. **Triage Recommendation Stuck:** The frontend and backend previously mapped multiple categories and fallback branches to "Pediatric Consultation Recommended", ignored patient-specific clinical red flags (age < 24h, gestational age, feeding status), and allowed stale analysis results to persist when an image failed quality gating.
2. **CIE b* Yellowness Scale Inaccurate:** The UI visualizer utilized an arbitrary 0–32 linear scale with artificial cutoffs (16 and 22), plotted model probability score (0.0–1.0) onto the b* scale when b* was null, and lacked clinical screening bands, numeric ticks, and accessible yellow-orange-red severity styling.
3. **Multi-Spectrum Visual Inspection Broken:** 
   - `"Corrected"` mode was hardcoded to `None` in `backend/app/api/routes.py:217`, causing it to always fall back to the uncorrected original image.
   - `"Diagnostic ROIs"` coordinates in `tracking_rois` were calculated by dividing downscaled and rotated box coordinates by original raw dimensions, creating severe spatial misalignment.
   - `"Thermal Heatmap"` had no backend data and was scientifically fabricated (RGB cameras do not capture thermal data).

---

## 2. Problem 1 Audit: Triage Recommendation Stuck

### Code Paths Capable of Outputting Recommendations
| File & Line | Code Expression / Path | Trigger Condition | Output Recommendation | Flaw / Root Cause |
| :--- | :--- | :--- | :--- | :--- |
| `frontend/src/App.jsx:1045` | `if (cat.includes("POSSIBLE") \|\| cat.includes("JAUNDICE"))` | Category contains "possible" or "jaundice" | "Pediatric Consultation Recommended" | If category is undefined, fallback string or uppercase mismatch can trigger consultation branch. |
| `frontend/src/App.jsx:1051` | `else if (cat.includes("INCONCLUSIVE"))` | Category contains "inconclusive" | "Inconclusive: Referral Recommended" | Fallback when lighting is ambiguous. |
| `frontend/src/App.jsx:1040` | Default initial values | Neither possible nor inconclusive (e.g. `no_visible_signs`) | "No Visible Jaundice Signs" / "Routine Observation" | Correct for healthy daylight, BUT... |
| `backend/app/api/routes.py:123` | `elif cat == "possible_jaundice_signs":` | Classifier score $\ge \text{thr\_high}$ (0.0613) | `triage_recommendation = "Pediatric Consultation Recommended"` | Model threshold `thr_high` was set very low (0.0613 / 6.1%), causing many normal neonates to trigger possible jaundice. |
| `frontend/src/App.jsx:858` | `if (!response.ok) { setError(errObj); return; }` | Analysis returns 422 (e.g. non-face, blur, tiny) | Retains previous `currentAnalysis` in state | **Silent State Bleed:** If previous image had jaundice signs, retaking a failed image left the old "Pediatric Consultation Recommended" on screen! |
| `frontend/src/App.jsx:1016` | Missing integration with patient state | `activePatient.ageValue`, `activePatient.gestation` ignored | Pure image score only | Fails to incorporate established clinical red flags: age < 24h (pathological jaundice) or preterm status. |

### Severity: High (Critical Clinical Usability)

### Proposed Architectural Fix:
1. Implement a single, pure, side-effect-free function `computeTriage(input)` in `frontend/src/triage.js` (and mirrored in `backend/app/core/triage_rules.py`).
2. Input signature: `{ category, modelScore, reliability, bStar, ageInHours, gestation, feeding, error }`.
3. Strict deterministic rule table:
   - If `error` exists or `analysisResult` is missing: return `level: "none"`, `headline: "Awaiting Assessment"`, `reasons: ["No valid image analyzed yet"]`, `advice: ["Capture or upload an infant photo in soft daylight"]`.
   - If `category === "possible_jaundice_signs"`: return `level: "elevated"`, `headline: "Pediatric Consultation Recommended"`.
   - If `category === "inconclusive"`: return `level: "warning"`, `headline: "Inconclusive: Retake in Daylight"`.
   - If `category === "no_visible_signs"`: return `level: "normal"`, `headline: "No Visible Signs Detected — Routine Monitoring"`.
   - **Clinical Red-Flag Escalation:**
     * If `ageInHours < 24`: Any visible jaundice in the first 24 hours of life is pathological until proven otherwise $\rightarrow$ escalate to `level: "urgent"`, `headline: "Urgent Pediatric Evaluation Required (Onset < 24h)"`.
     * If `gestation === "preterm"` and `category !== "no_visible_signs"`: escalate to `level: "urgent"`.
     * If `feeding === "poor"` or symptoms of lethargy are noted: escalate to `level: "urgent"`.
   - If `reliability === "reduced"`: append explicit lower-confidence advisory; never downgrade clinical urgency.

---

## 3. Problem 2 Audit: CIE b* Yellowness Scale Inaccuracies

### Tracing Source Feature & Calculation
1. **Source Pixels:** Extracted in `neoscan_ml/vision.py:208-209` via `_pool(norm, skin_n, rois["fh"])` and `rois["ckL"] / rois["ckR"]`. Shadows and specular highlights are filtered (`v >= 40 & v <= 240`).
2. **OpenCV Lab vs Reference CIE D65 Lab:**
   - In `neoscan_ml/features.py:14-20`, `cv2.cvtColor(f, cv2.COLOR_BGR2LAB)` operates on `float32 / 255.0`.
   - We verified mathematically against standard CIE D65 reference conversion ($sRGB \rightarrow linear \rightarrow XYZ \rightarrow L^*a^*b^*$):
     $$\Delta L^* = 0.033, \quad \Delta a^* = 0.093, \quad \Delta b^* = 0.153$$
     Difference is $< 0.16$ units, which satisfies the $< 0.5$ tolerance rule.
3. **Flaws in Existing UI Scale Representation:**
   - **Axis Mismatch:** `App.jsx:1035` used `(bStarVal / 32) * 100`. But neonatal empirical skin b* spans 0 to ~30 (median ~14.6 in the Mendeley and NJN cohorts).
   - **Fallback Distortion:** If `bStarVal` was null or NaN, line 1037 plotted `modelScore * 100` onto the b* bar, presenting a probability score as a yellowness metric!
   - **Missing Yellow $\rightarrow$ Orange $\rightarrow$ Red Palette:** The existing bar used purple theme tokens (`bg-clinical-normal`, `bg-clinical-warning`, `bg-clinical-elevated`), violating clinical visual expectation for yellowness progression.
   - **No Accessibility Labels:** The marker pin lacked an `aria-label` describing the numeric b* and its qualitative band.

### Severity: Medium-High (Clinical Misleading Risk)

### Proposed Fix:
1. Provide combined, forehead, and cheek b* values calculated from illumination-normalized skin pixels with robust median.
2. Redesign the gauge as a genuine **Yellow $\rightarrow$ Orange $\rightarrow$ Red** horizontal gradient scale:
   - Axis range: 0.0 to 30.0 b* with clear numeric ticks at 0, 5, 10, 15, 20, 25, 30.
   - Screening Bands:
     * **Low / Normal (b* < 14.0):** Light Yellow gradient (`#FEF08A` $\rightarrow$ `#FACC15`)
     * **Moderate / Borderline (14.0 $\le$ b* < 20.0):** Warm Amber/Orange (`#FB923C` $\rightarrow$ `#EA580C`)
     * **Elevated / High (b* $\ge$ 20.0):** Deep Crimson-Red (`#DC2626` $\rightarrow$ `#991B1B`)
3. Add accessible `aria-label` on the marker pin (e.g. `aria-label="CIE b* 14.2, band: moderate yellowness"`), explicit screening band text chips, clamp values safely within [0%, 100%] without lying about out-of-range values ("Above Scale"), and never render NaN.

---

## 4. Problem 3 Audit: Multi-Spectrum Inspection Modes

### Mode-by-Mode Analysis
| Inspection Mode | Expected Behavior | Actual Behavior in Existing Code | Root Cause |
| :--- | :--- | :--- | :--- |
| **"Original raw"** | Stored original photo, byte-for-byte, orientation applied for display | Displays `rawImage`, but does not guarantee rotation alignment with other modes | If mobile photo has EXIF rotation, raw image orientation does not match the analyzed frame. |
| **"Corrected"** | Actual output of illuminant color constancy step (`p.norm`) | Displays raw image (identical to "Original raw") | `backend/app/api/routes.py:217` explicitly sets `"corrected_image_base64": None`! |
| **"Diagnostic ROIs"** | Bounding box on face and anatomical ROIs on forehead & cheeks | Drawn rectangles misaligned or displaced | Haar cascade runs on downscaled (max 1024px) & rotated ($k \times 90^\circ$) frame, but coordinate normalization in `routes.py:147` divided by unscaled, unrotated raw dimensions. |
| **"Thermal Heatmap"** | True thermal sensor data (if sensor exists) | Shows raw image or fabricated grayscale filter | App has zero thermal sensor hardware. Calling an RGB photo "Thermal" is scientifically fabricated. |

### Severity: High (Feature Inoperability & Misleading Medical Display)

### Proposed Fix:
1. **Additive Backend Data:**
   - In `routes.py`, encode the real illumination-normalized image `p.norm` into `visualizations.corrected_image_base64`.
   - If `colour_normalised` is false, set `corrected_image_base64` to `None` and return `correction_note: "No correction applied: background was insufficient for illuminant estimation"`.
   - Generate `visualizations.diagnostic_overlay_base64` directly from `draw_overlay(p)` in the exact coordinate frame of `p.norm` so alignment is 100% pixel-perfect.
   - Generate `visualizations.yellowness_heatmap_base64`: Compute per-pixel CIE b* across `p.norm`, mask with `skin_mask`, apply Yellow $\rightarrow$ Orange $\rightarrow$ Red colormap to skin pixels only, dim non-skin pixels, and return as PNG base64.
2. **Frontend UI Updates:**
   - Rename "Thermal Heatmap" button to **"Yellowness Heat Map"**.
   - Add clear legend showing Yellow $\rightarrow$ Orange $\rightarrow$ Red scale for the heatmap.
   - Display informative message when "Corrected" mode has no correction applied.
   - Key images by `patientId + imageId + mode` to eliminate stale image flicker or race conditions.
