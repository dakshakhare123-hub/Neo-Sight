# Baseline Status & Safety Net — Triage Recommendation Fix

**Branch:** `fix/triage-always-consult`  
**Base Commit:** `8c2f3c6` (Tip of `feat/mobile`)  
**Date:** 2026-10-30  
**Status:** ALL TESTS PASSING (82 Total Tests Verified)

---

## 1. Automated Test Baseline & Regression Safety Net

All test suites and compiler pipelines were executed to establish a strict regression safety net:

### A. Python Backend & Decision Matrix Characterisation Tests
- **Command**: `MPLCONFIGDIR=/tmp python3 -m unittest discover tests`
- **Result**: `Ran 66 tests in 1.135s: OK (66 passed, 0 failures, 0 errors)`
  * `tests/test_characterisation.py` (6/6 pass)
  * `tests/test_mobile_characterisation.py` (7/7 pass)
  * `tests/test_capture_controls_characterisation.py` (8/8 pass)
  * `tests/test_neoscan_integration.py` (10/10 pass)
  * `tests/test_profile_characterisation.py` (5/5 pass)
  * `tests/test_triage_insights_characterisation.py` (4/4 pass)
  * `tests/test_triage_decision_matrix.py` (15/15 pass)
  * `tests/test_bstar_scale.py` (5/5 pass)
  * `tests/test_inspection_modes.py` (1/1 pass)

### B. NeoScan ML Unit Tests
- **Command**: `MPLCONFIGDIR=/tmp PYTHONPATH=backend python3 -m unittest discover backend/neoscan_ml/tests`
- **Result**: `Ran 8 tests in 0.209s: OK (7 passed, 1 skipped as baseline)`
  * `backend/neoscan_ml/tests/test_pipeline.py` (8/8 pass)

### C. Node.js Triage Decision Engine Tests
- **Command**: `.tools/node-v20.18.0-darwin-arm64/bin/node tests/test_frontend_triage.mjs`
- **Result**: `Ran 8 tests in 0.045s: OK (8 passed, 0 failures)`
  * Error state handling
  * Missing / pending screening state
  * Normal infant routine monitoring
  * Early-onset <24h red flag escalation
  * Possible jaundice signs recommendation
  * Preterm infant risk escalation
  * Inconclusive daylight retake
  * Moderate b* (16.5) independence on normal vs jaundiced infants

### D. Production Bundle Compilation
- **Command**: `.tools/node-v20.18.0-darwin-arm64/bin/node frontend/build.cjs`
- **Result**: `[NeoScan Build] Compiled App.jsx -> app.js (179746 bytes) successfully! (0 syntax errors, 0 Babel warnings)`

---

## 2. Pre-Existing Limitations & Scope Boundaries

1. **Localhost HTTP Binding**: The backend FastAPI server binds to `127.0.0.1:8000`. On a physical phone, `127.0.0.1` refers to the mobile device itself; network-accessible or environment-variable base URL configuration (`NEOSCAN_API_URL`) is required for smartphone access.
2. **Camera Sensor & Browser Security**: In modern browsers (Safari iOS, Chrome Android), `navigator.mediaDevices.getUserMedia` is strictly blocked over plain `http://` on non-localhost origins. PWA / mobile testing requires HTTPS or local secure context tunneling.
3. **In-Memory Local Storage**: Patient data is currently persisted to browser `localStorage` (`neoscan_patients_store_v3`). For a clinical native smartphone app, sensitive patient health records require hardware-backed encryption or secure storage.
4. **Desktop Layout Assumptions**:
   - Step 1 uses a 12-column grid (`grid-cols-1 lg:grid-cols-12`) where Zone A is 8 columns and Zone B is 4 columns. On small viewports (<640px), sidebar and patient cards stack vertically, but fixed margins and lack of safe-area inset handling cause overflow on notched mobile devices.
   - Step 2 camera view uses fixed aspect ratio containers and desktop-oriented floating toolbars.
   - Stepper header (`max-w-6xl h-[4.5rem]`) hides wizard labels on small screens (`hidden md:flex`), leaving only the header title.
