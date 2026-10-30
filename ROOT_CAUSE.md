# Root Cause Analysis: Triage Recommendation Behavior

**Branch:** `fix/triage-always-consult`  
**Date:** 2026-10-30  
**Component:** `backend/app/core/triage_rules.py`, `frontend/src/triage.js`, `frontend/src/App.jsx`

---

## 1. Problem Statement

On the "Triage and Insights" page (Step 3), the clinical recommendation exhibited several defects:
1. The recommendation rendered "Paediatric consultation recommended" (or "Pediatric Consultation Recommended") regardless of whether the baby was normal or jaundiced, including cases where the CIE $b^*$ Cutaneous Yellowness scale displayed a "moderate" reading (14.0–20.0).
2. The recommendation strings did not strictly follow the clinical guidelines:
   - `possible_jaundice_signs` -> "Paediatric consultation recommended"
   - `inconclusive` -> "Inconclusive: retake the photo in even daylight; seek clinical assessment if you are concerned"
   - `no_visible_signs` -> "No visible signs detected. Continue routine monitoring" (never clearance or "no jaundice")
3. When analysis was pending or errored, the display state and recommendation binding were ambiguous between `headline`, `recommendation`, and `advice[0]`.

---

## 2. Root Cause Tracing

### Cause A: Dual-Layer Recommendation Mismatch in Frontend (`App.jsx` vs `triage.js`)
In `frontend/src/App.jsx`, `riskDetails` mapped:
- `title: triage.headline`
- `recommendation: triage.advice[0]`
While the UI template rendered:
- `<h1>{riskDetails.title}</h1>`
- `<p>{riskDetails.recommendation}</p>`

In `triage.js` and `backend/app/core/triage_rules.py`:
- `headline` for `possible_jaundice_signs` was `"Pediatric Consultation Recommended"` (American spelling) instead of the exact specification `"Paediatric consultation recommended"`.
- `headline` for `inconclusive` was `"Inconclusive: Retake in Daylight"` instead of the required `"Inconclusive: retake the photo in even daylight; seek clinical assessment if you are concerned"`.
- `headline` for `no_visible_signs` was `"No Visible Signs Detected — Routine Monitoring"` instead of `"No visible signs detected. Continue routine monitoring"`.
- The `recommendation` property was missing from `computeTriage`, causing consumers reading `.recommendation` to receive `advice[0]` rather than the primary triage verdict.

### Cause B: b* Yellowness vs Model Score Decoupling
In neonates, cutaneous yellowness $b^*$ can be in the moderate band (14.0–20.0) due to natural dermal melanin, hemoglobin, or mild non-pathological yellowness without indicating pathological hyperbilirubinemia.
When an image has a moderate $b^*$ (14.0–20.0) but normal ML score, the model correctly outputs `no_visible_signs`. However:
1. Explanatory text in `triage_rules.py` hardcoded `b* is within typical baseline limits` even when $b^* \ge 14.0$ (in the "moderate" band on the visualizer), creating a clinical contradiction for clinicians and parents.
2. The model score reason hardcoded a reference to `threshold 0.50` which conflicted with the actual `neoscan_ml` operating cutoff ($0.027$ / $0.061$).

### Cause C: Red-Flag Clinical Escalation Consistency
Red-flag patient risk factors (early onset $< 24$ hours, prematurity $< 37$ weeks, feeding difficulties or lethargy) must deterministically escalate urgency to `urgent` or `elevated` with clear clinical reasons, while healthy term infants with normal optical screening must deterministically receive routine observation.

---

## 3. Corrective Action Plan

1. **Pure Deterministic Function**: Ensure `compute_triage` in `backend/app/core/triage_rules.py`, `frontend/src/triage.js`, and inlined in `frontend/src/App.jsx` are 100% synchronized pure functions.
2. **Exact Required Headings and Recommendations**:
   - `possible_jaundice_signs`: `"Paediatric consultation recommended"` (Level: `elevated` / `urgent`)
   - `inconclusive`: `"Inconclusive: retake the photo in even daylight; seek clinical assessment if you are concerned"` (Level: `warning` / `urgent`)
   - `no_visible_signs`: `"No visible signs detected. Continue routine monitoring"` (Level: `normal`, escalated only when clinical red flags like age $<24$h are present)
   - `error` / `pending`: Level: `none`, no recommendation rendered.
3. **Property Binding**: Set both `recommendation` and `headline` to the primary verdict, and keep `advice` as the actionable guidance list.
4. **Band-Aware Reasons**: Align the explanatory reasons with the actual $b^*$ band (low $<14$, moderate $14-20$, elevated $\ge 20$) and ML score without false escalations.
