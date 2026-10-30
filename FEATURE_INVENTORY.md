# NeoScan Feature & Architecture Inventory

**Branch:** `feat/mobile`  
**Application**: NeoScan Clinical Pediatric Screening & Image Tracking  
**Audience**: Healthcare professionals, community pediatricians, neonatal nurses, and caregivers  

---

## 1. Screen & Component Inventory

### Screen 1: Patient Profile & Longitudinal Dermal History (`Step 1`)
- **Global Header**:
  - `NeoScanLogo`: Interactive brand vector shield, wordmark, "Pediatric" badge. Navigates to Step 1 (`role="link"`, `tabIndex={0}`).
  - Wizard Navigation Stepper: Step 1 (Patient Profile), Step 2 (Capture & Guidance), Step 3 (Triage & Insights). Labels hidden on mobile viewports (`hidden md:flex`).
- **Sticky Patient Bar (`isScrolled`)**:
  - Appears on vertical scroll. Displays patient initials badge, patient name, ID, age, gestation, and quick-action "Capture Photo" button.
- **Hero Patient Summary Band**:
  - Avatar badge with 2-letter uppercase initials (`style={{ background: "linear-gradient(135deg, #4C2365 0%, #7F5D99 100%)" }}`).
  - Metadata chips: `#patient-id`, `Pediatric Record` with sparkles icon.
  - Headline: Infant Name (`text-2xl sm:text-3xl font-extrabold`).
  - Demographic pills: Age (value + units), Gestational age (full-term / late-preterm / early-preterm), Feeding method (breastfeeding / formula / combination), Total screened photo count.
  - Primary Action Button: "Capture New Photo" (`btn-plum-primary`, navigates to Step 2, initializes camera).
- **Zone A: Main Gallery Column (65% width on desktop)**:
  - *Active Photo Spotlight*:
    * High-resolution display of currently selected infant photo.
    * Real-time outcome status badge overlay ("NO VISIBLE SIGNS", "POSSIBLE JAUNDICE SIGNS", "INCONCLUSIVE").
    * Timestamp and active optical correction indicator.
  - *Spotlight Action Bar*:
    * "View Full Triage Analysis" (navigates to Step 3).
    * "Retake Photo" (navigates to Step 2).
    * "Delete Record" (removes active image from patient history).
  - *Multi-Day Timeline Carousel*:
    * Horizontal scrolling thumbnail tray for all historic images of the active patient.
    * Visual selection indicator (plum border + ring).
    * Version badge (`v2.0` for `neoscan_ml`, `Legacy` for legacy records).
  - *Empty State View*:
    * Displayed when infant has 0 photos. Features camera illustration and "Take First Screening Photo" call-to-action.
- **Zone B: Clinical Sidebar (35% width on desktop)**:
  - *Select Patient Record Card*:
    * List of preloaded / stored infants: Baby Leo, Baby Maya, Baby Sam, Baby Noah.
    * Infant initial badge (dynamic plum active vs lavender inactive).
    * Photo count indicator.
  - *Demographics & Clinical Parameters Card*:
    * Form controls for Age Value (`number`), Age Unit (`hours` / `days`), Gestational Status (`select`), Feeding Method (`select`).
    * Clinical Observations textarea.
    * "Save Changes" button (`updateDemographics`).

---

### Screen 2: Guided Camera & Capture (`Step 2`)
- **Navigation & Mode Selector Bar**:
  - "Back to Patient Profile" button with left arrow icon ($44\times 44\text{px}$ touch target).
  - Patient Context badge ("Screening: [Baby Name]").
  - Capture Mode Switcher: "Live Camera" vs "Upload Image" (`aria-pressed`).
- **Live Camera Viewport Container**:
  - HTML5 `<video ref={videoRef} playsInline muted>` feed.
  - Biometric HUD Canvas Overlay (`trackingCanvasRef`):
    * Dashed oval face/forehead positioning reticle.
    * Anatomical alignment cues.
  - HUD Badges & Overlays:
    * "Optimal screening distance" badge (top-left).
    * Tracking Status indicator ("Tracking Live (X Hz)" vs "Tracking Paused").
  - In-Viewport HUD Control Buttons:
    * "Continuous: ON / PAUSED" toggle.
    * "Framing Guide: ON / OFF" toggle.
    * "Switch Camera" button (switches between rear/environment and front/user camera).
  - *Camera Inactive Fallback Banner*:
    * Displayed if stream is offline or camera permissions are denied.
    * Features "Start Camera" button and "Upload Photo" alternative.
- **Primary Shutter Bar**:
  - "Ready to screen [Baby Name]" status indicator with live plum pulse.
  - Primary Action Button: "Capture & Screen Photo" ($56\times 56\text{px}$ min height, linear plum-violet gradient, aperture ring icon, high-contrast white text).
- **Upload Mode Container**:
  - Drag-and-drop container (`role="button"`, `tabIndex={0}`, keyboard Enter / Space triggers).
  - "Upload Infant Photograph" title, guidance text.
  - "Browse Local Files" button.
  - Hidden `<input type="file" id="infant-photo-file-input" accept="image/*">`.
- **Side Guidance Panel**:
  - *Capture Quality Rules*: Distance (20–30 cm), Indirect Lighting, Clear Landmarks guidance bullets.
  - *Reference Card (Optional)*: Instructions for physical ArUco 4x4 ID 0 calibration card with "Download Printable Target (SVG)" link.
  - *Color Constancy Algorithm Card*: Collapsible accordion with `<label>` and `<select id="optical-method-select">` (Auto / Shades-of-Gray / ArUco Card / Sclera).
