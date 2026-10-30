# NeoScan Pediatric — Smartphone Device Verification & Test Plan

**Version:** 2.0 (Mobile Clinical Release)  
**Date:** October 2026  
**Target Environments:**
- **Mobile Web & PWA:** Safari (iOS 16, 17, 18), Google Chrome (Android 12, 13, 14, 15), Samsung Internet.
- **Native Hybrid (Capacitor):** Android APK (API level 24+ / Android 7.0+), iOS App Bundle (.ipa / iOS 15+).

---

## 1. Test Matrix Overview

| Test ID | Category | Feature Under Test | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **MOB-01** | Safe Areas | Notch, Dynamic Island, Home Indicator | Header padded via `env(safe-area-inset-top)`; bottom shutter bar above home indicator (`env(safe-area-inset-bottom)`). No UI clipping. |
| **MOB-02** | Ergonomics | Touch Target Dimensions | Every clickable button, tab, and form input measures $\ge 44 \times 44$ px. Zero overlapping tap targets. |
| **MOB-03** | iOS Forms | Automatic Viewport Zoom | Inputs focused on iPhone have `font-size: 16px !important`; Safari does not zoom in or disrupt viewport centering. |
| **MOB-04** | Camera Perms | Permission Dialog & Prompt | First-time camera access displays system permission dialog. When denied, non-crashing banner guides user to browser settings or photo upload. |
| **MOB-05** | Camera Ladder| Multi-Resolution Ladder Fallback | Camera attempts 1080p, gracefully falls back to 720p or standard constraints without freezing. Rear camera (`environment`) selected by default. |
| **MOB-06** | Camera Flip | Rear $\leftrightarrow$ Front Camera Toggle | Tapping "Switch Camera" flips between selfie and environment camera within $<300$ ms without stream freezing or page reload. |
| **MOB-07** | Live Guidance| Ambient Lighting Assessment | In dark room ($Y < 45$), HUD shows "Low Light: Move to daylight". In bright glare ($Y > 230$), shows "Direct Glare: Angle away". Under normal light, shows "Lighting Good". |
| **MOB-08** | Photo Upload | Smartphone EXIF Orientation | Uploading portrait photos taken with iPhone/Android (EXIF tag 6 / 90° CW) renders upright face. OpenCV face gate succeeds without `NO_FACE_DETECTED`. |
| **MOB-09** | Clinical ML  | Server Inference & Biomarkers | Capturing an infant photo executes `neoscan_ml` inference, populating model score, CIE $b^*$ yellowness marker, and deterministic AAP triage advice. |
| **MOB-10** | Storage Quota| 10+ High-Res Images | Capturing 10 consecutive photos persists images to `IndexedDB` without `DOMException: QuotaExceededError` or application crash. |
| **MOB-11** | Offline Mode | Airplane Mode Screening Queue | Capturing in Airplane Mode preserves photo safely in IndexedDB, showing "Queued Offline". Disabling Airplane Mode automatically syncs and computes results. |
| **MOB-12** | Privacy Blur | Multitasking App Switcher | Swiping up to iOS/Android app switcher displays deep-plum privacy veil (`backdrop-blur-2xl`), concealing infant face and medical data from screenshots. |
| **MOB-13** | Auto-Lock    | 15-Minute Inactivity Screen | Leaving device untouched for 15 minutes presents "Session Locked" shield. Tapping "Resume Clinical Session" unlocks interface. |
| **MOB-14** | PWA Install  | Add to Home Screen | Chrome / Safari displays PWA install pill. Launching from Home Screen runs fullscreen standalone (`display: standalone`) without browser address bar. |

---

## 2. Step-by-Step Test Execution Scripts

### Test Script A: iPhone (iOS Safari & PWA Home Screen)

#### Pre-requisites:
- Physical iPhone (iPhone 12, 13, 14, 15, or SE running iOS 16+)
- Wi-Fi connection to the host computer network, or hosted backend URL (`http://<HOST_IP>:8000`)

#### Steps:
1. Open Safari on iPhone and navigate to `http://<HOST_IP>:8000`.
2. **Verify MOB-01 (Safe Area Insets):**
   - Confirm the NeoScan header does not overlap the Dynamic Island or speaker notch.
   - Confirm the bottom page margin clears the home bar.
3. **Verify MOB-03 (Input Zoom):**
   - Tap "Patient Profile" $\to$ Tap "Infant Full Name" field.
   - Confirm virtual keyboard opens *without* Safari zooming into the page.
4. **Verify MOB-04 & MOB-05 (Camera Access & Rear Priority):**
   - Tap step 2 "Capture & Scan". Tap "Allow" on camera permission prompt.
   - Confirm rear camera activates by default with live 60 FPS biometric face-oval overlay.
