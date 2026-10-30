# Visual & Functional Regression Report: Patient Profile Redesign

**Branch:** `feat/profile-redesign`  
**Date:** 2026-10-30  
**Engineer & Designer:** Senior Product Designer & Front-End Specialist  
**Target View:** Step 1: Patient Profile & Image Tracking History (`currentStep === 1`)  

---

## 1. Executive Summary
The Patient Profile page has been redesigned to deliver a high-end medical SaaS aesthetic with a patient hero summary band, sticky condensed scrollbar, two-zone clinical workspace, dedicated image spotlight, and chronological multi-scan timeline strip.
- **Zero Business Logic Changes:** State management, in-memory store, localStorage persistence, demographic editing handlers, image selection handlers, and step transitions operate identically.
- **Zero Image Degradation:** Displayed photos, camera preview streams, and diagnostic overlays remain completely unfiltered (`filter: none`), preserving true dermal pixel integrity for accurate jaundice screening.
- **Strict Color Token Compliance:** Built exclusively with the Deep Plum & Violet palette tokens (`#4C2365`, `#7F5D99`, `#9E7EB5`, `#C4A4DA`) and palette-harmonized status indicators.
- **Full WCAG AA / AAA Accessibility:** Every text-on-surface combination meets or exceeds WCAG 2.1 AA requirements ($\ge 4.5:1$ for normal text, $\ge 3:1$ for large text/boundaries). Tabular numerals (`font-mono tabular-nums`) ensure aligned, readable metrics.

---

## 2. Feature Inventory Verification Matrix

Every single item from `FEATURE_INVENTORY.md` was verified as present and functional:

| Feature ID | Feature Name | Pre-Redesign Baseline | Post-Redesign Status | Evidence / Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| `NAV-01..03` | Step Navigation Pills | 3 wizard steps | Preserved & functional | Step pill clicks switch between 1, 2, and 3 |
| `ID-01..03` | Greeting & Description | Centered pill & text | Hero Category Chip & Subtitle | Visual audit in Hero Patient Summary Band |
| `ID-04..05` | Name & Patient ID | Flat text | Large Display Heading + Monospace ID (`#patient-leo`) | Rendered in Hero Band & Sticky Bar |
| `ID-06..08` | Age, Gestation & Feeding | Inline labels | Prominent clinical metadata chips | Tabular numbers & uppercase chips in Hero Band |
| `ID-09..10` | Clinical Notes & Scanned Count | Subtitle & text | Notes card & photo counter badge | Rendered in Side Rail & Hero Band |
| `SW-01..06` | Patient Switcher Cards | 4 flat cards | Elevated 4-card vertical stack | `TestPatientProfileCharacterisation.test_patient_selection_derivation` |
| `ED-01` | Infant Name Input | In form card | Controlled input with plum focus ring | `TestPatientProfileCharacterisation.test_patient_demographic_edit_immutability` |
| `ED-02` | Postnatal Age Input | In form card | Tabular number input (`min=1`, `max=360`) | Verified state update on change |
| `ED-03..04` | Hours / Days Toggle | Segmented button | Segmented pill control | Verified state toggle between "hours" and "days" |
| `ED-05` | Gestational Maturity Select | Select dropdown | Accessible select with options | Verified gestation options and state update |
| `IM-01..02` | Gallery Header & Non-destructive | Section title | Spotlight section header & badge | Displayed above image spotlight |
| `IM-03..06` | Empty Gallery State & Button | Dashed box + CTA | Enhanced dashed state with camera icon | `TestPatientProfileCharacterisation.test_empty_vs_populated_image_gallery` |
| `IM-07..13` | Image Cards & Preview | Flat 3-column grid | **Dual Spotlight & Timeline Experience** | Large preview + chronological thumbnail strip |
| `ACT-01` | "Capture New Photo" | Bottom button | Elevated primary action in Hero & Sticky Bar | Triggers `setCurrentStep(2)` and starts camera |

---

## 3. WCAG 2.1 AA / AAA Contrast Verification

All contrast ratios were mathematically calculated using standard relative luminance:

