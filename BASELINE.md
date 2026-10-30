# Baseline Status & Safety Net — Capture Labels & NeoScan Logo Fixes

**Branch:** `fix/capture-labels-logo`  
**Base Commit:** `1ff7c91` (`fix/triage-insights` HEAD)  
**Date:** 2026-10-30  
**Status:** ALL TESTS PASSING (59 Total Tests Verified)

---

## 1. Automated Test Baseline

Prior to making any edits on `fix/capture-labels-logo`, all test suites and build tools were executed:

### A. Python Backend & Characterisation Tests
Command: `MPLCONFIGDIR=/tmp python3 -m unittest discover tests`
```
Ran 41 tests in 2.160s: OK
- tests/test_characterisation.py (6/6 pass)
- tests/test_neoscan_integration.py (10/10 pass)
- tests/test_profile_characterisation.py (5/5 pass)
- tests/test_triage_insights_characterisation.py (4/4 pass)
- tests/test_triage_decision_matrix.py (10/10 pass)
- tests/test_bstar_scale.py (5/5 pass)
- tests/test_inspection_modes.py (1/1 pass)
```

### B. NeoScan ML Unit Tests
Command: `MPLCONFIGDIR=/tmp PYTHONPATH=backend python3 -m unittest discover backend/neoscan_ml/tests`
```
Ran 8 tests in 0.364s: OK (skipped=1)
- backend/neoscan_ml/tests/test_pipeline.py (8/8 pass)
```

### C. Node.js Triage Decision Engine Tests
Command: `.tools/node-v20.18.0-darwin-arm64/bin/node tests/test_frontend_triage.mjs`
```
Ran 7 tests in 0.045s: OK
- Error state handling (pass)
- Missing / pending screening state (pass)
- Normal infant routine monitoring (pass)
- Early-onset <24h red flag escalation (pass)
- Possible jaundice signs recommendation (pass)
- Preterm infant risk escalation (pass)
- Inconclusive daylight retake (pass)
```

### D. Capture Screen Characterisation Tests
Command: `MPLCONFIGDIR=/tmp python3 tests/test_capture_controls_characterisation.py`
```
Ran 3 tests in 0.001s: OK
- test_app_bundle_contains_camera_handlers (pass)
- test_app_jsx_defines_capture_state (pass)
- test_reference_card_asset_exists (pass)
```

### E. Frontend Babel Compilation
Command: `.tools/node-v20.18.0-darwin-arm64/bin/node frontend/build.cjs`
```
[NeoScan Build] Compiled App.jsx -> app.js (135759 bytes) successfully!
```

---

## 2. Pre-Existing Defect Inventory (Before Fixes)

### Defect 1: Nameless Capture Controls on Step 2
1. **Back Button (`App.jsx:2052`):** Icon-only (`rotate-180 chevron-right`). Completely lacks visible label, tooltip, and accessible name (`aria-label`). Screen readers announce "button" with zero context.
2. **Flip / Switch Camera Button (`App.jsx:2176`):** Icon-only (`refresh-cw`). Has desktop `title="Flip Camera"`, but **no visible text label**, and no accessible name (`aria-label`). On mobile touchscreens, tooltips are inaccessible.
3. **Continuous Tracking Toggle (`App.jsx:2149`):** Short text `Continuous: ON / PAUSED`, but lacks `aria-pressed`, `aria-label`, and desktop tooltip.
4. **Biometric HUD Overlay Toggle (`App.jsx:2163`):** Short text `HUD On / HUD Off`, but lacks full descriptive text, `aria-pressed`, and `aria-label`.
5. **Primary Shutter Button (`App.jsx:2227`):** Text `Freeze Snapshot & Screen`, lacks explicit `aria-label`, `title`, and focus ring.
6. **File Upload Dropzone (`App.jsx:2193`):** Unlabelled hidden `<input type="file" />`. Outer clickable div lacks `role="button"`, `tabIndex`, and keyboard event handlers.
7. **Color Constancy Algorithm Select (`App.jsx:2333`):** Missing `<label>` element and `id` linking.

### Defect 2: Missing / Empty NeoScan Logo Assets
1. **Global Header:** Uses a generic `<Icon name="heart" />` inside a rounded div; no dedicated brand mark or SVG wordmark asset exists.
2. **Favicon:** No `<link rel="icon">` in `frontend/index.html`. Browsers requesting `/favicon.ico` receive HTTP 404.
3. **Apple Touch Icon:** No `<link rel="apple-touch-icon">` in `frontend/index.html`.
4. **PWA Manifest:** No `/manifest.json` linked or served.
5. **Initial Loading / Splash Screen:** Shows only a plain spinning circle with text; no brand mark.
6. **Git History:** Verification confirmed that no image or vector logo files were ever committed to the repository. A clean, clinical SVG logo mark and wordmark in the purple design system must be created.
