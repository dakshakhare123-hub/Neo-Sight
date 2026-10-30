# Changelog: Deep Plum & Violet Re-Theme & Heuristic Badge Removal

**Branch:** `feat/purple-theme`  
**Date:** 2026-10-30  
**Authors:** Senior Front-End Engineer & UI Specialist  

All changes in this release preserve 100% of existing application behavior, data structures, routes, layouts, and image integrity.

---

## Modified Files

### 1. `frontend/index.html`
- **Design Tokens**: Configured `window.tailwind.config` with extended palettes:
  - `plum` (`50` through `950`, anchored on Deep Plum `#4C2365` and Deep Plum Black `#2A1138`).
  - `violet` (`50` through `900`, anchored on Violet `#7F5D99` and Soft Violet `#9E7EB5`).
  - `lavender` (`50` through `900`, anchored on Lavender `#C4A4DA`).
  - `clinical` (`normal`: `#1E6F43`, `warning`: `#9E5700`, `elevated`: `#8F1D40`).
- **CSS Custom Properties**: Added `:root` tokens for `--color-plum-900`, `--color-violet-500`, `--color-lavender-400`, `--color-bg-wash`, and status tokens.
- **Initial Loader & Body**: Updated `body` background to `bg-plum-50 text-plum-950` and pre-React spinner to `text-violet-500`.

### 2. `frontend/src/App.jsx`
- **Task 2 (Heuristic Badge Removal)**:
  - Completely removed `<div className="flex items-center space-x-3">...<span className="hidden sm:inline font-medium">Optical Heuristic Active</span>...</div>` from the global header.
  - Closed spacing cleanly with zero layout shift or visual gaps.
- **Canvas Viewfinder HUD**:
  - Replaced hardcoded cyan (`#06b6d4`) with Soft Violet (`rgba(158, 126, 181, 0.75)`).
  - Replaced dark slate pills with Deep Plum Black overlay (`rgba(42, 17, 56, 0.85)`).
- **Navigation & Wizards**:
  - Re-themed logo badge to `bg-gradient-to-tr from-plum-900 to-violet-700`.
  - Re-themed 3-step wizard active indicator to `bg-plum-900 text-white shadow-plum-900/25`.
- **Step 1 (Patient Profile)**:
  - Re-themed active patient selection cards to `border-plum-900 bg-plum-50/60 ring-2 ring-plum-900/15`.
  - Re-themed form input borders and focus rings to `border-lavender-200 focus:ring-plum-900`.
  - Re-themed "Proceed to Scan" button to `bg-gradient-to-r from-plum-900 to-violet-700`.
- **Step 2 (Camera & Shutter)**:
  - Re-themed mode tabs (Live Camera vs Upload) to `bg-plum-900 text-white`.
  - Re-themed shutter capture button to `border-4 border-plum-900 text-plum-900 hover:scale-105`.
  - Re-themed guidance checklist and color card detection cards to lavender/plum borders.
- **Step 3 (Clinical Triage & Diagnostics)**:
  - Re-themed Hero Triage Card and risk badge to palette-harmonized status tokens.
  - Re-themed Multi-Spectrum Viewport pills (Raw, Corrected, Diagnostic, Heatmap) to `bg-plum-900 text-white`.
  - Re-themed Clinical Insights accordion sub-tabs and telemetry breakdown cards.
  - Re-themed Biometric ROI table headers and row highlights to `text-plum-900 font-bold`.
  - Re-themed Historical Timeline strip active border to `border-plum-900 ring-2 ring-plum-900/20`.
- **Modals & Utilities**:
  - Re-themed Calming Heartbeat Loading Modal to `bg-plum-950/70` backdrop and `from-plum-900 to-violet-700` pulsing heart container.
  - Updated image fallback loading spinner from `text-teal-400` to `text-violet-600`.
  - Re-themed Medical Disclaimer footer borders and copy.

### 3. `frontend/app.js`
- Recompiled production JavaScript bundle via Babel (`build.cjs`) containing the re-themed components and removed heuristic badge.

---

## Created Documentation Files

### 4. `FEATURE_INVENTORY.md`
- Complete inventory of all 16 features across all 3 steps of the application, verified prior to making edits.

### 5. `BASELINE.md`
- Phase 0 safety net recording test results, lint checks, and exact original code for the "Optical Heuristic Active" badge.

### 6. `COLOUR_MAP.md`
- Comprehensive mapping of every pre-existing color (teal, cyan, slate, amber, emerald, rose) to its exact replacement token in the Deep Plum & Violet system.

### 7. `REGRESSION_REPORT.md`
- Detailed verification report including calculated WCAG 2.1 AA/AAA contrast tables, non-regression checklists, and full automated test suite outputs.
