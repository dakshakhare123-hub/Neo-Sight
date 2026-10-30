# Changelog: Patient Profile Layout & Typography Redesign

**Branch:** `feat/profile-redesign`  
**Date:** 2026-10-30  
**Scope:** Presentation-only redesign of Step 1 (Patient Profile & Image Tracking History). Zero alterations to business logic, API calls, routes, or dermal image pixels.

---

## Summary of Changes

### 1. `frontend/src/App.jsx`
- **Patient Hero Summary Band:**
  - Added a prominent top banner featuring a dynamic monogram initials avatar (`w-16 h-16 rounded-2xl bg-gradient-to-tr from-plum-900 to-violet-700`).
  - Rendered patient display title (`text-2xl sm:text-3xl font-extrabold text-plum-950`), monospace patient identifier (`#patient-leo`), age with units, gestation chip, feeding method, and photo counter badge.
  - Positioned primary action CTA ("Capture New Photo") in the top right.
- **Sticky Condensed Patient Bar on Scroll:**
  - Added an active scroll listener (`window.scrollY > 180`) that displays a compact sticky bar beneath the global header when scrolling down the page.
  - Keeps infant identity, age, gestation, and quick "Capture Photo" action accessible at all scroll depths.
- **Two-Zone Responsive Workspace (12-Column Grid):**
  - **Zone A: Main Content Column (`lg:col-span-8`):**
    - **Primary Image Spotlight Frame:** Large high-fidelity preview frame for the active/most recent infant photo, with clean status overlays (risk category, illumination correction method, capture date, camera distance).
    - **Spotlight Action Bar:** Metadata display + direct action link ("View Full Triage & Heatmap →").
    - **Chronological Timeline Strip:** Responsive grid of all historical captures with active plum selection ring and hover feedback.
    - **Empty State:** Re-styled dashed empty state with camera illustration, soothing copy, and prominent "Take First Screening Photo" CTA.
    - **Latest Screening Results Card:** Clean triage summary card showing category outcome, honest Model Score with cutoff 0.50, reliability index, and AAP screening disclaimer.
  - **Zone B: Clinical Side Rail (`lg:col-span-4`):**
    - **Patient Switcher Selector:** 4-card vertical stack (Baby Leo, Baby Maya, Baby Sam, Baby Noah) with initials badges, photo counts, and active plum selection dots.
    - **Demographics & Clinical Parameters Card:** Re-styled controlled inputs for infant name, postnatal age with Hours/Days toggle, gestational maturity dropdown, and clinical observation notes.
    - **AAP Screening Protocol Reference:** Compact educational guidance card on neonatal jaundice progression.

### 2. `frontend/app.js`
- Recompiled production JavaScript bundle containing the redesigned layout and typography components (121,196 bytes).

### 3. `tests/test_profile_characterisation.py`
- Added comprehensive characterisation test suite covering patient record schema, selection logic, editing immutability, image tracking, and demo sample seeding.

### 4. Documentation & Verification Artifacts
- **`DESIGN_BRIEF.md`:** Comprehensive layout wireframes (desktop & mobile), typography scale, 8px grid spacing, and complete mapping table.
- **`FEATURE_INVENTORY.md`:** Catalog of all 16 elements, controls, fields, and states.
- **`BASELINE.md`:** Pre-redesign test outputs and audit notes.
- **`REGRESSION_REPORT.md`:** Contrast calculation matrix, test execution logs, and non-regression checklist.
