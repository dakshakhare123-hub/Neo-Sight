# Feature Inventory: Triage and Insights Page

**Target View:** NeoScan Step 3 (`currentStep === 3`: "Clinical Triage & Real-Time Insights")  
**Branch:** `fix/triage-insights`  
**Date:** 2026-10-30  

This inventory catalogs every visual element, data field, interactive control, chart, telemetry card, and state on the Triage and Insights page. Every feature listed here must remain fully functional and uncompromised.

---

## 1. Top Bar & Patient Context
| ID | Element / Control | Type | Data Binding / Behavior | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TRI-NAV-01` | Step 3 Header Pill | Navigation tab | Highlights active step "3. Triage & Insights" | Preserved |
| `TRI-NAV-02` | Return to Step 1 / 2 | Buttons | Header wizard pills allow navigating back to Profile or Capture | Preserved |
| `TRI-CTX-01` | Active Patient Context | Text / metadata | Displays active patient name, age, and gestation | Preserved |
| `TRI-CTX-02` | Active Image Date | Timestamp | Shows formatted timestamp of active screening frame | Preserved |

---

## 2. Hero Triage Assessment Card
| ID | Element / Control | Type | Data Binding / Behavior | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TRI-HERO-01` | Hero Card Container | Surface panel | Dynamic background tint and border keyed to triage status | Preserved |
| `TRI-HERO-02` | Risk Category Badge | Pill badge | Multi-modal badge: SVG icon + category text (`NO VISIBLE SIGNS`, `POSSIBLE JAUNDICE SIGNS`, `INCONCLUSIVE`) | **To Fix (deterministic)** |
| `TRI-HERO-03` | Headline Title | Heading (h1) | Primary clinical assessment headline | **To Fix (deterministic)** |
| `TRI-HERO-04` | Recommendation Copy | Paragraph | Detailed clinical triage guidance and next steps | **To Fix (deterministic)** |
| `TRI-HERO-05` | Reliability Alert Banner | Warning box | Appears when `reliabilityNote` exists (e.g. reduced lighting confidence) | Preserved |
| `TRI-HERO-06` | Model Score Display | Metric line | Monospace model score (e.g. `0.0820`) with cutoff note | Preserved |
| `TRI-HERO-07` | CIE b* Yellowness Line | Metric line | Formatted b* dermal yellowness value with 1 decimal place | **To Fix (accurate CIE Lab)** |
| `TRI-HERO-08` | b* Yellowness Scale Bar | Visual gauge | Horizontal gradient bar with marker indicating level | **To Fix (yellow->orange->red)** |
| `TRI-HERO-09` | Bilirubin Index (BIx) | Metric line | Optical bilirubin index value (`fh_yi`) | Preserved |
| `TRI-HERO-10` | Reliability & Confidence | Metric line | Shows "Normal" or "Reduced" with confidence percentage | Preserved |
| `TRI-CARE-01` | Feeding & Hydration Card | Care tip | Guidance: 8–12 feeds per 24 hours to stimulate bilirubin excretion | Preserved |
| `TRI-CARE-02` | Daylight Observation Card | Care tip | Guidance: check skin in indirect natural window light | Preserved |
| `TRI-CARE-03` | When to Call Doctor Card | Care tip | Emergency signs: jaundice spreading to abdomen/legs, lethargy | Preserved |

---

## 3. Multi-Spectrum Visual Inspection Viewport
| ID | Element / Control | Type | Data Binding / Behavior | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TRI-SPEC-01` | Viewport Section Header | Title & subtext | "Multi-Spectrum Visual Inspection" description | Preserved |
| `TRI-MODE-01` | "Corrected" Mode Tab | Button | Switches to illumination-normalized view | **To Fix (real corrected image)** |
| `TRI-MODE-02` | "Original Raw" Mode Tab | Button | Switches to uncorrected original input photo | **To Fix (true original, orientation)** |
| `TRI-MODE-03` | "Diagnostic ROIs" Mode Tab | Button | Switches to aligned anatomical landmark contours | **To Fix (true-aligned ROIs)** |
| `TRI-MODE-04` | "Thermal Heatmap" Mode Tab | Button | Switches to dermal yellowness heatmap | **To Fix (relabel to Yellowness Heatmap & real b* map)** |
| `TRI-FRAME-01` | Visual Viewport Frame | Display frame | Aspect ratio 16:10 / video container displaying selected mode | Preserved |
| `TRI-PILL-01` | Viewport Floating Badge | Metadata pill | Overlaid indicator confirming active inspection mode | Preserved |

---

## 4. Clinical Insights & Technical Breakdown Accordion
| ID | Element / Control | Type | Data Binding / Behavior | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TRI-ACC-01` | Accordion Toggle Bar | Interactive header | Clicking expands / collapses clinical telemetry breakdown | Preserved |
| `TRI-TAB-01` | Sub-tab: Optical Normalization | Tab button | Displays active method, ambient CCT, sharpness, dermal coverage | Preserved |
| `TRI-TAB-02` | Sub-tab: Biometric ROIs | Tab button | Displays landmark table (forehead, cheeks) with raw & corrected b* | Preserved |
| `TRI-TAB-03` | Sub-tab: Model & Gating | Tab button | Displays model version, quality gates, screening score, disclaimer | Preserved |
| `TRI-DISC-01` | Screening Disclosures Box | Alert callout | Persistent AAP screening limitation disclaimer | Preserved |

---

## 5. Longitudinal History Timeline Strip
| ID | Element / Control | Type | Data Binding / Behavior | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TRI-HIST-01` | Longitudinal Strip Header | Title & count | Displays `{activePatient.name}'s Longitudinal Screenings ({count})` | Preserved |
| `TRI-HIST-02` | Historical Thumbnail Cards | Interactive cards | Clicking any frame sets `activeImageId` and inspects its result | Preserved |
| `TRI-HIST-03` | Active Frame Ring | Visual indicator | Highlights currently displayed frame in timeline | Preserved |
| `TRI-HIST-04` | Scan Version Badge | Pill badge | Labeled `v2.0` (neoscan_ml) or `Legacy` | Preserved |

---

## 6. Global Modals, Banners & Footers
| ID | Element / Control | Type | Data Binding / Behavior | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TRI-ERR-01` | Error Notification Banner | Dismissible banner | Appears on 422/503 errors with error code, message, hint, and Retake | Preserved |
| `TRI-LOAD-01` | Calming Heartbeat Modal | Overlay modal | Displays rotating progress message and pulsing heart during analysis | Preserved |
| `TRI-FOOT-01` | Medical Disclaimer Footer | Global footer | AAP legal screening aid disclaimer across all views | Preserved |
