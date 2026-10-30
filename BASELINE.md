# Baseline Safety Net: Triage and Insights Fixes

**Branch:** `fix/triage-insights`  
**Date:** 2026-10-30  
**Scope:** Three clinical bug fixes on Step 3 (Triage and Insights):
1. Triage Recommendation stuck on "Pediatric Consultation Recommended".
2. Inaccurate CIE b* yellowness scale.
3. Broken Multi-Spectrum Visual Inspection modes.

---

## 1. Baseline Test Execution Results

All pre-existing test suites passed before any code modifications:

| Suite | Command | Result | Duration | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Triage Characterisation** | `PYTHONPATH=. python3 tests/test_triage_insights_characterisation.py` | **PASS (4/4)** | 0.635s | Verifies health endpoint, demo samples delivery, healthy sample schema, and typed error handling. |
| **Profile Characterisation** | `PYTHONPATH=. python3 tests/test_profile_characterisation.py` | **PASS (5/5)** | 0.021s | Verifies patient records, demographic editing, and selection logic. |
| **System Characterisation** | `PYTHONPATH=. python3 tests/test_characterisation.py` | **PASS (6/6)** | 0.474s | Verifies bundle integrity, color space transformers, and quality gate. |
| **NeoScan ML Integration** | `PYTHONPATH=. python3 tests/test_neoscan_integration.py` | **PASS (10/10)** | 3.715s | Verifies 422 error gating (tiny, blur, non-face) and real ML prediction outcomes. |
| **ML Pipeline Unit Tests** | `PYTHONPATH=neoscan_ml:backend python3 neoscan_ml/tests/test_pipeline.py` | **PASS (8/8)** | 0.540s | 1 skipped, all active tests pass. |
| **Frontend Build Compilation** | `.tools/node-v20.18.0-darwin-arm64/bin/node frontend/build.cjs` | **PASS** | 0.48s | 121,196 bytes compiled cleanly with zero Babel errors. |

---

## 2. Pre-Fix Defect Baseline

1. **Defect 1 (Triage Recommendation Stuck):**
   - In `frontend/src/App.jsx`, `riskDetails` sets `title = "Pediatric Consultation Recommended"` and `recommendation = ...` whenever `cat.includes("POSSIBLE") || cat.includes("JAUNDICE")`.
   - When an image fails analysis or returns a 422 error, `performAnalysis` fails to clear or update `currentAnalysis`, causing stale results from previous scans to persist.
   - Clinical red flags already present in patient demographic state (`activePatient.ageValue`, `activePatient.gestation`, `activePatient.feeding`) are completely ignored and not factored into the triage recommendation.
2. **Defect 2 (b* Yellowness Scale Inaccurate):**
   - The b* bar hardcodes an arbitrary 0-32 range with linear ticks (50% at 16, 75% at 22) that does not match empirical neonatal skin b* distribution (which spans 0 to ~30 with median ~14).
   - If `bStarVal` is missing, the code silently falls back to plotting `modelScore` (0.0 to 1.0) on a 0-32 scale, causing complete numeric confusion.
   - The bar uses purple/plum theme styling instead of the clinically established and required Yellow $\rightarrow$ Orange $\rightarrow$ Red severity gradient with text labels.
3. **Defect 3 (Multi-Spectrum Modes Broken):**
   - `imageCompareMode === "corrected"`: `routes.py` hardcodes `"corrected_image_base64": None`, so "Corrected" mode ALWAYS falls back to `rawImage` (zero illumination correction visible).
   - `imageCompareMode === "heatmap"`: `routes.py` does not provide `yellowness_heatmap_base64`, so "Thermal Heatmap" falls back to `rawImage`. Furthermore, calling it "Thermal" is medically fabricated as ordinary RGB cameras collect no thermal infrared data.
   - `imageCompareMode === "diagnostic"`: Haar cascade detection operates on downscaled (max 1024px) and rotated ($k \times 90^\circ$) frames, but coordinates in `tracking_rois` divide by original raw image dimensions, resulting in misaligned ROI rectangles.
