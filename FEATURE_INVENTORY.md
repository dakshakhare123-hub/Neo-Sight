# NeoScan Application Feature Inventory

**Audit Date:** October 29, 2026  
**Environment:** macOS (Localhost:8000), Python 3.13, Node v20, React 18 SPA  
**Branch:** `feat/neoscan-integration`  

This document inventories every user-facing feature, route, API endpoint, component, and data model currently implemented in NeoScan. Every item has been verified against the running application.

---

## 1. User-Facing Frontend Features & Components

| Feature Category | User-Facing Capability | Implementing Component / File | Verification Method |
| :--- | :--- | :--- | :--- |
| **Patient Profile Management** | View default preloaded profiles (Leo, Maya, Noah), view DOB, gestational age, birth weight, and clinical notes. | `frontend/src/App.jsx` (`DEFAULT_PATIENTS`, `activePatientId`, lines 312–409) | Verified via browser UI; persisted in `localStorage["neoscan_patients_store_v3"]`. |
| **Patient Creation & Switching** | Modal dialog to register a new infant profile (Name, DOB, Gestational Age, Birth Weight, Notes) and switch active patient. | `frontend/src/App.jsx` (`handleAddPatient`, `setActivePatientId`, lines 1320–1460) | Tested patient creation; persists across page reloads. |
| **Patient Scan History & Timeline** | Displays historical screening timeline per patient with timestamps, triage badges, thumbnails, and inspection actions. | `frontend/src/App.jsx` (lines 1940–2080) | Past records render cleanly with thumbnail fallbacks. |
| **Multi-Step Screening Wizard** | Intuitive 3-step navigation (Step 1: Patient Profile, Step 2: Capture/Upload, Step 3: Triage & Insights). | `frontend/src/App.jsx` (`currentStep`, Step progress header, lines 880–940) | Smooth forward and backward step transitions verified. |
| **Camera Viewfinder & Live Stream** | Real-time web camera feed with front/environment camera selection and active state controls. | `frontend/src/App.jsx` (`startCamera`, `stopCamera`, `videoRef`, lines 580–680) | Live video stream tested in browser. |
| **Biometric Face Framing Guide** | SVG oval guidance overlay helping clinicians/parents align infant face at optimal focal distance. | `frontend/src/App.jsx` (lines 1480–1540) | Visible on camera viewfinder. |
| **Real-Time Biometric Tracking HUD**| Live bounding box overlays for detected forehead, nose, and cheeks, with distance estimation telemetry. | `frontend/src/App.jsx` (`tracking`, lines 1550–1620) | Displays "Optimal screening distance (~26 cm)" telemetry. |
| **Live Performance Telemetry** | Live FPS meter and frame counter for real-time tracking performance. | `frontend/src/App.jsx` (`liveFps`, `frameCount`, lines 416–417) | Renders dynamically when continuous tracking is enabled. |
| **Image File Upload** | Drag-and-drop or file browser upload for local JPEG/PNG photos. | `frontend/src/App.jsx` (`handleFileUpload`, `fileInputRef`, lines 740–790) | Uploads and decodes correctly into canvas. |
| **Preloaded Clinical Demo Patients**| Quick-select toolbar with verified clinical sample patients (Healthy Daylight, Mild Tungsten, Elevated Overcast, ArUco Card). | `frontend/src/App.jsx` (`handleSelectDemo`, lines 500–530, 1660–1740) | Preloads image and triggers analysis smoothly. |
| **Color Constancy Options** | Dropdown selecting illumination normalization method (`auto`, `card_ccm`, `sclera_wb`, `shades_of_gray`, `gray_world`, `white_patch`, `none`). | `frontend/src/App.jsx` (`correctionMethod`, lines 1760–1810) | Passed to `/api/v1/analyze` payload. |
| **Triage Results Dashboard** | Reassuring, human-centric triage outcome card with category badges and actionable clinical guidance. | `frontend/src/App.jsx` (`risk_assessment`, lines 1020–1180) | Renders triage recommendations and badges. |
| **Multi-Mode Visualizations** | Toggle between `Corrected Image`, `Raw Capture`, `Diagnostic Overlay`, and `Yellowness Heatmap`. | `frontend/src/App.jsx` (`imageCompareMode`, lines 1190–1280) | Base64 PNG visualizations render with image modal viewer. |
| **Clinical Insights Accordion** | Expandable technical panel breaking down optical metrics, CIELAB biomarkers, and model confidence. | `frontend/src/App.jsx` (`clinicalAccordionOpen`, lines 1830–1930) | Accordion expands/collapses smoothly. |
| **Medical Disclaimer Footer** | Persistent clinical safety disclaimer stating NeoScan is a screening adjuvant, not a standalone diagnostic device. | `frontend/src/App.jsx` (lines 2220–2250) | Displayed on every screen. |

---

## 2. Backend API Routes & Services

| Route | HTTP Method | Implementation File | Purpose & Behavior |
| :--- | :---: | :--- | :--- |
| `/api/v1/health` | `GET` | `backend/app/api/routes.py::health_check` | Returns API status, screening engine version, model loaded state, and supported methods. |
| `/api/v1/demo-samples` | `GET` | `backend/app/api/routes.py::list_demo_samples` | Serves metadata and base64 payloads for 4 preloaded clinical test cases. |
| `/api/v1/analyze` | `POST` | `backend/app/api/routes.py::analyze_image` | Decodes image base64, runs quality gate, color correction, ROI segmentation, and classification. |
| `/` | `GET` | `backend/app/main.py::serve_index` | Serves `frontend/index.html`. |
| `/app/*` | `GET` | `backend/app/main.py` (StaticFiles) | Serves compiled `frontend/app.js`, `index.html`, and vendor libraries. |
| `/static/docs/*` | `GET` | `backend/app/main.py` (StaticFiles) | Serves static documentation, charts, and downloadable ArUco cards. |

---

## 3. Data Models & Storage Schema

1. **Client Storage (`localStorage["neoscan_patients_store_v3"]`):**
   ```typescript
   interface PatientStore {
     id: string;                    // e.g. "patient-leo"
     name: string;                  // e.g. "Leo Vance"
     dob: string;                   // ISO date string
     gestationalAgeWeeks: number;   // e.g. 39
     birthWeightKg: number;         // e.g. 3.4
     notes: string;
     avatarUrl?: string;
     records: ScanRecord[];
   }

   interface ScanRecord {
     id: string;                    // unique scan UUID
     timestamp: string;             // ISO timestamp
     imageUri: string;              // Raw capture (base64 data URL)
     correctedImageUri?: string;    // Color-corrected capture (base64 data URL)
     diagnosticOverlayUri?: string; // ROI diagnostic overlay
     heatmapUri?: string;           // Yellowness heatmap
     result: any;                   // Analysis payload
     tracking?: any;                // Real-time tracking telemetry
     quality?: any;                 // Sharpness & exposure metrics
     metadata?: {
       device?: string;
       cameraFacing?: string;
       correctionMethod?: string;
     };
   }
   ```
2. **Server-Side Models:**
   - Stateless REST architecture; image payloads processed in-memory without storing unconsented patient photos on server disk.
