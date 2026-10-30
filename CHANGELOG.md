# NeoScan Changelog — Smartphone & Mobile Transformation

All notable changes to mobile readiness, smartphone camera, responsive layout, PWA, and native scaffolding on branch `feat/mobile`.

---

## [Mobile Release 2.0.0] - 2026-10-30

### Phase 0 & 1: Safety Net, Characterisation & Mobile Readiness Audit
- **Commit:** `331deea` — `docs(audit): phase 0 baseline and phase 1 mobile readiness report`
- **Safety Net Baseline:** Recorded initial 71 tests passing (56 backend tests, 8 ML tests, 7 Node triage tests) in `BASELINE.md`.
- **Characterisation Suite:** Implemented `tests/test_mobile_characterisation.py` guarding patient CRUD, optical normalization, triage rules, and asset delivery.
- **Audits & Specifications:** Produced `MOBILE_READINESS_REPORT.md` (gap analysis and architectural roadmap) and `FEATURE_INVENTORY.md`.

### Phase 2: Mobile-First Responsive UI, Safe-Area Insets & Ergonomics
- **Commit:** `88e322b` — `feat(mobile-ui): phase 2 mobile-first responsive layout, safe-area insets, and touch ergonomics`
- **Safe-Area Insets:** Added `viewport-fit=cover` to `<meta name="viewport">` in `frontend/index.html`. Injected safe-area variables (`--sat`, `--sar`, `--sab`, `--sal`) and safe padding classes (`.safe-top`, `.safe-bottom`).
- **iOS Tap-Zoom Prevention:** Configured `input, select, textarea { font-size: 16px !important; }` below 768px in `frontend/index.html` to eliminate intrusive iOS viewport zooming.
- **Mobile Stepper Wizard:** Created `<nav role="navigation" aria-label="Mobile Screening Steps">` with $\ge 44 \times 44\text{px}$ touch buttons for Steps 1, 2, and 3.
- **Fast Patient Switcher Tray:** Added mobile-friendly horizontal carousel (`lg:hidden`) at the top of Patient Profile for immediate infant switching without opening large modals.
- **Demographics Touch Form:** Optimized inputs with `inputMode="numeric"`, `autoCapitalize="words"`, `autoComplete="name"`, and `min-h-[44px]`.
- **Responsive Inspection Viewport:** Optimized Multi-Spectrum visual switcher and deep dive accordion with horizontal scroll bars and touch-friendly tabs (`min-h-[40px] shrink-0`).

### Phase 3: Progressive Web Application (PWA) Implementation
- **Commit:** `08f2004` — `feat(pwa): phase 3 pwa manifest, service worker app-shell, and install prompt`
- **Web App Manifest (`frontend/manifest.json`):** Configured `display: "standalone"`, `orientation: "portrait-primary"`, `theme_color: "#4C2365"`, and maskable icons.
- **Service Worker (`frontend/sw.js`):** Built cache-first app shell worker pre-caching static HTML, compiled JS, styles, and brand SVGs while strictly bypassing `/api/v1/*` clinical endpoints.
- **Service Worker Registration:** Added registration script in `frontend/index.html` and root routing `/sw.js` in `backend/app/main.py`.
- **PWA Installation Banner:** Added `beforeinstallprompt` event listener and non-intrusive dismissible install banner in `frontend/src/App.jsx`.

### Phase 4: Smartphone Camera Integration & EXIF Orientation
- **Commit:** `d70b064` — `feat(camera): phase 4 smartphone camera abstraction, exif orientation, and guidance`
- **Resolution Ladder Fallback:** `startCamera` attempts $1920\times 1080 \to 1280\times 720 \to$ generic ideal $\to$ basic video stream, preventing camera crashes on constrained Android/iOS devices.
- **Rear Camera Priority & Flipping:** Environment-facing camera selected by default; smooth front/rear camera flipping.
- **Client-Side Geometric EXIF Normalizer:** Implemented lossless EXIF orientation reader (`getExifOrientation`) and canvas rotation (`normalizeImageOrientation`) for tags 1, 3, 6, 8, ensuring uploaded smartphone portrait photos are upright without color distortion.
- **Dynamic API Base URL:** Configured `API_BASE = window.NEOSCAN_API_URL || ""` supporting standalone mobile client environments.
- **Live Ambient Lighting Guidance:** Periodic live luminescence sampler assesses ambient brightness: alerts for low light ($Y < 45$) or direct glare ($Y > 230$) in camera HUD pills.

### Phase 5: Data, Security, Privacy & Offline Resilience
- **Commit:** `b715a6c` — `feat(offline): phase 5 secure offline queue, indexeddb storage, and privacy controls`
- **IndexedDB Storage Engine (`NeoScanStorage`):** Implemented client-side IndexedDB database (`neoscan_mobile_db`) storing high-resolution image blobs, permanently eliminating the 5MB `localStorage` `QuotaExceededError` crash.
- **Offline Screening Queue:** Preserves captured photos safely during network outages (`status: "pending_upload"`), synchronizing automatically upon `online` reconnection.
- **App Switcher Multitasking Shield:** Listens to `document.onvisibilitychange` to render a high-blur privacy veil (`backdrop-blur-2xl`), protecting infant photos and clinical diagnoses from mobile app-switcher screenshots.
- **15-Minute Inactivity Auto-Lock:** Watchdog timer locks session after 15 minutes of inactivity to protect sensitive neonatal health data from unattended device access.
- **Privacy Architecture Documentation:** Produced `PRIVACY_NOTES.md`.

### Phase 6: Capacitor Native App Shell Scaffolding
- **Commit:** `113dca6` — `feat(native): phase 6 capacitor native shell scaffolding for android and ios`
- **Capacitor Configuration:** Created `capacitor.config.json` with app id `org.neoscan.pediatric`, webDir `frontend`, and Deep Plum native splash screen / status bar styling.
- **Package Configuration:** Created root `package.json` with scripts for build, test, and native sync (`cap:sync`, `cap:open:android`, `cap:open:ios`).
- **Native Bridge Integration:** Handled `window.Capacitor` in `App.jsx` for native status bar and splash screen auto-hiding.

### Phase 7: Verification, Documentation & Deliverables
- **Documentation:** Produced `DEVICE_TEST_PLAN.md` (physical device verification scripts) and updated `REGRESSION_REPORT.md` (cross-viewport layout audit and 61 passing automated tests).

---

## Rollback Plan & Safety Instructions

If any rollback is required, the changes are fully isolated on the `feat/mobile` git branch and can be safely reverted or checked out:

### Option A: Return to Previous Working Branch
```bash
# Return to the previous stable branch (before mobile transformation)
git checkout fix/capture-labels-logo
```

### Option B: Revert Specific Phase Commits
```bash
# Revert native scaffolding
git revert 113dca6

# Revert offline/storage phase
git revert b715a6c

# Revert camera integration phase
git revert d70b064

# Revert PWA phase
git revert 08f2004

# Revert mobile UI layout phase
git revert 88e322b
```

### Option C: Complete Branch Reset
```bash
# Reset branch to initial baseline commit
git reset --hard c02fa99
```
All original database records, `neoscan_ml` models, and existing API endpoints remain 100% untouched and backward-compatible.
