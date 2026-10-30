# NeoScan Feature Inventory (`FEATURE_INVENTORY.md`)

**Date:** October 30, 2026  
**Application:** NeoScan — Intelligent Neonatal Bilirubin Screening  
**Verification Method:** Static code analysis, test execution, and live runtime verification on `http://127.0.0.1:8000`  

---

## 1. User-Facing Screens & Stepped Wizard Routes

| Step / Route | Component / Container | User-Facing Features | Interactive Elements |
| :--- | :--- | :--- | :--- |
| **Top Global Header** | `<header>` lines 1070–1165 in `App.jsx` | Brand Logo (`NeoScan Pediatric`), Stepped Navigation Pills (`1. Patient Profile`, `2. Capture & Guidance`, `3. Triage & Insights`), Mobile Step Progress Bar | Step navigation clicks (`setCurrentStep(1\|2\|3)`) |
| **Step 1: Patient Profile** | Step 1 container lines 1225–1440 | Infant demographic switcher, active patient summary card, preloaded clinical demo patient catalog | Patient switcher tabs, "New Infant Record" button, "Edit Profile" button, 4 demo sample load buttons |
| **Step 2: Capture & Guidance** | Step 2 container lines 1445–1780 | Camera live viewfinder, 60 FPS face guidance HUD canvas, camera controls, manual photo upload drag/drop zone, illumination strategy selector accordion | "Live Camera" vs "Photo Upload" tabs, "Capture Photo" shutter, "Switch Camera" (user/environment), "Stop Camera", "Color Constancy Algorithm" dropdown |
| **Step 3: Triage & Insights** | Step 3 container lines 1785–2280 | Hero Triage Card, Calibrated Risk Gauge, Parent Care Checklist, Multi-Spectrum Viewport, Technical Insights Deep Dive Accordion, Longitudinal History Timeline Strip | "Rescreen / Retake" button, "Export Report" print button, Viewport mode tabs ("Corrected", "Raw", "Diagnostic ROIs", "Thermal Heatmap"), Technical Sub-tabs ("Optical", "Biometric ROIs", "Model & Quality"), Timeline frame clicks |

---

## 2. Interactive Modals & Notification Banners

| Modal / Banner | Trigger Condition | Visual Content | Actions |
| :--- | :--- | :--- | :--- |
| **Quality Gate Error Banner** | `error !== null` (lines 1184–1222) | Warning icon, error title, message, actionable guidance box | "Retake Photo" (clears error, switches to step 2, activates camera), "Dismiss" button |
| **Add / Edit Infant Modal** | `modalOpen === true` (lines 1250–1330) | Infant name, age value & unit, gestation weeks, birth weight, notes | "Cancel" button, "Save Record" button |
| **Heartbeat Loading Modal** | `loading === true` (lines 2282–2315) | Pulsing heartbeat icon, animated pulse ring, rotating progress bar, multi-stage status text | Background backdrop overlay (non-interactive, self-dismisses on response) |
| **Medical Disclaimer Footer** | Always present (lines 2318–2329) | Clinical screening disclaimer text, version badge | Informational text |

---

## 3. Backend API Endpoints (`backend/app/api/routes.py`)

| Endpoint | Method | Input | Output Contract | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/health` | `GET` | None | `{status: "online", screening_method: "neoscan_ml", neoscan_enabled: true, ml_model_loaded: true, ...}` | Verified (HTTP 200) |
| `/api/v1/demo-samples` | `GET` | None | `{"samples": [4 clinical demo cases with base64 data URLs]}` | Verified (HTTP 200) |
| `/api/v1/analyze` | `POST` | `{"image_base64": "..."}` | `{category, model_score, reliability, risk_assessment, tracking, visualizations, ...}` | Verified (HTTP 200 / 413 / 422 / 503) |
| `/api/v1/analyze/file` | `POST` | Multipart `file` | Equivalent to `/analyze` | Verified (HTTP 200) |

---

## 4. Optical & Machine Learning Engine

- **Quality & Face Gate:** OpenCV Haar cascades + YCrCb/HSV skin mask check. Rejects non-faces, blur, extreme exposure.
- **Color Normalization:** Shades-of-Gray background normalization + optional ArUco Card CCM and Sclera WB.
- **Classification Engine:** `HistGradientBoostingClassifier` trained on NJN dataset (`models/model.joblib`), evaluating forehead and cheek ROIs with zero infant leakage.
- **Outputs:** Three honest clinical categories (`no_visible_signs`, `possible_jaundice_signs`, `inconclusive`), raw model score, reliability indicator, diagnostic visualizer overlay.
