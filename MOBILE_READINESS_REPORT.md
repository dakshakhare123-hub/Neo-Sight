# NeoScan Mobile Readiness Audit & Architectural Report

**Date:** 2026-10-30  
**Engineer:** Senior Mobile & Full-Stack Engineer  
**Scope:** Mobile Architecture Audit, Technical Gap Analysis, and Smartphone Strategy  
**Target Application:** NeoScan Pediatric Neonatal Jaundice Screening  

---

## 1. Executive Summary

NeoScan is an AI-assisted pediatric clinical screening application designed to assess neonatal jaundice using smartphone skin photography and color-calibrated dermatological analysis. 

This audit evaluates the current web application codebase (`frontend/` and `backend/`) against native smartphone platform standards (iOS and Android). The evaluation reveals that while the core clinical logic (`neoscan_ml`, OpenCV quality gates, and deterministic triage) is sound, modular, and functional, **the front-end presentation and camera acquisition layers were built with desktop-first assumptions**. 

Key gaps include:
- Hardcoded relative API endpoints incompatible with native wrappers.
- In-memory `localStorage` JSON storage that will fail due to the browser's 5MB quota after 3–4 photo captures.
- Camera constraints that do not account for smartphone EXIF orientation, low-light torch/flash needs, or background track termination.
- Desktop-oriented navigation and form inputs that trigger automatic iOS zoom-in and notch/home indicator overlap.
- Zero offline resiliency for community health workers operating in low-connectivity clinical environments.

**Recommendation**: Adopt a **two-tier smartphone strategy**:
1. Implement a **Mobile-First Responsive Web App + Installable PWA** (Phases 2–5) preserving 100% of existing React code and zero feature loss.
2. Layer a **Capacitor Native App Shell** (Phase 6) on top of the PWA build to package native Android (`.apk` / `.aab`) and iOS projects with hardware-accelerated camera, filesystem image persistence, and OS-level secure storage.

---

## 2. Section A: Current Architecture Overview

| Architectural Dimension | Current Implementation | Mobile Readiness Assessment |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18.3.1 (loaded via vendor UMD script) | High: React 18 supports dynamic viewports and mobile event delegation. |
| **Build & Compilation** | Babel standalone script (`frontend/build.cjs` -> `frontend/app.js`) | Medium: Single file bundle (`147KB`), zero chunk splitting. Fast to load, but requires inlining components. |
| **Routing & Navigation** | In-component state wizard (`currentStep`: 1, 2, 3) | Medium: Step transitions are fast, but lacks deep-linking, back-button hardware trapping, and URL state. |
| **State Management** | React hooks (`useState`, `useMemo`, `useCallback`, `useRef`) | High: Fast, deterministic, predictable state transitions. |
| **API Transport** | Native browser `fetch()` using relative path `/api/v1/analyze` | Critical Gap: Fails in native mobile wrappers (e.g. `capacitor://localhost`) where relative paths cannot resolve to backend server. |
| **Storage & Persistence** | Browser `localStorage` (`STORAGE_KEY = "neoscan_patients_store_v3"`) | Critical Gap: `localStorage` is synchronous, limited to 5MB–10MB, and insecure for sensitive medical images and patient notes. |
| **Authentication & Auth** | None (public clinical companion session) | Low: Acceptable for clinical bedside kiosk, but mobile apps require at least biometric or session passcode lock. |
| **Model Inference** | Server-side FastAPI (`backend/app/main.py`) executing `neoscan_ml.Analyzer` | High: Offloads heavy OpenCV and NumPy processing from mobile batteries and CPUs; keeps proprietary weights secure. |

---

## 3. Section B: Mobile Technical Gaps & File/Line Audit

