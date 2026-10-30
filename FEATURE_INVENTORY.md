# Feature Inventory — Capture Screen Controls & Brand Logo Locations

**Branch:** `fix/capture-labels-logo`  
**Date:** 2026-10-30  
**Status:** COMPLETE AUDIT

---

## 1. Inventory of Interactive Controls on Step 2 (Capture & Guidance)

| # | Control Name | DOM Element / Ref | Current Label / Appearance | Current Accessible Name (`aria-label` / `title`) | Missing / Defective Properties | Target Fix |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Back to Profile** | `<button onClick={() => setCurrentStep(1)}>` | Icon only: `rotate-180 chevron-right` | None | No visible text, no `aria-label`, no `title`. Screen readers announce "button" with no name. | Add visible text label "Back", `title="Back to Patient Profile"`, `aria-label="Back to Patient Profile"`, $\ge 44\times 44$px touch target. |
| **2** | **Mode: Live Camera** | `<button onClick={() => setCaptureMode("camera")}>` | Icon (`camera`) + "Live Camera" | None | Missing `aria-pressed`, missing `title`, missing focus ring. | Add `aria-pressed={captureMode === "camera"}`, `title="Switch to live camera capture"`, visible focus ring. |
| **3** | **Mode: Upload Photo** | `<button onClick={() => setCaptureMode("upload")}>` | Icon (`upload`) + "Upload Photo" | None | Missing `aria-pressed`, missing `title`, missing focus ring. | Add `aria-pressed={captureMode === "upload"}`, `title="Switch to local photo upload"`, visible focus ring. |
| **4** | **Continuous Stream Toggle** | `<button onClick={() => setContinuousAnalysis(!continuousAnalysis)}>` | Icon (`zap`) + "Continuous: ON / PAUSED" | None | Cryptic label; lacks `aria-pressed`, `aria-label`, and explanatory tooltip. | Add `aria-label="Toggle continuous background tracking analysis"`, `aria-pressed={continuousAnalysis}`, `title="Toggle continuous streaming analysis"`. |
| **5** | **Framing HUD Guide Toggle** | `<button onClick={() => setShowBiometricOverlay(!showBiometricOverlay)}>` | Icon (`eye`) + "HUD On / HUD Off" | None | Lacks full descriptive label, missing `aria-pressed`, missing `aria-label`. | Add clear visible text "Framing Guide: On / Off", `aria-label="Toggle biometric framing guide overlay"`, `aria-pressed={showBiometricOverlay}`, `title="Toggle anatomical alignment guide"`. |
| **6** | **Switch Camera** | `<button onClick={toggleCameraFacing}>` | Icon only: `refresh-cw` | `title="Flip Camera"` | **Icon-only button!** No visible text label. Missing `aria-label`. Tooltip inaccessible on mobile devices. | Add visible text label "Switch Camera", `aria-label={`Switch camera (currently ${cameraFacing === "user" ? "front" : "rear"})`}`, `title="Switch between front and rear cameras"`, $\ge 44\times 44$px target. |
| **7** | **Primary Shutter** | `<button onClick={() => performAnalysis(captureFrame())}>` | Concentric circles + "Freeze Snapshot & Screen" | None | Missing `aria-label`, missing `title`, missing prominent accessible focus ring. | Maintain prominent gradient design; add `aria-label="Capture photograph and start clinical screening analysis"`, `title="Capture and analyze photograph"`, high-contrast focus ring. |
| **8** | **Upload Dropzone** | `<div onClick={() => fileInputRef.current?.click()}>` | Icon (`upload`) + "Upload Infant Photograph" | None | Not keyboard operable (no `role="button"`, no `tabIndex="0"`, no Enter/Space handler). | Add `role="button"`, `tabIndex="0"`, `onKeyDown` handler, `aria-label="Upload infant photograph for screening"`. |
| **9** | **Hidden File Input** | `<input ref={fileInputRef} type="file">` | Hidden input | None | Lacks `id`, lacks `aria-label`. | Add `id="infant-photo-file-input"`, `aria-label="Choose infant photograph file from device"`. |
| **10**| **Download Printable Card** | `<a href="/api/v1/reference-card" target="_blank">` | Text: "Download Printable Card" + arrow | None | Missing open-in-new-tab accessibility notice. | Add `aria-label="Download printable ArUco calibration reference card (opens in a new tab)"`, `title="Download printable ArUco calibration card"`. |
| **11**| **Color Constancy Accordion** | `<button onClick={() => setAdvancedOpticalOpen(...)}>` | Icon (`sliders`) + "Color Constancy Algorithm" | None | Missing `aria-expanded`, missing `aria-controls`. | Add `aria-expanded={advancedOpticalOpen}`, `aria-controls="optical-method-select"`, `title="Toggle color constancy options"`. |
| **12**| **Color Constancy Select** | `<select value={correctionMethod}>` | Native dropdown select | None | Unlabelled form control! No `<label>` or `id`. | Add `<label htmlFor="optical-method-select" className="sr-only">Color Constancy Algorithm</label>`, `id="optical-method-select"`, `aria-label="Select color constancy normalization method"`. |
| **13**| **Retake Photo (in Error Banner)** | `<button onClick={() => { setError(null); setCurrentStep(2); }}>` | Icon (`camera`) + "Retake Photo" | None | Lacks `aria-label` and `title`. | Add `aria-label="Dismiss error and retake infant photograph"`, `title="Retake screening photo"`. |
| **14**| **Dismiss (in Error Banner)** | `<button onClick={() => setError(null)}>` | Text: "Dismiss" | None | Lacks `aria-label` and `title`. | Add `aria-label="Dismiss this error banner"`, `title="Dismiss notice"`. |
| **15**| **Close (in Error Banner)** | `<button onClick={() => setError(null)}>` | Icon only: `x` | `title="Dismiss"` | Lacks `aria-label`. | Add `aria-label="Close error alert"`. |

