# Design Brief: Patient Profile Page Redesign

**Project:** NeoScan Pediatric Jaundice Screening Platform  
**Target View:** Step 1: Patient Profile & Image Tracking History (`currentStep === 1`)  
**Branch:** `feat/profile-redesign`  
**Palette:** Deep Plum & Violet ([Color Hunt #4C2365 / #7F5D99 / #9E7EB5 / #C4A4DA](https://colorhunt.co/palette/4c23657f5d999e7eb5c4a4da))  
**Date:** 2026-10-30  

---

## 1. Visual & Architectural Vision

The redesigned Patient Profile page elevates NeoScan from a simple multi-step form to a **world-class clinical pediatric dashboard**. It combines:
- **Calm, High-End Medical SaaS Aesthetic:** High readability, clean visual structure, reassuring soft lavender cards, deep plum typography, and zero clutter.
- **Patient-Centric Hero Band:** Immediate identification of the infant, age in hours/days, gestational maturity, and immediate screening status.
- **Dedicated Image Spotlight & Timeline:** The dermal photographs are the primary clinical artifact; they are showcased in a high-fidelity spotlight frame with chronological multi-scan timeline navigation, zero pixel alteration, and complete non-destructive traceability.
- **Two-Zone Responsive Desktop Layout:** Main clinical inspection area (images + screening triage telemetry) on the left, side rail for patient switching and demographic editing on the right, collapsing seamlessly to an intuitive vertical stream on mobile devices.

---

## 2. Layout Wireframes

### Desktop Layout (>= 1024px Viewport)

```
+----------------------------------------------------------------------------------------------------+
|  [NeoScan Logo]      1. Patient Profile (Active)  >  2. Capture  >  3. Triage & Insights            |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  PATIENT HERO SUMMARY BAND                                                                         |
|  +-----------------------------------------------------------------------------------------------+ |
|  |  [AVATAR]  Baby Leo (ID: patient-leo)                     [Screened: Normal] [Full-Term ≥37w] | |
|  |   (BL)     72 Hours Old • Breastfeeding • D65 Daylight    [+ Capture New Photo Button]        | |
|  +-----------------------------------------------------------------------------------------------+ |
|                                                                                                    |
|  TWO-ZONE CLINICAL WORKSPACE                                                                       |
|  +-------------------------------------------------------+ +-------------------------------------+ |
|  | ZONE A: CLINICAL SPOTLIGHT & TIMELINE (~65% width)    | | ZONE B: SIDE RAIL (~35% width)      | |
|  |                                                       | |                                     | |
|  | 1. PRIMARY IMAGE SPOTLIGHT PREVIEW                    | | 1. PATIENT SWITCHER CARDS           | |
|  |    +---------------------------------------------+    | |    +------------------------------+ | |
|  |    | [Raw / Corrected Infant Forehead Photo]     |    | |    | (*) Baby Leo (Active) - 1 img| | |
|  |    | Overlays: [Risk Category Chip] [Timestamp]  |    | |    | ( ) Baby Maya - 1 img        | | |
|  |    |           [Illumination: auto] [Dist: 25cm] |    | |    | ( ) Baby Sam  - 1 img        | | |
|  |    +---------------------------------------------+    | |    | ( ) Baby Noah - 1 img        | | |
|  |    Action Bar: [Deep Dive Triage ->] [Non-Destr]      | |    +------------------------------+ | |
|  |                                                       | |                                     | |
|  | 2. CHRONOLOGICAL SCREENING TIMELINE / THUMBNAILS      | | 2. DEMOGRAPHICS & CLINICAL EDIT     | |
|  |    +--------+  +--------+  +--------+                 | |    - Infant Name: [ Baby Leo      ] | |
|  |    | Img #1 |  | Img #2 |  | Img #3 |                 | |    - Postnatal Age: [ 72 ] [Hr|Day] | |
|  |    | Active |  | Oct 29 |  | Oct 28 |                 | |    - Gestation: [ Full-Term    v] | |
|  |    +--------+  +--------+  +--------+                 | |    - Feeding: [ Breastfeeding   v] | |
|  |                                                       | |    - Clinical Notes Display         | |
|  | 3. LATEST SCREENING RESULT SUMMARY                    | |                                     | |
|  |    +---------------------------------------------+    | | 3. CLINICAL GUIDELINES BOX          | |
|  |    | Shield: NO VISIBLE SIGNS OF JAUNDICE        |    | |    - AAP Hyperbilirubinemia guide   | |
|  |    | Model Score: 0.0820 (Cutoff 0.50)           |    | |    - Physiological peak at 72-96h   | |
|  |    | Forehead b*: 12.4 • Reliability: Normal     |    | +-------------------------------------+ |
|  |    | neoscan_ml Engine • Medical Disclaimer      |    |                                         |
|  |    +---------------------------------------------+    |                                         |
|  +-------------------------------------------------------+                                         |
+----------------------------------------------------------------------------------------------------+
```

### Mobile / Tablet Layout (< 1024px Viewport)

```
+-------------------------------------------------------------+
|  [NeoScan]  [1. Profile] [2. Capture] [3. Triage]           |
+-------------------------------------------------------------+
|                                                             |
|  STICKY / CONDENSED PATIENT BAR                             |
|  [BL] Baby Leo • 72h • Normal         [+ Capture Button]    |
|                                                             |
|  PATIENT SWITCHER CHIP CAROUSEL                             |
|  [(*) Leo (1)]  [( ) Maya (1)]  [( ) Sam (1)]  [( ) Noah]   |
|                                                             |
|  PRIMARY IMAGE SPOTLIGHT PREVIEW                            |
|  +-------------------------------------------------------+  |
|  | [Large Unaltered Forehead Photo]                      |  |
|  | [Chip: NO VISIBLE SIGNS] [72h Old] [auto]             |  |
|  +-------------------------------------------------------+  |
|  [View Full Triage & Insights ->]                           |
|                                                             |
|  TIMELINE STRIP (Horizontal scroll)                         |
|  [Frame 1 (Active)]  [Frame 2]  [Frame 3]                   |
|                                                             |
|  LATEST SCREENING RESULT CARD                               |
|  [Shield] Routine Observation (Model Score: 0.0820)         |
|                                                             |
|  DEMOGRAPHIC & CLINICAL EDIT COLLAPSIBLE ACCORDION          |
|  Name, Age, Gestation Inputs                                |
+-------------------------------------------------------------+
```

---

## 3. Typography Scale & Hierarchy

All fonts use `'Plus Jakarta Sans'` for geometric, human-centered UI clarity, paired with `'JetBrains Mono'` for tabular numerical metrics:

| Role | Size | Weight | Tracking / Leading | CSS Utility | Usage |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Display / Hero** | 28px – 32px | 800 (ExtraBold) | `-0.025em` / `1.2` | `text-2xl sm:text-3xl font-extrabold tracking-tight` | Active patient name in hero banner |
| **H1 (Section)** | 20px – 24px | 700 (Bold) | `-0.02em` / `1.25` | `text-xl sm:text-2xl font-bold tracking-tight` | Main section headings (Image Spotlight) |
| **H2 (Card)** | 15px – 16px | 700 (Bold) | `-0.01em` / `1.3` | `text-sm sm:text-base font-bold` | Card titles (Demographics, Result Summary) |
| **H3 (Sub-item)** | 13px – 14px | 600 (SemiBold) | `normal` / `1.35` | `text-xs sm:text-sm font-semibold` | Patient switcher names, timeline dates |
| **Body (Standard)** | 13px – 14px | 400 – 500 | `normal` / `1.5` | `text-xs sm:text-sm leading-relaxed text-plum-700` | Explanations, clinical instructions |
| **Caption / Meta** | 11px – 12px | 500 (Medium) | `normal` / `1.4` | `text-xs text-plum-600` | Timestamps, camera parameters, notes |
| **Overline / Label** | 10px – 11px | 700 (Bold) | `+0.05em` (uppercase) | `text-[10px] font-bold uppercase tracking-wider text-plum-600` | Input labels, category tags |
| **Tabular Numbers** | 12px – 14px | 600 – 700 | `mono` / `1.0` | `font-mono tabular-nums text-plum-950` | Model scores, hours, distances |

---

## 4. Spacing System (8px Baseline Grid)

- **Unit Scale:** 4px (`space-1`), 8px (`space-2`), 12px (`space-3`), 16px (`space-4`), 24px (`space-6`), 32px (`space-8`), 48px (`space-12`).
- **Container Margins:** Max width `max-w-6xl mx-auto px-4 sm:px-6`.
- **Card Padding:** `p-5 sm:p-6` for primary cards; `p-3.5 sm:p-4` for compact list items.
- **Card Radius:** `rounded-3xl` (24px) for major panels; `rounded-2xl` (16px) for interior components and inputs; `rounded-xl` (12px) for buttons and chips.
- **Borders & Dividers:** `border border-lavender-200/80` and `divide-lavender-100`.
- **Shadows:** Soft layered diffuse shadow: `shadow-sm` and `shadow-md shadow-plum-900/5`.

---

## 5. Mapping Table: Existing Elements $\rightarrow$ Redesigned Locations

Every single item from `FEATURE_INVENTORY.md` is preserved and mapped to its exact enhanced position:

| Inventory ID | Existing Item Description | Existing Location | Redesigned Location & Enhanced Presentation |
| :--- | :--- | :--- | :--- |
| `ID-01` | Greeting Category Pill | Centered above title | Integrated into Patient Hero Summary Banner as a subtle plum-tinted category chip |
| `ID-02` | Page Title ("Infant Screening Profile") | Centered `h1` | Top sub-header in Hero Banner |
| `ID-03` | Context Description | Centered paragraph | Refined clinical subtext under patient header and in guidelines card |
| `ID-04` | Active Patient Name | Text display | Prominent Display title in Hero Banner with Initials Avatar badge |
| `ID-05` | Active Patient ID | Metadata text | Formally displayed with monospace badge (`#patient-leo`) in Hero Banner |
| `ID-06` | Postnatal Age Display | Text snippet | Highlighted in Hero summary chip and tabular-nums demographic card |
| `ID-07` | Gestation Display | Chip / badge | Pill badge in Hero Banner (`FULL-TERM ≥ 37w`) + editable select in Side Rail |
| `ID-08` | Feeding Method Display | Chip / badge | Pill badge in Hero Banner (`BREASTFEEDING`) |
| `ID-09` | Clinical Notes Display | Text subtitle | Highlighted clinical observation card in Side Rail |
| `ID-10` | Screened Photos Counter | Card text | Metric chip in Hero Banner + counter on each patient switcher card |
| `SW-01..06` | Patient Switcher Cards (Leo, Maya, Sam, Noah) | 4-column flat grid | Side Rail Switcher Card with initials badges, photo counts, and active plum ring |
| `ED-01` | Infant Name Input | In form card | Side Rail Demographics Card with floating label styling |
| `ED-02` | Postnatal Age Input | In form card | Side Rail Demographics Card with tabular number input |
| `ED-03..04` | Hours / Days Segmented Buttons | In form card | High-contrast plum segmented pill control next to age input |
| `ED-05` | Gestational Maturity Dropdown | In form card | Polished select dropdown with accessible focus rings |
| `IM-01..02` | Gallery Header & Non-destructive Label | Card section header | Zone A Image Spotlight Section header with clock icon and non-destructive badge |
| `IM-03..06` | Empty State Box, Icon, Text & Button | In image section | Enhanced dashed empty state in Zone A with camera illustration and action CTA |
| `IM-07..13` | Image Cards, Preview, Overlays, Click Action | Grid of small cards | **Dual Experience:** Large high-resolution Spotlight Primary Preview + Chronological Multi-Image Timeline Strip with zero pixel alterations |
| `ACT-01` | "Capture New Photo for {name} →" | Bottom full-width button | Elevated to primary action position in Hero Banner + accessible CTA under image |

---

## 6. Accessibility & Contrast Verification (WCAG AA)

- All text meets or exceeds WCAG 2.1 AA ($4.5:1$ for body copy, $3:1$ for large text):
  - Deep Plum Black (`#2A1138`) on White: **16.99:1** (AAA)
  - Deep Plum (`#4C2365`) on White: **12.10:1** (AAA)
  - Deep Plum Muted (`#725B7E`) on White: **5.98:1** (AA)
  - Deep Plum Label (`#5D2F7B`) on White: **9.73:1** (AAA)
- Soft Violet (`#9E7EB5`) is used strictly for non-text graphics (avatar ring halos, focus rings, decorative card borders) and never for body typography.
- Statuses pair color with distinct SVG icons (`shield-check`, `alert-triangle`, `clock`) and textual status descriptions.
