# Changelog — Capture Controls Accessibility & Brand Assets

All notable changes to the capture controls, accessible names, logo, and icons on branch `fix/capture-labels-logo`.

## [Unreleased] - 2026-10-30

### Added
- **Brand Identity Suite**:
  - `frontend/assets/logo-mark.svg`: 48×48 standalone SVG brand mark featuring a clinical purple shield, iris reticle, and amber core.
  - `frontend/assets/logo.svg`: 200×48 horizontal brand logo with "NeoScan" wordmark and "PEDIATRIC" badge.
  - `frontend/assets/logo-light.svg`: High-contrast logo variant for dark backgrounds.
  - `frontend/favicon.svg`: Scalable SVG browser tab icon.
  - `frontend/favicon.ico`: Multi-size (16×16, 32×32, 48×48) ICO file for legacy browser support.
  - `frontend/apple-touch-icon.png`: 180×180 PNG icon for iOS Home Screen bookmarking.
  - `frontend/icon-192.png` & `frontend/icon-512.png`: PNG launcher icons for Progressive Web App (PWA) installation.
  - `frontend/manifest.json`: Web App Manifest defining app name, icons, and theme color `#4C2365`.
- **Pre-Hydration Splash Screen**:
  - Embedded vector brand mark in `frontend/index.html` within `#root`, displaying the NeoScan logo during initial JavaScript bundle load.
- **FastAPI Asset Endpoints**:
  - Route handlers in `backend/app/main.py` for `/favicon.ico`, `/manifest.json`, `/apple-touch-icon.png`, and `/apple-touch-icon-precomposed.png` supporting GET and HEAD requests.
- **Accessible Capture Control Names**:
  - Visible text labels, dynamic `aria-label`, and `title` tooltips for all Step 2 interactive controls (Back, Switch Camera, Live Camera / Upload Image tabs, Continuous Streaming toggle, Biometric Framing Guide toggle, Primary Shutter, File Dropzone, and Error Banner actions).
  - Explicit `<label>` and ARIA relationship attributes for the color constancy algorithm select element.
  - In-viewport action buttons ("Start Camera", "Upload Photo") for camera-inactive states.

### Changed
- **Global Header**:
  - Replaced the placeholder heart icon with the dedicated `NeoScanLogo` component rendering the brand shield mark, "NeoScan" wordmark, and "Pediatric" badge.
  - Added keyboard navigation (`tabIndex={0}`, Enter / Space triggers) and accessible label `aria-label="NeoScan Pediatric Screening home (go to Patient Profile)"`.
- **Footer**:
  - Added compact vector `NeoScanLogo` mark beside the engine version indicator.
- **Capture Touch Targets**:
  - Standardized all buttons to minimum $44 \times 44\text{px}$ touch targets with visible focus rings for keyboard accessibility.

### Fixed
- **Empty Logo & Favicon 404**:
  - Resolved missing favicon and blank brand placeholder by provisioning genuine brand vector assets and adding `<link rel="icon">`, `<link rel="apple-touch-icon">`, and `<link rel="manifest">` tags in `frontend/index.html`.
- **Nameless Capture Controls**:
  - Resolved missing button labels and screen-reader names across the camera capture screen.
- **Invisible Button Labels & Patient Avatar Initials**:
  - Fixed root cause where `window.tailwind.config` placed before `tailwind.min.js` was reset by Tailwind CDN's initialization proxy, preventing custom `plum` and `violet` color and gradient classes from compiling.
  - Corrected script execution order in `frontend/index.html`.
  - Added dedicated fallback CSS utility rules for all purple palette tokens and gradients.
  - Added explicit inline style and color fallbacks to primary buttons ("Capture New Photo", "Capture & Screen Photo", "Retake Photo") and avatar badges (main profile header, sticky header, and patient selector list).