5. **Verify MOB-07 (Live Ambient Lighting HUD):**
   - Point phone at a dark corner: check for amber badge *"Low Light: Move to daylight"*.
   - Point phone near a window or daylight lamp: verify green badge *"Lighting Good"*.
6. **Verify MOB-09 (Capture & Clinical Analysis):**
   - Frame infant face (or high-quality demo calibration reference) within the oval guide.
   - Tap the sticky shutter button **"Capture & Screen Photo"**.
   - Observe heartbeat loading modal: *"Assessing ambient lighting & illuminant temperature..."*
   - Verify transition to Step 3 (Triage & Insights):
     * Model Screening Score displayed (e.g. `0.2310` or `0.8740`).
     * CIE $b^*$ Yellowness Scale pin accurately positioned on the yellow-orange-red gradient.
     * Multi-Spectrum Visual Inspection switcher switches between "Corrected", "Original Raw", "Diagnostic ROIs", and "Yellowness Heat Map".
7. **Verify MOB-12 (Multitasking Privacy Shield):**
   - Slowly swipe up from bottom home bar into multitasking app-switcher.
   - Look at the NeoScan tile: confirm it displays the Deep Plum protected privacy screen, hiding the infant's face.
8. **Verify MOB-14 (PWA Standalone Mode):**
   - Tap Safari Share button $\to$ tap **"Add to Home Screen"** $\to$ tap "Add".
   - Open NeoScan icon from iPhone Home Screen.
   - Confirm app launches fullscreen without Safari URL bar or navigation buttons.

---

### Test Script B: Android (Pixel / Samsung Galaxy Chrome & APK)

#### Pre-requisites:
- Android device (Google Pixel, Samsung Galaxy S21/S22/S23, or Android Emulator API 33+)
- Chrome browser or compiled debug APK

#### Steps:
1. Open Google Chrome and navigate to `http://<HOST_IP>:8000`.
2. **Verify MOB-02 (Touch Ergonomics):**
   - Switch between Patient Leo, Patient Maya, and Patient Noah using the fast switcher tray at the top.
   - Confirm buttons have touch feedback and responsive state transitions.
3. **Verify MOB-08 (EXIF Portrait Orientation):**
   - On Step 2, switch to "Upload Photo" mode.
   - Tap "Browse Local Files" and choose a portrait photo from phone gallery.
   - Confirm that the uploaded image is analyzed right side up (forehead at top, cheeks below).
   - Confirm analysis succeeds without `NO_FACE_DETECTED`.
4. **Verify MOB-10 (IndexedDB High-Capacity Storage):**
   - Take or upload 5 photos across different patients.
   - Open Chrome DevTools (remote debugging via `chrome://inspect`).
   - Navigate to **Application $\to$ IndexedDB $\to$ neoscan_mobile_db $\to$ images**.
   - Confirm all 5 image blobs are stored with unique IDs.
   - Navigate to **Local Storage**: confirm patient metadata is intact and storage usage is $<500$ KB.
5. **Verify MOB-11 (Airplane Mode Offline Queue):**
   - Turn on **Airplane Mode** (disable Wi-Fi and mobile data).
   - In NeoScan, tap "Upload Photo", select an image, and tap screen.
   - Verify amber offline banner appears: *"Operating Offline: Infant photo saved securely on device. Analysis will sync automatically when connection restores."*
   - Navigate to Step 1: verify screening card appears with tag *"Screening (Queued Offline)"*.
   - Turn off **Airplane Mode** (re-enable Wi-Fi).
   - Observe automatic sync: within 3 seconds, the queued capture uploads, executes ML inference, and updates with genuine clinical recommendations.

---

## 3. Native Capacitor Shell Verification (Android Studio / Xcode)

### Android Native Build:
```bash
# 1. Compile web assets
npm run build

# 2. Sync to Android project
npx cap sync android

# 3. Open in Android Studio
npm run cap:open:android
```
- Verify in `AndroidManifest.xml`:
  * `<uses-permission android:name="android.permission.CAMERA" />`
  * `<uses-feature android:name="android.hardware.camera" android:required="true" />`
- Run on connected Android device: confirm splash screen shows Deep Plum background (`#4C2365`), status bar matches Deep Plum, and camera permissions prompt natively.

### iOS Native Build:
```bash
# 1. Compile web assets
npm run build

# 2. Sync to iOS project
npx cap sync ios

# 3. Open in Xcode
npm run cap:open:ios
```
- Verify in `Info.plist`:
  * `NSCameraUsageDescription`: *"NeoScan requires camera access to capture calibrated infant skin photographs for neonatal jaundice screening."*
- Run on iPhone or simulator: verify native status bar integration and safe area rendering.
