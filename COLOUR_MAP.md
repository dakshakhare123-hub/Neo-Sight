# Comprehensive Color Mapping Matrix (`COLOUR_MAP.md`)

**Date:** October 30, 2026  
**Palette Source:** [Color Hunt #4c2365 / #7f5d99 / #9e7eb5 / #c4a4da](https://colorhunt.co/palette/4c23657f5d999e7eb5c4a4da)  
**Standard:** WCAG 2.1 AA ($\ge 4.5:1$ Normal Text, $\ge 3.0:1$ Large Text & UI Boundaries)  

---

## 1. Palette Specification & Derived Tokens

| Token Name | Hex Code | Relative Luminance ($L$) | Role & Purpose |
| :--- | :--- | :---: | :--- |
| **`plum-950`** (Deep Plum Black) | `#2A1138` | `0.0118` | Primary high-contrast text, modal headings, metric values (15.50:1 on page background) |
| **`plum-900`** (Deep Plum) | `#4C2365` | `0.0368` | Primary action buttons, active navigation pills, brand titles, focused borders |
| **`plum-800`** (Plum Shade) | `#5D2F7B` | `0.0612` | Hover state for primary buttons, active badge borders |
| **`violet-700`** (Violet) | `#7F5D99` | `0.1464` | Secondary actions, active tab borders, prominent icons, focus rings (5.35:1 on white) |
| **`soft-violet`** (Soft Violet) | `#9E7EB5` | `0.2553` | Large icons, decorative borders, camera HUD reticle bounds (3.44:1 - non-body text only) |
| **`lavender-300`** (Lavender) | `#C4A4DA` | `0.4335` | Card borders, subtle tag fills, table headers, timeline card frames |
| **`lavender-100`** (Light Lavender) | `#EFE8F5` | `0.8266` | Subtle badge backgrounds, selected card washes, input field fills |
| **`lavender-50`** (Near-White BG) | `#F7F3FA` | `0.9078` | Global page background, modal backdrop card surfaces |
| **`white`** (Pure White) | `#FFFFFF` | `1.0000` | Card surfaces, modal surfaces, primary button text |
| **`muted-body`** (Plum-Slate) | `#4E3A5A` | `0.0520` | Standard body paragraphs, instructional copy (9.22:1 on page background) |
| **`muted-secondary`** (Subtle Plum) | `#725B7E` | `0.1332` | Secondary metadata, timestamps, helper labels (5.45:1 on page background) |

---

## 2. Palette-Harmonized Medical Status Tokens

| Status Concept | Color Name | Hex Code | Background Tint | Border Tint | Icon & Non-Color Cue | WCAG Contrast on White |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: |
| **No Visible Signs** | Sage-Emerald | `#1E6F43` | `#F0F8F3` | `#C2E2CF` | `shield-check` + "NO VISIBLE SIGNS" text | **6.16:1** (AA) |
| **Possible Jaundice** | Crimson-Plum | `#8F1D40` | `#FDF2F4` | `#F5C2CD` | `alert-triangle` + "CLINICAL EVALUATION ADVISED" text | **8.69:1** (AAA) |
| **Inconclusive** | Amber-Gold | `#9E5700` | `#FEF9F0` | `#F5DEC2` | `alert-circle` + "INCONCLUSIVE — REFERRAL ADVISED" text | **5.50:1** (AA) |

---

## 3. Class-by-Class UI Transformation Map

### 3.1 Backgrounds & Surfaces
| Existing Tailwind Class | Role | New Class / Token | Replacement Justification |
| :--- | :--- | :--- | :--- |
| `bg-slate-50` | Main application background | `bg-plum-50/60` (`#F7F3FA`) | Near-white lavender page background; soothing and glare-free |
| `bg-slate-100` | Secondary surface / container fill | `bg-plum-100/70` (`#EFE8F5`) | Soft lavender tint for grouped containers and timeline items |
| `bg-slate-200` | Inactive pill / divider fill | `bg-plum-200/60` (`#E2D5EC`) | Clear visual boundary with lavender tone |
| `bg-teal-50` | Active card / feature highlight | `bg-plum-50` (`#F7F3FA`) | Subtle lavender-plum tint |
| `bg-teal-50/20`, `bg-teal-50/30` | Active timeline item / table wash | `bg-violet-50/40` | Soft highlight preserving selection contrast |
| `bg-teal-600` | Primary action button / active step | `bg-plum-900` (`#4C2365`) | Core Deep Plum brand token |
| `hover:bg-teal-700` | Primary button hover | `hover:bg-violet-700` (`#7F5D99`) | Smooth transition from Deep Plum to Violet |
| `from-teal-600 to-cyan-500` | Brand gradients | `from-plum-900 to-violet-700` | Harmonized deep plum to vibrant violet gradient |

### 3.2 Typography & Text Colors
| Existing Tailwind Class | Role | New Class / Token | WCAG Contrast vs Surface |
| :--- | :--- | :--- | :---: |
| `text-slate-900` | Headings and primary titles | `text-plum-950` (`#2A1138`) | **15.50:1** (AAA) |
| `text-slate-800` | Subheadings and metric labels | `text-plum-900` (`#4C2365`) | **11.04:1** (AAA) |
| `text-slate-700` | Table headers and bold body text | `text-plum-800` (`#4E3A5A`) | **9.22:1** (AAA) |
| `text-slate-600` | Standard body text & descriptions | `text-plum-700` (`#5E4968`) | **7.29:1** (AAA) |
| `text-slate-500` | Secondary metadata and helpers | `text-plum-600` (`#725B7E`) | **5.45:1** (AA) |
| `text-slate-400` | Tertiary captions and unit labels | `text-plum-500` (`#856E91`) | **4.52:1** (AA) |
| `text-teal-700`, `text-teal-800` | Brand accent text and links | `text-plum-900` / `text-violet-700` | **11.04:1** / **4.88:1** (AA) |
| `text-teal-600` | Interactive icon accents | `text-violet-700` (`#7F5D99`) | **5.35:1** (AA) |

### 3.3 Borders, Outlines & Rings
| Existing Tailwind Class | Role | New Class / Token | Visual Effect |
| :--- | :--- | :--- | :--- |
| `border-slate-100` | Subtle internal card divider | `border-plum-100/80` (`#EFE8F5`) | Crisp, clean separation without harsh contrast |
| `border-slate-200` | Card and container boundary | `border-plum-200/80` (`#E2D5EC`) | Soft lavender structure |
| `border-slate-200/80` | High-visibility container edge | `border-lavender-300/60` | Defined card edge |
| `border-teal-200/60` | Accent badge border | `border-lavender-300/80` | Elegant lavender outline |
| `border-teal-500`, `border-teal-600` | Active tab and selection outline | `border-plum-900` (`#4C2365`) | Unambiguous active indicator |
| `ring-teal-500`, `ring-teal-500/20` | Focus ring & active glow | `ring-violet-600` / `ring-violet-500/30` | High-contrast plum/violet focus indicator |

### 3.4 Canvas & Viewfinder Overlays
| Canvas Property | Location | Old Value | New Value | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `ctx.strokeStyle` | Biometric Face-Oval Guide | `rgba(13, 148, 136, 0.5)` (Teal) | `rgba(158, 126, 181, 0.75)` (Soft Violet) | High visibility over neonatal skin tones |
| `ctx.strokeStyle` | Forehead Reticle Target | `rgba(14, 165, 233, 0.45)` (Sky) | `rgba(196, 164, 218, 0.70)` (Lavender) | Distinct dash pattern and color |
| `ctx.fillStyle` | Target Label Pill Background | `rgba(15, 23, 42, 0.75)` (Slate) | `rgba(42, 17, 56, 0.85)` (Deep Plum Black) | High contrast behind white label text |
| `ctx.fillStyle` | Target Label Text | `#ffffff` | `#ffffff` | Contrast >16:1 against Deep Plum background |
