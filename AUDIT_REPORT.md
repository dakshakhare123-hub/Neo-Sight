# Audit Report — Capture Controls & NeoScan Logo Root Causes

**Branch:** `fix/capture-labels-logo`  
**Date:** 2026-10-30  
**Authors:** Senior Front-End Engineer & Accessibility Specialist  

---

## Part A: Capture Controls Accessibility Audit

### 1. Root Cause Analysis
An exhaustive code inspection of Step 2 (`frontend/src/App.jsx:2045-2350`) revealed multiple contributing factors for nameless controls:

1. **Icon-Only Buttons Without Accessible Names:**
   - **Back Navigation Button (`App.jsx:2052`):** Renders only `<Icon name="chevron-right" className="rotate-180" />` with zero text content, zero `aria-label`, and zero `title`. In the accessibility tree, it appears as an anonymous `button` without an accessible name.
   - **Switch Camera Button (`App.jsx:2176`):** Renders only `<Icon name="refresh-cw" />`. While it possesses a desktop `title="Flip Camera"`, it has **no visible text label**. On mobile touch devices, HTML `title` attributes do not trigger on tap, rendering the control entirely nameless to smartphone users. Furthermore, it lacks an `aria-label`.
   - **Alert Dismiss Button (`App.jsx:1498`):** Renders only `<Icon name="x" />` without an accessible name.

2. **Form Controls Missing Accessible Labels:**
   - **File Upload Input (`App.jsx:2206`):** `<input ref={fileInputRef} type="file" className="hidden" />` has neither an `id`, an associated `<label>`, nor an `aria-label`.
   - **Color Constancy `<select>` (`App.jsx:2333`):** The dropdown selector lacks an associated `<label for="...">` or `aria-label`. Screen readers announce "combobox" without announcing its purpose.

3. **Inaccessible Clickable Containers:**
   - **File Upload Dropzone Card (`App.jsx:2193`):** The drag-and-drop card uses an `onClick` on a `<div>`. It lacks `role="button"`, `tabIndex="0"`, and keyboard handlers (`onKeyDown` for Enter / Space), preventing keyboard-only users from selecting a file.

4. **Missing State Semantics for Toggle Controls:**
   - **Mode Switchers ("Live Camera" vs "Upload Photo"):** Render as plain buttons without `aria-pressed` or `role="tab"` / `aria-selected` attributes.
   - **Continuous Stream Toggle (`App.jsx:2149`):** Uses an ambiguous shorthand text `"Continuous: ON / PAUSED"` without `aria-pressed`, `aria-label`, or explanatory tooltip.
   - **Biometric HUD Overlay Toggle (`App.jsx:2163`):** Uses cryptic text `"HUD On / HUD Off"` without full descriptive naming or `aria-pressed`.

### 2. Control Audit Table

| Control | DOM Location | Current Accessible Name | Root Cause | Proposed Fix |
| :--- | :--- | :--- | :--- | :--- |
| **Back Button** | `App.jsx:2052` | `""` (Empty) | Icon-only button with no text or ARIA attributes | Add visible label "Back", `aria-label="Back to Patient Profile"`, `title="Back to Patient Profile"`, $\ge 44\times 44$px touch area. |
| **Switch Camera** | `App.jsx:2176` | `"Flip Camera"` (from title only) | Icon-only button with no visible text; inaccessible on touchscreens | Add visible label "Switch Camera", `aria-label="Switch camera (currently using front/rear)"`, dynamic tooltip. |
| **Continuous Toggle** | `App.jsx:2149` | `"Continuous: ON"` | Cryptic shorthand; missing toggle state semantics | Add `aria-label="Toggle continuous background tracking analysis"`, `aria-pressed={continuousAnalysis}`, full title. |
| **HUD Guide Toggle** | `App.jsx:2163` | `"HUD On"` | Cryptic acronym; missing toggle state semantics | Add visible label "Framing Guide: On / Off", `aria-label="Toggle biometric framing guide overlay"`, `aria-pressed`. |
| **Primary Shutter** | `App.jsx:2227` | `"Freeze Snapshot & Screen"` | Missing explicit `aria-label`, focus ring, and tooltip | Add `aria-label="Capture photograph and start clinical screening analysis"`, `title="Capture and analyze"`, high-contrast focus ring. |
| **File Dropzone** | `App.jsx:2193` | None (`<div>`) | Non-semantic clickable `div` lacking keyboard focus and semantics | Add `role="button"`, `tabIndex="0"`, `onKeyDown` (Enter/Space), `aria-label="Upload infant photograph for screening"`. |
| **File Input** | `App.jsx:2206` | None | Hidden input lacking `id` and `aria-label` | Add `id="infant-photo-file-input"`, `aria-label="Select infant photograph file"`. |
| **Constancy Select** | `App.jsx:2333` | None | Unlabelled `<select>` element | Add `<label htmlFor="optical-method-select" className="sr-only">Color Constancy Algorithm</label>`, `id`, and `aria-label`. |

---

## Part B: Brand Identity & Logo Audit

### 1. Root Cause Analysis
An extensive audit of the filesystem, git history (`git log --all`), and HTML markup revealed:

1. **No Original Logo Asset Ever Existed in Repository:**
   - Git log from initial commit (`97139bc6`) to present confirmed that zero logo vector or raster image files were ever committed.
   - The original code simply rendered an Lucide `<Icon name="eye" />` in a blue gradient box, which was later changed to `<Icon name="heart" />` in a plum gradient box.

2. **Missing Favicon and Web Application Manifest:**
   - `frontend/index.html` contained no `<link rel="icon">`, `<link rel="alternate icon">`, `<link rel="apple-touch-icon">`, or `<link rel="manifest">`.
   - Browsers attempting to load `/favicon.ico` received an HTTP 404 from FastAPI, causing the browser tab icon to appear blank.

3. **Pre-Hydration Splash Screen Unbranded:**
   - The initial loading state in `index.html:140-150` rendered only a CSS spinning ring with text; no brand mark or graphic identity was present.

4. **Missing Dedicated SVG Logo Component:**
   - The product identity in the header relied on a generic heart icon. There was no dedicated, scalable brand mark symbolizing medical vision, optical calibration, and neonatal care.

### 2. Proposed Logo Solution
1. **Design Authentic SVG Brand Assets:**
   - Create a clean, clinical vector logo mark (`logo-mark.svg`) combining an infant protective shield with an optical aperture and bilirubin screening spectral rays in the Deep Plum (`#4C2365`), Violet (`#7F5D99`), and Lavender (`#C4A4DA`) palette.
   - Create a complete brand mark + wordmark asset (`logo.svg`).
   - Create light/dark variants with transparent backgrounds and explicit viewBox (`0 0 200 48` and `0 0 48 48`).
2. **Favicon & PWA Suite:**
   - Create scalable `favicon.svg` and multi-size `favicon.ico`.
   - Create `apple-touch-icon.png` and PWA `manifest.json`.
   - Link all assets in `frontend/index.html`.
   - Serve `/favicon.ico` and `/manifest.json` via dedicated FastAPI endpoints to eliminate 404s.
3. **Robust React Component (`NeoScanLogo`):**
   - Inline SVG brand mark with explicit `width`, `height`, `viewBox`, `alt="NeoScan"`, and fallback text.
   - Embed the brand mark into the initial splash screen in `index.html`.
