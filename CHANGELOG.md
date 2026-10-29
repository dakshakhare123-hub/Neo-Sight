# NeoScan Changelog

## [2.1.0] - 2026-10-29 — Safe `neoscan_ml` Engine Integration

### Added
- **`backend/neoscan_ml/` Package:**
  - `vision.py`: Complete image decoding, quality gating (blur Laplacian $\ge 12.0$, exposure $[40, 220]$, clipping $< 25\%$), Haar cascade face gating with infant-calibrated parameters (`scaleFactor=1.08`, `minNeighbors=3`, `FACE_MIN_FRAC=0.12`, `FACE_MIN_SKIN_FRAC=0.25`), and background Shades-of-Gray color normalisation.
  - `features.py`: Robust chromaticity feature extraction ($L^*, a^*, b^*$, yellowness index $YI$, $Cr, Cb$, and ratios) across forehead and cheek ROIs.
  - `predict.py`: Real `Analyzer` module with strict output contract (`no_visible_signs`, `possible_jaundice_signs`, `inconclusive`), raw model scores, reliability indicators, and diagnostic overlays.
  - `errors.py`: Typed `AnalysisError` exception class with standardized machine-readable codes and parent-friendly action hints.
- **Offline Training Tooling (`neoscan_ml/`):**
  - `prepare_manifest.py`: Automates grouping by perceptual hash to prevent infant data leakage across splits.
  - `train.py`: Trains 5 competing scikit-learn models using 5-fold infant `GroupKFold`, held-out evaluation, and a label-shuffle control test. Produced real model bundle at `models/model.joblib`.
- **Backend Configuration & Error Mapping:**
  - Added `NeoScanMLConfig` to `backend/app/config.py` controlled by `NEOSCAN_ENABLED` (default `True`) and `NEOSCAN_MODEL` (default `models/model.joblib`).
  - Added typed error translation in `backend/app/api/routes.py`:
    - HTTP 413 for payloads $> 15\text{MB}$ (`FILE_TOO_LARGE`).
    - HTTP 422 for gate failures (`NO_FACE_DETECTED`, `IMAGE_TOO_BLURRY`, `POOR_EXPOSURE`, `IMAGE_TOO_SMALL`, `UNREADABLE_IMAGE`, `SKIN_REGION_TOO_SMALL`).
    - HTTP 503 for missing or unreadable model files (`MODEL_UNAVAILABLE`).
  - Added new `/api/v1/analyze/file` multipart/form-data endpoint matching reference `neoscan_ml` API.
  - Updated `/api/v1/health` with `neoscan_enabled`, `screening_method`, and `ml_model_loaded` metadata.
- **Frontend Enhancements (`frontend/src/App.jsx`):**
  - **Retake Photo Button:** Direct one-click camera reactivate button in error banner.
  - **Honest Model Score Presentation:** Hero results card renders `model_score` strictly as a model score (e.g. `0.8084`) with clear screening cutoff, preventing false impressions of invasive lab bilirubin measurements.
  - **Reduced Reliability Warnings:** Alerts parents and clinicians when optical criteria are borderline.
  - **Diagnostic ROI Overlay:** Live anatomical landmark visualization connected in Multi-Spectrum Viewport.
  - **Legacy Pre-v2.0 Badges:** Past historical patient scans without ML scores are labeled as `Legacy Pre-v2.0` without deleting or corrupting historical records.
- **Automated Test Suites:**
  - `tests/test_characterisation.py`: Verifies all pre-existing baseline behaviors.
  - `tests/test_neoscan_integration.py`: 10 comprehensive end-to-end API integration tests.

### Changed
- Refactored `backend/app/api/routes.py::analyze_image` to route through the real `neoscan_ml` Analyzer when `NEOSCAN_ENABLED=true`.
- Added thread-safe locking around OpenCV Haar cascade multi-scale detection to protect against multi-worker race conditions.
- Updated `.gitignore` to exclude raw dataset directories, intermediate test plots, and heavy zip archives.

### Preserved
- Unchanged patient profile data store and schema.
- Unchanged multi-correction strategy switcher (ArUco card, Sclera WB, Shades-of-Gray).
- Unchanged printable clinical report generation.
- Unchanged real-time 60 FPS face guidance HUD.
