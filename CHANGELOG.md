# Changelog — NeoScan Triage and Insights Fixes

All notable changes in this release are strictly confined to the three clinical problems on the **Triage and Insights** page (Step 3).

---

## [Unreleased] - Branch: `fix/triage-insights` - 2026-10-30

### 1. Fix 1: Deterministic Clinical Triage Engine
- **Added `backend/app/core/triage_rules.py`**: Pure, side-effect-free clinical triage engine implementing American Academy of Pediatrics (AAP) 2022 Hyperbilirubinemia guidelines.
- **Added `frontend/src/triage.js` & `frontend/src/triageConfig.js`**: Client-side mirror of the triage engine for instant reactivity and explainability.
- **Removed Hardcoded Triage Mapping**: Replaced static fallback that previously forced *"Pediatric consultation recommended"* onto all infant images.
- **Added Demographic Red-Flag Sensitivity**:
  - Automatically escalates early-onset jaundice (< 24 hours postnatal age) to **URGENT EVALUATION** (`#8F1D40`), as early icterus is pathological regardless of visual skin appearance.
  - Automatically escalates preterm (<37 weeks) and feeding-compromised infants.
- **Added Safe Error & Pending States**:
  - When an image fails the quality gate (e.g. no face detected, blurry, poor exposure), the page returns *"Assessment Unavailable (Quality Alert)"* with a *"RETAKE PHOTO"* action.
  - When no image has been screened, displays *"Awaiting Screening Capture"* with zero clinical recommendation.
- **Added Clinical Explainability**: Returns an array of explainable `reasons` detailing the exact model score, measured b\* cutaneous chrominance, lighting reliability caution, and patient demographic risk factors.
- **Added Unit Test Suites**: `tests/test_triage_decision_matrix.py` (10 tests) and `tests/test_frontend_triage.mjs` (7 tests).

### 2. Fix 2: Accurate CIE b\* Yellowness Scale
- **Calibrated Physiological Scale**: Replaced arbitrary 0–32 linear range with an empirically grounded 0.0 to 30.0 b\* scale based on a cohort of 1,238 neonates (25th percentile: 10.7, median: 14.6, 75th percentile: 18.6, 95th percentile: 23.3).
- **Added Yellow $\rightarrow$ Orange $\rightarrow$ Red Continuous Gradient**:
  - Low / Routine: 0.0 to 14.0 b\* (Pale Yellow `#FEF08A` to Golden Yellow `#FBBF24`).
  - Moderate / Borderline: 14.0 to 20.0 b\* (Amber `#F97316`).
  - Elevated / High: 20.0 to 30.0+ b\* (Deep Crimson Red `#DC2626`).
- **Added Numeric Ticks**: Clear visual marks at 0, 5, 10, 15, 20, 25, and 30+.
- **Anatomical Breakdown**: Surfaces Forehead b\*, Cheeks b\*, and Combined median b\* values.
- **Strict Marker Safety**: Marker pin is only rendered when a valid, measured cutaneous b\* value exists; eliminated old fallback that erroneously plotted `modelScore * 100` onto the b\* yellowness bar.
- **Added Colorimetric Test Suite**: `tests/test_bstar_scale.py` validating OpenCV float Lab against reference CIE D65 2-degree observer values on Macbeth patches within $\Delta b^* < 0.16$ (tolerance $< 0.5$).

### 3. Fix 3: Multi-Spectrum Visual Inspection Modes
- **Added Real "Corrected" Mode**:
  - Backend returns genuine illumination-normalized BGR image (`prepared.norm`) as JPEG base64 when background color constancy is applied (`colour_normalised: True`).
  - When background pixels are insufficient for illuminant estimation, returns `None` and displays an amber notice banner: *"No illumination correction applied: Insufficient neutral background to calibrate illuminant"*.
  - Strict prohibition of fake CSS filters (`sepia`, `hue-rotate`, etc.).
- **Fixed "Diagnostic ROIs" Spatial Alignment**:
  - Anatomical forehead and cheek bounding boxes are now scaled against the analyzed image frame dimensions (`w_an`, `h_an`), resolving the 4x top-left shrinkage bug.
  - Generates PNG overlay directly from `draw_overlay(prepared)`.
- **Relabeled and Re-Engineered "Yellowness Heat Map"**:
  - Renamed tab from "Thermal Heatmap" to **"Yellowness Heat Map"** (RGB phone cameras have zero thermal sensitivity).
  - Implemented `backend/app/core/heatmap.py` to compute per-pixel b\* chrominance on segmented skin, rendered using a Yellow $\rightarrow$ Amber $\rightarrow$ Red colormap, with background desaturated to 45% grayscale for anatomical focus.
  - Added matching horizontal colormap legend beneath the viewport.
- **Fixed Image Retake & Flickering**: Keyed viewport with `${patientId}_${imageId}_${mode}` to guarantee immediate update upon rescreening or mode switching.
- **Added Inspection Test Suite**: `tests/test_inspection_modes.py` (verifying all modes, base64 data URIs, and alignment geometry).
