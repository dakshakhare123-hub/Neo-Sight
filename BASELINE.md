# Pre-Integration System Baseline (`BASELINE.md`)

**Date:** October 29, 2026  
**Branch:** `feat/neoscan-integration` (commit `60f8d00`)  
**OS:** macOS (Darwin arm64)  
**Python Runtime:** Python 3.13.15  
**Node Runtime:** Node v20.18.0 (`.tools/node-v20.18.0-darwin-arm64/bin/node`)  
**Server Target:** FastAPI (`http://127.0.0.1:8000`)  

This baseline document captures the status of tests, builds, and contracts *before* integrating `neoscan_ml`. Any pre-existing behavior or pass/fail state is logged here so that non-analysis features are preserved without regression.

---

## 1. Test Suite Verification Summary

| Test Suite File | Command Executed | Tests Passed | Status | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Non-Analysis Characterisation** | `python3 -m unittest discover -s tests -p "test_characterisation.py"` | 6 / 6 | **PASS** | Validates frontend assets, health check, demo samples catalog, quality gate, color transforms, and patient schema. |
| **Deterministic Screening Suite** | `python3 backend/test_pipeline_honest.py` | 8 / 8 | **PASS** | Quality gate rejections (blur, dark, glare, small, non-skin), healthy vs jaundice differentiation, and demo sample checks. |
| **Trained ML Baseline Suite** | `python3 tests/test_trained_model_pipeline.py` | 5 / 5 | **PASS** | Model artifact integrity, 0% split leakage, live normal/jaundice inference, microscope OOD gating, and health check. |

---

## 2. Frontend Build Baseline

```bash
$ .tools/node-v20.18.0-darwin-arm64/bin/node frontend/build.cjs
[NeoScan Build] Compiled App.jsx -> app.js (101379 bytes) successfully!
```
- **Syntax & Compilation:** 100% clean, 0 errors, 0 warnings.
- **Output Bundle Size:** 101,379 bytes.

---

## 3. API Contract Baseline

- **`GET /api/v1/health`:**
  ```json
  {
    "status": "online",
    "service": "NeoScan Clinical Screening Engine",
    "version": "2.0.0",
    "screening_method": "trained_ml_svm_rbf",
    "ml_model_loaded": true,
    "mediapipe_active": false,
    "supported_methods": [
      "auto", "card_ccm", "sclera_wb", "shades_of_gray",
      "gray_world", "white_patch", "gray_edge", "none"
    ]
  }
  ```
- **`GET /api/v1/demo-samples`:**
  - Returns `{"samples": [...]}` containing 4 clinical cases:
    1. `healthy_daylight` (`baby_healthy_daylight.jpg`)
    2. `moderate_tungsten` (`baby_moderate_tungsten.jpg`)
    3. `severe_overcast` (`baby_severe_overcast.jpg`)
    4. `with_aruco_card` (`baby_with_aruco_card.jpg`)
- **`POST /api/v1/analyze`:**
  - Accepts `AnalyzeRequest` (base64 JPEG/PNG).
  - Returns `risk_assessment`, `tracking`, `quality_gate`, and `visualizations`.

---

## 4. Known Pre-Existing Quirks / Limitations
- OpenCV Haar face cascades may miss angled newborn faces (documented in `neoscan_ml/README.md`).
- Browser permissions for webcam require HTTPS or `localhost` (supported).
- MediaPipe optional dependency not installed in this environment; falls back to robust Haar cascade + skin colorimetry.