- **Error Notice Banner**:
  - Displayed upon camera or API errors. Features error code, clinical message, corrective action, "Retake Photo", and "Dismiss" buttons.

---

### Screen 3: Triage & Insights (`Step 3`)
- **Top Header Bar**:
  - "Back to Capture" navigation button.
  - Patient context indicator.
  - "Retake Photo" secondary action button.
- **Deterministic Triage Recommendation Card**:
  - Severity Level Banner:
    * Red/Crimson (`#8F1D40`): "URGENT PAEDIATRIC REFERRAL REQUIRED" / "PAEDIATRIC CONSULTATION RECOMMENDED"
    * Amber (`#9E5700`): "INCONCLUSIVE — RETAKE ADVISED" / "REVIEW REQUIRED"
    * Green (`#1E6F43`): "ROUTINE NEONATAL OBSERVATION"
  - Clinical rationale bullet list based on age, gestation, $b^*$, and model score.
  - Actionable clinical next steps.
  - Statutory medical disclaimer.
- **Multi-Spectrum Visual Inspection Studio**:
  - 4 Mode Switcher: "Corrected", "Original Raw", "Diagnostic ROIs", "Yellowness Heat Map".
  - High-resolution synchronized canvas/image frame displaying the selected optical layer.
  - Mode clinical purpose explanation (e.g. skin pixel isolation, chromatic distribution).
- **Quantitative Optical Biomarkers Grid**:
  - *Model Risk Score Card*: Probability score (0.00 to 1.00), threshold indicator (0.50), confidence reliability flag.
  - *CIE Lab $b^*$ Yellowness Scale Card*: Forehead $b^*$, Cheek $b^*$, Combined mean, segmented level bar (Low $<14.0$, Moderate $14.0\text{--}20.0$, Elevated $>20.0$).
  - *Bilirubin Index & Chrominance*: Quantitative chromatic indices.
  - *Optical Normalization & Quality Card*: Method applied, sharpness metric, exposure rating.
- **Longitudinal Trendline Card**:
  - Historical trajectory for patients with multiple screenings over time.
- **Action Footer**:
  - "Export Clinical Summary (PDF / Print)".
  - "Return to Patient Profile".

---

### Modals & Global Components
- **Calming Heartbeat Loading Modal**:
  - Full-screen backdrop blur (`fixed inset-0 z-50 bg-plum-950/70`).
  - Animated pulsing plum-violet avatar with heartbeat effect.
  - Dynamic status text ("Evaluating Infant Skin...", "Calibrating optical illumination...").
  - Looping progress bar.
- **Medical Disclaimer Footer**:
  - Persistent regulatory notice.
  - NeoScan brand mark + engine version indicator (`NeoScan v2.0 • neoscan_ml Engine`).

---

## 2. API Endpoints Contract

| Method | Path | Request Body | Response Envelope | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | None | `text/html` | Serves Single Page Web Application |
| `GET` | `/favicon.ico` | None | `image/x-icon` | Browser tab icon |
| `GET` | `/manifest.json` | None | `application/manifest+json` | PWA installation manifest |
| `GET` | `/apple-touch-icon.png` | None | `image/png` | iOS Home Screen bookmark icon |
| `GET` | `/app/*` | None | Static files | Compiled React app (`app.js`, vendor scripts, assets) |
| `GET` | `/static/docs/*` | None | Static files | Printable ArUco calibration targets |
| `GET` | `/api/v1/health` | None | JSON `{status, service, supported_methods}` | Backend health & algorithm probe |
| `GET` | `/api/v1/demo-samples` | None | JSON `{samples: [{id, name, description, image_base64}]}` | Clinical demo cases |
| `POST` | `/api/v1/analyze` | JSON `{image_base64, correction_method, include_visualizations, age_hours, gestation, feeding}` | JSON `{status, category, model_score, reliability, features, visualizations, model_version}` | Full neonatal jaundice screening analysis |

---

## 3. Data Architecture & Persistence

- **Client Storage**: `localStorage` key `neoscan_patients_store_v3` stores JSON array of patient records with embedded images and historical analysis snapshots.
- **Image Data Format**: JPEG data URLs (`data:image/jpeg;base64,...`) captured at $0.95$ quality factor to maintain pixel color integrity without compression artifacts.
- **Analysis Pipeline Flow**:
  1. Image captured from device stream or selected from gallery.
  2. Canvas extracts unmodified pixel data.
  3. Client POSTs base64 payload to `/api/v1/analyze`.
  4. Backend decodes image into NumPy array (BGR).
  5. OpenCV `QualityGate` verifies dimensions ($\ge 240\times 240$), sharpness, and exposure.
  6. `neoscan_ml` vision pipeline performs Haar cascade / face bounding box detection, skin segmentation, and illumination color constancy.
  7. Feature extractor computes 13 optical parameters (CIE Lab $L^*a^*b^*$, YCrCb, color ratios).
  8. SVM model (`Support_Vector_Machine`) evaluates bilirubin risk probability score.
  9. Backend returns structured JSON with category (`no_visible_signs`, `possible_jaundice_signs`, `inconclusive`), score, features, and base64 diagnostic overlays.
  10. Client deterministic triage engine combines model category with infant age and gestational risk factors to render clinical guidance.
