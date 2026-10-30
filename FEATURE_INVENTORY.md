# Feature Inventory: Patient Profile Page

**Page / View:** NeoScan Step 1 (`currentStep === 1`: "Patient Profile & Image Tracking History")  
**Branch:** `feat/profile-redesign`  
**Date:** 2026-10-30  

This inventory catalogs every visual element, data field, interactive control, conditional state, and action currently present on the Patient Profile page. Every item listed here must be preserved in the redesign.

---

## 1. Global Navigation & Wizard Header
| ID | Element / Control | Type | Data Binding / Behavior | Present in Redesign |
| :--- | :--- | :--- | :--- | :---: |
| `NAV-01` | Step 1 Pill ("1. Patient Profile") | Tab button | Active step indicator; clicking sets `currentStep(1)` | Yes |
| `NAV-02` | Step 2 Pill ("2. Capture") | Tab button | Clicking sets `currentStep(2)` | Yes |
| `NAV-03` | Step 3 Pill ("3. Triage & Insights") | Tab button | Clicking sets `currentStep(3)` | Yes |
| `NAV-04` | Brand Logo & Title | Header branding | Displays NeoScan icon and version badge | Yes |

---

## 2. Profile Summary & Identity Elements
| ID | Element / Control | Type | Data Binding / Behavior | Present in Redesign |
| :--- | :--- | :--- | :--- | :---: |
| `ID-01` | Greeting Category Pill | Badge | Displays `<Icon name="sparkles" /> Pediatric Personalization & Records` | Yes |
| `ID-02` | Page Title | Heading (h1) | "Infant Screening Profile" | Yes |
| `ID-03` | Context Description | Paragraph | Explains physiological progression of neonatal jaundice and tracking over time | Yes |
| `ID-04` | Active Patient Name | Text display | Displays `{activePatient.name}` in header and active indicators | Yes |
| `ID-05` | Active Patient ID | Metadata | Primary patient key (e.g. `patient-leo`, `patient-maya`) | Yes |
| `ID-06` | Postnatal Age Display | Chip / text | Shows `{p.ageValue} {p.ageUnit}` | Yes |
| `ID-07` | Gestation Display | Chip / badge | Shows `{p.gestation}` (full-term, late-preterm, preterm) | Yes |
| `ID-08` | Feeding Method Display | Chip / badge | Shows `{p.feeding}` (breastfeeding, combination, etc.) | Yes |
| `ID-09` | Clinical Notes Display | Text / subtitle | Shows `{activePatient.notes}` or fallback | Yes |
| `ID-10` | Screened Photos Counter | Counter pill | Shows count of images in `{p.images.length}` | Yes |

---

## 3. Patient Switcher / Selection Strip
| ID | Element / Control | Type | Data Binding / Behavior | Present in Redesign |
| :--- | :--- | :--- | :--- | :---: |
| `SW-01` | Patient Switcher Container | Grid / list | Displays all patients in `patients` state | Yes |
| `SW-02` | Patient Tab: Baby Leo | Card button | `onClick={() => selectPatientProfile(p)}`; activates Leo | Yes |
| `SW-03` | Patient Tab: Baby Maya | Card button | `onClick={() => selectPatientProfile(p)}`; activates Maya | Yes |
| `SW-04` | Patient Tab: Baby Sam | Card button | `onClick={() => selectPatientProfile(p)}`; activates Sam | Yes |
| `SW-05` | Patient Tab: Baby Noah | Card button | `onClick={() => selectPatientProfile(p)}`; activates Noah | Yes |
| `SW-06` | Active Indicator Dot | Visual dot | Renders plum dot on currently selected patient card | Yes |

---

## 4. Demographic & Clinical Parameter Inputs (Live Editing)
| ID | Element / Control | Type | Data Binding / Behavior | Present in Redesign |
| :--- | :--- | :--- | :--- | :---: |
| `ED-01` | Infant Name Input | Text input | Controlled input updating `activePatient.name` in `patients` | Yes |
| `ED-02` | Postnatal Age Input | Number input | Controlled input (`min=1`, `max=360`) updating `activePatient.ageValue` | Yes |
| `ED-03` | Hours Toggle Button | Segmented button | `onClick={() => set ageUnit to 'hours'}`; highlights when active | Yes |
| `ED-04` | Days Toggle Button | Segmented button | `onClick={() => set ageUnit to 'days'}`; highlights when active | Yes |
| `ED-05` | Gestational Maturity Dropdown | Select dropdown | Options: `full-term`, `late-preterm`, `preterm`; updates `gestation` | Yes |

---

## 5. Patient Image History & Tracking Gallery
| ID | Element / Control | Type | Data Binding / Behavior | Present in Redesign |
| :--- | :--- | :--- | :--- | :---: |
| `IM-01` | Gallery Section Header | Title + count | Displays `Screening Images & Tracking History ({count})` with clock icon | Yes |
| `IM-02` | Non-destructive Label | Badge | "Non-destructive dermal records" label | Yes |
| `IM-03` | Empty State Box | Container | Renders when `!activePatient.images || activePatient.images.length === 0` | Yes |
| `IM-04` | Empty State Camera Icon | Icon | Lucide camera icon in tinted circular container | Yes |
| `IM-05` | Empty State Message | Headings & copy | "No screening photos recorded yet" with actionable description | Yes |
| `IM-06` | "Take First Screening Photo" | Action button | `onClick={() => setCurrentStep(2)}`; navigates to camera capture | Yes |
| `IM-07` | Image Card Item | Card | Renders for each record in `activePatient.images` | Yes |
| `IM-08` | Photo Preview | Image | `ImageWithFallback` with `src={imgRecord.rawImage}`; aspect 4/3; unfiltered | Yes |
| `IM-09` | Risk Category Badge | Overlaid pill | Displays e.g. `NO VISIBLE SIGNS` / `SCREENED` with dynamic risk color | Yes |
| `IM-10` | Date & Timestamp | Text | Displays `{imgRecord.formattedDate}` | Yes |
| `IM-11` | Active Correction Badge | Text | Displays `{imgRecord.activeCorrection || 'auto'}` | Yes |
| `IM-12` | Tracking Distance Badge | Icon + text | Displays `<Icon name="target" /> Distance: {distance} cm` if present | Yes |
| `IM-13` | Image Click Handler | Interactive | `onClick`: selects image ID; navigates to Step 3 or triggers analysis | Yes |

---

## 6. Primary Action
| ID | Element / Control | Type | Data Binding / Behavior | Present in Redesign |
| :--- | :--- | :--- | :--- | :---: |
| `ACT-01`| "Capture New Photo for {name} →" | Button (gradient) | Clears errors, sets `currentStep(2)`, starts camera if in camera mode | Yes |