### 3.1. Responsive Layout & Viewport Ergonomics
- **Fixed Viewport & Notch Clipping**:
  - [`frontend/index.html:5`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/index.html#L5): `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />`. Lacks `viewport-fit=cover`. On devices with notches or dynamic islands (iPhone X through 16, modern Androids), content is either letterboxed or clips behind hardware cutouts.
  - [`frontend/src/App.jsx:1422`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L1422): Global `<header>` uses `sticky top-0 h-[4.5rem]`. Lacks `padding-top: env(safe-area-inset-top)`. On iOS, the header content collides directly with the status bar clock and battery icons.
  - [`frontend/src/App.jsx:1591`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L1591), [`App.jsx:2382`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L2382): Sticky action bars lack `padding-bottom: env(safe-area-inset-bottom)`, causing primary buttons to overlap the iOS virtual Home Indicator bar.
- **100vh Mobile Browser Bar Jitter**:
  - [`frontend/index.html:150`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/index.html#L150): Body uses `min-h-screen` (`100vh`). In mobile WebKit/Blink, `100vh` ignores URL address bars and bottom toolbars, causing vertical layout jumps when the user scrolls. Must use dynamic viewport units (`100dvh`).
- **Mobile Stepper Invisibility**:
  - [`frontend/src/App.jsx:1442`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L1442): Wizard navigation stepper is marked `hidden md:flex`. On phones (<768px), navigation between steps is invisible to the user except via sequential button clicks.
- **Two-Column Desktop Stacking**:
  - [`frontend/src/App.jsx:1694`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L1694): `grid grid-cols-1 lg:grid-cols-12 gap-6`. In mobile view, Zone B (Sidebar with Patient List and Demographics) is forced below the entire Image Spotlight and Multi-Day Timeline. A user on a phone cannot switch patients without scrolling through multiple screen heights.
- **iOS Automatic Focus Zoom**:
  - [`frontend/src/App.jsx:2040`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L2040): Demographics form `<input>` and `<select>` elements use text classes with font sizes $<16\text{px}$ (`text-xs` = 12px, `text-sm` = 14px). When tapped in iOS Safari, the browser automatically zooms in on the input field, permanently breaking the viewport scale until manually pinched.
- **Mobile Input Mode & Auto-Capitalization**:
  - Age input lacks `inputMode="numeric"` and `pattern="[0-9]*"`, which forces the full alphanumeric keyboard to appear rather than the number pad.
  - Infant name input lacks `autoCapitalize="words"`, `autoCorrect="off"`, and `spellCheck="false"`.

---

### 3.2. Camera & Image Capture
- **Camera Resolution & Constraints Negotiation**:
  - [`frontend/src/App.jsx:814`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L814):
    ```javascript
    const constraints = {
      video: {
        facingMode: cameraFacing,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };
    ```
    On smartphones with non-16:9 native sensors or lower memory budgets, rigid `ideal: 1920x1080` constraints can fail or default to $640\times 480$, degrading clinical $b^*$ chromatic sensitivity.
- **Preview Frame vs Full Sensor Capture**:
  - [`frontend/src/App.jsx:870`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L870): The frame is captured by drawing the `<video>` element onto a canvas (`context.drawImage(video, ...)`). This captures only the screen video preview frame (heavily downscaled and compressed by mobile ISP video codecs), not the smartphone's optical still photo sensor.
- **EXIF Orientation Blindness**:
  - [`frontend/src/App.jsx:1323`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L1323): `handleFileUpload` uses `FileReader.readAsDataURL(file)`. Smartphone photos taken in portrait orientation include EXIF orientation flags (e.g. tag 6, rotate 90° CW). Browsers loading these into an HTML Image element without EXIF parsing display the infant horizontally, causing Haar cascade face detection to fail with `NO_FACE_DETECTED`.
- **Camera Stream Track Leaks**:
  - [`frontend/src/App.jsx:830`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L830): The camera stream is not stopped when the browser tab is hidden or backgrounded (`document.visibilitychange`). The device camera remains active, consuming battery and blocking other apps.
- **HTTPS & Secure Origin Enforcement**:
  - Browsers enforce that `navigator.mediaDevices.getUserMedia` requires a secure context (HTTPS or `localhost`). Testing on a physical smartphone over local Wi-Fi (`http://192.168.x.x:8000`) is blocked by browser security policies unless served over HTTPS or tunneled.
- **Lack of Flash / Torch Support**:
  - In pediatric wards or dim home nurseries, indirect ambient lighting is often low. Web and native camera streams should expose torch controls where hardware permits.

---

### 3.3. Networking & Transport
- **Hardcoded Relative Endpoint**:
  - [`frontend/src/App.jsx:1255`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L1255): `fetch("/api/v1/analyze", ...)`. When deployed inside Capacitor, the origin is `capacitor://localhost` or `file://`. A relative URL fails completely. The app must read `window.NEOSCAN_API_URL` or an environment variable fallback.
- **Base64 Payload Inflation**:
  - Photos are uploaded as base64-encoded strings inside a JSON payload. Base64 encoding introduces a **33% data inflation penalty** (a 4MB photo becomes 5.3MB of ASCII text), increasing upload time on mobile cellular networks.
- **Missing Request Cancellation & Timeouts**:
  - The `fetch()` request has no `AbortController` timeout. On a slow 3G or degraded connection, a hanging upload blocks the UI indefinitely without retrying or failing gracefully.

---

### 3.4. Offline Resiliency & Data Storage
- **The 5MB `localStorage` Quota Crash**:
  - [`frontend/src/App.jsx:730`](file:///Users/dakshakhare/Desktop/Avishkar/frontend/src/App.jsx#L730): `localStorage.setItem(STORAGE_KEY, JSON.stringify(patients))`.
  - Storing high-resolution base64 images inside `localStorage` will hit browser quota limits (typically 5MB on mobile Safari/Chrome) within 3–4 captures, triggering an unhandled `DOMException: QuotaExceededError` that crashes persistence.
  - **Remedy**: Move image binary storage to **IndexedDB** or native device filesystem.
- **No Offline Queue**:
  - If a nurse or parent screens a newborn in an area without internet, the capture fails with `SERVER_COMMUNICATION_ERROR` and the photo is discarded. NeoScan must queue captures locally as `"pending_upload"` and sync automatically when internet connectivity resumes.
- **Missing Service Worker**:
  - `frontend/index.html` has no service worker registration. If the phone loses connection, reloading the app shows the browser's "No Internet" dinosaur screen.

---

### 3.5. Security & Clinical Privacy (Health Data)
- **Plaintext Health Data at Rest**:
  - `localStorage` stores patient name, age, gestational term, feeding status, clinical notes, and infant face photographs in unencrypted plaintext accessible to any script in the domain.
- **App-Switcher Multitasking Exposure**:
  - When switching apps on iOS or Android, the operating system takes a snapshot of the screen for the multitasking carousel. Infant medical photos and identifiers remain clearly visible unless masked on backgrounding.
- **Inactivity Session Lock**:
  - A device left unattended on a clinical cart remains logged in indefinitely. An inactivity auto-lock is required for medical privacy.

---

## 4. Section C: Options Analysis & Platform Recommendation

| Criteria | Option 1: PWA (Mobile Web App) | Option 2: Capacitor Native Wrapper | Option 3: Full React Native / Flutter Rewrite |
| :--- | :--- | :--- | :--- |
| **Feature Parity** | **100% Guaranteed** (Directly uses existing React code) | **100% Guaranteed** (Wraps the verified web build) | High risk of feature loss and subtle regression |
| **Effort & Speed** | Low-Medium (1–2 days) | Medium (1–2 days on top of PWA) | Very High (Weeks to months of re-architecture) |
| **Camera Access** | `getUserMedia` + `<input type=file>` | Native Camera Plugin + Web Fallback | Native Camera APIs |
| **Full Sensor Stills** | Limited to video track resolution | Supported via native camera plugin | Supported |
| **Secure Storage** | IndexedDB with WebCrypto | Native Keychain / EncryptedSharedPreferences | Native Keychain / KeyStore |
| **Distribution** | Instant web link / Home Screen add | Google Play Store & Apple App Store | App Stores only |
| **Offline Support** | Cache API + IndexedDB | Native Filesystem + SQLite/Preferences | Native DB |
| **Maintenance** | Single codebase | Single codebase (web + native config) | Separate mobile codebase |
| **Clinical Risk** | Very Low | Very Low | High (Re-implementing triage, charts, canvas) |

### Formal Recommendation:
Proceed with **Option 1 (Mobile-First Responsive PWA)** as the core foundation, and layer **Option 2 (Capacitor Native Wrapper)** on top. 

This hybrid approach gives healthcare workers the best of both worlds:
1. An instant, zero-install, zero-friction web screening tool accessible on any modern phone via QR code or URL.
2. A robust, secure, hardware-accelerated installable native package for hospital-issued tablets and smartphones with native storage and camera sensor controls.
3. Reject Option 3: rewriting in React Native or Flutter would discard the extensively tested and committed clinical triage, multi-spectrum inspection, and SVG calibration modules.

---

## 5. Section D: Clinical Inference Location (Server vs On-Device)

### Current Architecture: Server-Side Inference
- NeoScan currently executes its optical analysis on a FastAPI server using OpenCV and a scikit-learn Support Vector Machine (`Support_Vector_Machine`).
- **Recommendation**: **Retain server-side inference for this milestone**.
- **Rationale**:
  1. *Model Integrity*: Model weights and calibration matrices remain strictly controlled and versioned on the clinical server (`neoscan_ml-v2.0`).
  2. *Computational Predictability*: Infant skin segmentation and Shades-of-Gray constancy transforms execute uniformly without draining phone batteries or overheating low-end hardware.
  3. *Auditability*: Exact input photos and server-generated heatmaps can be logged to medical audit records.

### Requirements for Future On-Device Inference (Informational Only):
If on-device inference is requested in the future, it would require:
1. Exporting the trained scikit-learn model to **ONNX** format (`onnxruntime-web` or ONNX Runtime Mobile).
2. Porting the OpenCV Python vision pipeline (`HaarCascade` face detection, skin mask extraction, CIE Lab conversion) to WebAssembly (Wasm) or C++ native libraries.
3. Cross-platform validation to guarantee that float precision differences on ARM NEON vs x86 do not alter $b^*$ yellowness bands.

---

## 6. Section E: Clinical & Hardware Risk Matrix

| Risk ID | Description | Clinical Impact | Mitigation in Plan |
| :--- | :--- | :--- | :--- |
| **R-01** | **Camera Sensor & ISP Color Variations**: Different smartphones (e.g. Pixel vs iPhone vs Samsung) apply aggressive proprietary computational photography algorithms (HDR, skin tone smoothing, auto white balance). | Varied color shifts can bias cutaneous $b^*$ bilirubin measurements. | Encourage reference card calibration (ArUco 4x4) and Sclera constancy; record device model and OS metadata with every capture to track sensor variance. |
| **R-02** | **Ambient Lighting Extremes**: Captured images under harsh directional flashlights, tinted hospital blankets, or low light. | Inaccurate yellowness features. | Quality Gate enforces blur and exposure thresholds; client-side pre-check provides real-time "Hold steady / More light" guidance. |
| **R-03** | **Network Disruption During Screening**: Spotty Wi-Fi in remote rural clinics or hospital basements. | Loss of captured image; failed triage. | Implement offline IndexedDB capture queue with auto-retry on reconnect; show clear "Pending Upload" status. |
| **R-04** | **Storage Quota Exceeded on Mobile**: Storing base64 infant photos in `localStorage` crashes the browser. | Loss of historical screening data. | Migrate image binary storage to IndexedDB; preserve metadata in JSON. |
| **R-05** | **Privacy Exposure in App Switcher**: Infant face photo exposed when multitasking. | Sensitive pediatric privacy breach. | Add privacy blur overlay when app is backgrounded (`visibilitychange`). |

---

## 7. Next Step & Execution Roadmap

With Phase 0 (Baseline & Feature Inventory) and Phase 1 (Mobile Readiness Audit) complete and committed, we proceed directly to:
- **Phase 2**: Mobile-First Responsive UI, Safe-Area Insets, and Touch Ergonomics.
- **Phase 3**: Progressive Web App (PWA) Manifest, Service Worker, and App Shell.
- **Phase 4**: Smartphone Camera Integration & Unified Capture Abstraction.
- **Phase 5**: Secure Health Data Storage & Offline Queue.
- **Phase 6**: Capacitor Native Shell Scaffolding.
- **Phase 7**: Comprehensive Mobile Emulation, Device Testing Plan, and Verification.