---

## 2. Inventory of Brand Identity & Logo Locations

| Location | Component / File | Current Implementation | Defect Analysis | Target Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Global Navigation Header** | `frontend/src/App.jsx:1342` | Gradient rounded div with `<Icon name="heart" />` + text "NeoScan" | Generic heart icon, not an authentic medical imaging brand mark. Lacks SVG asset fallback and explicit accessibility label. | Implement dedicated `NeoScanLogo` component featuring the authentic optical shield brand mark, wordmark, `alt="NeoScan Pediatric Screening"`, and text fallback. |
| **Browser Tab Favicon** | `frontend/index.html` | None. Browser requests `/favicon.ico` $\rightarrow$ 404 Not Found. | Tab icon is blank/empty across Chrome, Safari, Firefox. | Add scalable `favicon.svg` and `favicon.ico` in the Deep Plum & Violet palette. Link in `index.html` `<head>`. Serve via FastAPI. |
| **Apple Touch Icon** | `frontend/index.html` | None. Missing from `<head>`. | Blank icon when saved to iOS / iPadOS home screen. | Add high-resolution `apple-touch-icon.png` (180x180) and link in `<head>`. |
| **PWA Web App Manifest** | `frontend/index.html` | None. No manifest file exists. | Missing PWA install metadata, theme color, and mobile splash icon. | Add `manifest.json` with theme color `#4C2365`, background `#F7F3FA`, and icons. Link via `<link rel="manifest">`. |
| **Initial Loading / Splash** | `frontend/index.html:140` | Plain CSS spinning circle with text. | No brand mark or visual logo shown during pre-hydration loading. | Integrate the SVG brand logo mark directly above the spinner in `index.html`. |
| **Sticky Condensed Header** | `frontend/src/App.jsx:1515` | Avatar initials "BL" + patient name. | No home/brand anchor in condensed view. | Ensure brand identity remains clear and accessible. |
