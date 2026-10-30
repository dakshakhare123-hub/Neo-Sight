# Baseline Safety Net: Patient Profile Redesign

**Branch:** `feat/profile-redesign`  
**Date:** 2026-10-30  
**Engineer / Designer:** Senior Product Designer & Front-End Engineer  

---

## 1. Pre-Redesign Test Suite Execution

All baseline tests were run prior to modifying any profile markup, styles, or components:

| Suite | Command | Result | Duration | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Profile Characterisation** | `PYTHONPATH=. python3 tests/test_profile_characterisation.py` | **PASS (5/5)** | 0.013s | Verifies patient record schema, selection logic, editing immutability, image tracking, and demo seeding. |
| **System Characterisation** | `PYTHONPATH=. python3 tests/test_characterisation.py` | **PASS (6/6)** | 0.353s | Verifies bundle integrity, health endpoint, demo samples delivery, quality gating, color spaces. |
| **NeoScan ML Integration** | `PYTHONPATH=. python3 tests/test_neoscan_integration.py` | **PASS (10/10)** | 1.532s | Verifies API contracts, error gating (non-face, blur, tiny), and real ML prediction outcomes. |
| **ML Pipeline Unit Tests** | `PYTHONPATH=neoscan_ml:backend python3 neoscan_ml/tests/test_pipeline.py` | **PASS (8/8)** | 0.322s | 1 skipped (requires optional media), all active unit tests pass. |
| **Frontend Bundle Build** | `.tools/node-v20.18.0-darwin-arm64/bin/node frontend/build.cjs` | **PASS** | 0.48s | 106,086 bytes compiled with zero Babel or syntax errors. |

---

## 2. Pre-Redesign Profile Structure & Component Audit

Step 1 in `frontend/src/App.jsx` (lines 1241–1498):
- **Greeting Banner:** Centered pill `Pediatric Personalization & Records`, `h1` `Infant Screening Profile`, descriptive paragraph.
- **Patient Switcher:** 4-card horizontal grid (Baby Leo, Baby Maya, Baby Sam, Baby Noah) with active indicator dots.
- **Profile Detail & Edit Card:** Single wide container (`max-w-4xl`) containing:
  - Header: `{activePatient.name}'s Medical Profile`, clinical notes, gestation and feeding chips.
  - Form Fields: Infant name text input, age number input + Hours/Days buttons, gestational maturity dropdown.
  - Image History Section:
    - Empty state: dashed box with camera icon and "Take First Screening Photo" CTA.
    - Populated grid: 1 to 3 column cards showing raw photo, risk category badge, date, active correction method, and tracking distance.
    - Click handler: triggers `setActiveImageId`, runs analysis if unanalyzed, or navigates to Step 3.
  - Bottom CTA: Full-width button "Capture New Photo for {activePatient.name} →" switching to Step 2.

---

## 3. Preserved Non-Negotiables
- **Patient Images & Dermal Data:** Zero color filters, CSS tints, or compression applied to baby photos or camera streams.
- **Color Palette:** Restricted exclusively to existing design tokens: Deep Plum (`#4C2365`), Violet (`#7F5D99`), Soft Violet (`#9E7EB5`), Lavender (`#C4A4DA`), and derived neutrals/status colors.
- **Business Logic & Routes:** No modification to state managers, localStorage persistence, API endpoints, or navigation flow.
