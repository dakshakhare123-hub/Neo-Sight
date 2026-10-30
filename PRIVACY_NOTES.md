# NeoScan Pediatric — Privacy, Security & Data Protection Architecture

**Version:** 2.0 (Mobile Clinical Edition)  
**Date:** October 2026  
**Classification:** Confidential Medical Application Architecture

---

## 1. Privacy-by-Design Architecture Overview

NeoScan is built according to **Privacy-by-Design** and **Zero-Trust Clinical Data Architecture** principles. Pediatric health records, infant facial photographs, and hyperbilirubinemia clinical risk assessments constitute sensitive protected health information (PHI) under international regulations (including HIPAA in the US, GDPR in the EU, and clinical data governance guidelines).

### Core Privacy Guarantees
1. **Zero External Data Transmission:** Infant photographs and clinical assessments are strictly processed either locally on-device or against the authenticated institutional NeoScan inference backend. No patient records, images, or telemetry are ever sent to third-party CDNs, analytics trackers, or external cloud services.
2. **Deterministic On-Device Storage:** Patient records and high-resolution clinical images are stored strictly in origin-isolated browser storage (`IndexedDB` and scoped `localStorage`).
3. **No Unencrypted Third-Party Logging:** Model inference, quality gating, and optical calibration execute within private application processes without external logging sinks.

---

## 2. On-Device Storage & Quota Management

### The 5MB Storage Quota Solution
Mobile browsers (Safari on iOS, Chrome on Android, and system WebViews) enforce a strict 5MB quota on `localStorage`. High-resolution smartphone photographs ($1920\times 1080$ or higher) in base64 format consume 1.5MB to 2.5MB per image, causing unhandled `DOMException: QuotaExceededError` crashes within 3 to 4 captures.

### Dual-Storage Architecture (`NeoScanStorage`)
- **Metadata Layer (`localStorage`):** Stores demographic profiles (gestation age, birth time, feeding type, clinical symptoms) and screening history timelines using lightweight JSON references.
- **Binary Image Layer (`IndexedDB`):** High-resolution infant photos, illumination-normalized frames, and diagnostic ROI overlays are stored in an origin-isolated IndexedDB object store (`neoscan_mobile_db`), which supports hundreds of megabytes of local persistent storage without quota exceptions.

---

## 3. Offline Resilience & Queue Architecture

Clinical environments frequently suffer from spotty Wi-Fi and shielded hospital rooms. NeoScan implements an autonomous offline screening queue:

1. **Offline Capture Guarantee:** If a user captures or uploads an infant photo while disconnected (`!navigator.onLine` or network failure), the raw capture is preserved immediately in IndexedDB with an advisory tag (`"pending_upload"`).
2. **Non-Blocking UI:** The caregiver or pediatrician is informed via a reassuring notification: *"Offline Mode: Capture saved securely on device. Analysis will sync automatically when connection restores."*
3. **Automatic Synchronization:** When network connectivity is restored (`window.ononline`), NeoScan's background sync processor dequeues pending captures, transmits them to `/api/v1/analyze`, updates the patient's longitudinal record, and transitions the triage card.

---

## 4. Mobile Privacy & Physical Bystander Protection

Smartphones are handheld devices frequently visible to family members, ward visitors, or bystanders in clinical waiting areas. NeoScan implements two hardware-level privacy protections:

### A. App-Switcher Multitasking Shield
- **Threat:** Mobile operating systems (iOS and Android) capture a screenshot of active applications when switching apps or locking the device, displaying it in the visual app-switcher carousel.
- **Protection:** NeoScan listens to `document.onvisibilitychange`. When the application is hidden or placed in the background, a high-blur privacy veil (`backdrop-blur-2xl`, Deep Plum `#4C2365`) is instantly activated. The OS captures only the privacy shield; patient facial photographs and jaundice diagnoses are never visible in the multitasking tray.

### B. Inactivity Auto-Lock Screen
- **Threat:** Caregivers or clinical staff leaving a smartphone unattended on a table or crib side.
- **Protection:** NeoScan initiates a 15-minute inactivity watchdog timer that resets upon any user interaction (`touchstart`, `mousedown`, `keydown`, `scroll`). When the timer expires, the clinical interface is locked with a "Resume Clinical Session" overlay, requiring an intentional tap to resume.

---

## 5. Optical Constancy & Pixel Integrity

NeoScan strictly adheres to clinical photographic integrity:
- **No Aesthetic Filters:** Never applies brightness adjustments, tinting, contrast enhancement, or compression smoothing before clinical analysis.
- **Pure Geometric EXIF Correction:** Smartphone EXIF orientation metadata (tags 1, 3, 6, 8) is resolved via lossless geometric affine canvas transformation so infants' faces are oriented upright for OpenCV Haar cascades without changing pixel color distributions.
- **D65 Normalization:** Optical color constancy normalizes skin chrominance relative to neutral background references without distorting clinical biomarkers.