| Foreground Element | Foreground Hex | Background Surface | Background Hex | Contrast Ratio | WCAG Compliance | Usage |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Deep Plum Black** | `#2A1138` | White | `#FFFFFF` | **16.99 : 1** | **PASS (AAA)** | Primary patient name, section titles |
| **Deep Plum Black** | `#2A1138` | Lavender Wash | `#F7F3FA` | **15.50 : 1** | **PASS (AAA)** | Headings on page background |
| **Deep Plum** | `#4C2365` | White | `#FFFFFF` | **12.10 : 1** | **PASS (AAA)** | Primary buttons, active tabs |
| **Deep Plum** | `#4C2365` | Lavender Wash | `#F7F3FA` | **11.04 : 1** | **PASS (AAA)** | Primary button text & card titles |
| **Deep Plum** | `#4C2365` | Soft Lavender | `#EFE8F5` | **10.10 : 1** | **PASS (AAA)** | Category chips & count badges |
| **Plum Muted** | `#725B7E` | White | `#FFFFFF` | **5.98 : 1** | **PASS (AA)** | Explanatory copy, clinical subtitles |
| **Plum Form Label** | `#5D2F7B` | White | `#FFFFFF` | **9.73 : 1** | **PASS (AAA)** | Form input labels & overlines |
| **Violet Accent** | `#7F5D99` | White | `#FFFFFF` | **5.35 : 1** | **PASS (AA)** | Secondary links and icon accents |
| **Pure White** | `#FFFFFF` | Deep Plum | `#4C2365` | **12.10 : 1** | **PASS (AAA)** | Primary button text on Deep Plum |
| **Sage-Emerald** | `#1E6F43` | White | `#FFFFFF` | **6.16 : 1** | **PASS (AA)** | Normal clinical status text & badges |
| **Amber-Gold** | `#9E5700` | White | `#FFFFFF` | **5.50 : 1** | **PASS (AA)** | Warning status text & badges |
| **Crimson-Plum** | `#8F1D40` | White | `#FFFFFF` | **8.69 : 1** | **PASS (AAA)** | Elevated status text & badges |

---

## 4. Automated Test Suite Execution Evidence

All test suites were executed on branch `feat/profile-redesign`:

```
======================================================================
1. Profile Characterisation Suite (tests/test_profile_characterisation.py)
----------------------------------------------------------------------
[JaundiceClassifier] Successfully loaded trained ML model: Support_Vector_Machine
.....
Ran 5 tests in 0.015s -> OK (100% pass)

======================================================================
2. System Characterisation Suite (tests/test_characterisation.py)
----------------------------------------------------------------------
[JaundiceClassifier] Successfully loaded trained ML model: Support_Vector_Machine
......
Ran 6 tests in 0.356s -> OK (100% pass)

======================================================================
3. NeoScan ML Integration Suite (tests/test_neoscan_integration.py)
----------------------------------------------------------------------
[JaundiceClassifier] Successfully loaded trained ML model: Support_Vector_Machine
..........
Ran 10 tests in 1.494s -> OK (100% pass)

======================================================================
4. neoscan_ml Unit Tests (neoscan_ml/tests/test_pipeline.py)
----------------------------------------------------------------------
Ran 8 tests in 0.319s -> OK (skipped=1, 100% active tests pass)

======================================================================
5. Frontend Build Compilation (frontend/build.cjs)
----------------------------------------------------------------------
[NeoScan Build] Compiled App.jsx -> app.js (121196 bytes) successfully!
Zero syntax errors, zero unapproved color classes.
```

---

## 5. Non-Regression & Medical Verification Checklist
- [x] **Zero Pixel Filtering:** Displayed baby photos and camera feeds have no CSS filters (`filter: none`). Dermal color values are 100% preserved.
- [x] **No Business Logic Changes:** Patient selection, demographic input bindings, age units toggle, and step navigation are intact.
- [x] **Responsive Adaptation:** Two-zone desktop layout (65% spotlight / 35% side rail) collapses cleanly to single-column on tablet and mobile viewports.
- [x] **Sticky Condensed Bar:** Reaches across viewports to keep patient identity and primary capture action immediately accessible when scrolling.
- [x] **Zero Leftover Badges:** Confirmed zero occurrences of "Optical Heuristic Active".
