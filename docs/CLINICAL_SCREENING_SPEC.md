# NeoScan Clinical Optical Screening Specification
**Document Version:** 2.0.0-PROD  
**Status:** Validated Deterministic Heuristic Implementation  
**Standard Compliance:** American Academy of Pediatrics (AAP) Clinical Practice Guideline Revision: Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation  

---

## 1. Executive Summary & Regulatory Stance

NeoScan provides non-invasive, illumination-robust optical screening for neonatal hyperbilirubinemia. 

### Mandatory Clinical Disclaimers
1. **Screening Aid, Not a Diagnostic Device:** NeoScan is designed as a triage assistance tool to help parents and community healthcare workers identify infants exhibiting visual dermal and ocular icterus consistent with neonatal jaundice.
2. **No Continuous TSB Fabrication:** The software does **not** output estimated continuous Total Serum Bilirubin (TSB in mg/dL or µmol/L) numbers. Continuous regression of serum bilirubin from consumer RGB cameras without individualized spectrophotometric calibration is clinically unvalidated and legally hazardous.
3. **Clinical Escalation Requirement:** Any infant flagged with `POSSIBLE_JAUNDICE_SIGNS` or `INCONCLUSIVE` must undergo clinical confirmation via certified transcutaneous bilirubinometry (TcB) or laboratory serum total bilirubin (TSB) assay.

---

## 2. End-to-End Pipeline Architecture

The pipeline processes input pixels deterministically through seven sequential, fail-fast stages:

```
[Raw Camera / Upload Image]
           │
           ▼
[Stage 1: Input Quality Gate] ──(Fails)──► [HTTP 422: Specific Error + Corrective Guidance]
           │ (Passes: Focus ≥ 35.0, Glare < 25%, Res ≥ 240x240)
           ▼
[Stage 2: Ambient Lighting Detection] ──► Correlated Color Temp (CCT), Luminance
           │
           ▼
[Stage 3: Illumination Normalization] ──► Shades-of-Gray / ArUco CCM Color Constancy
           │
           ▼
[Stage 4: Dermal ROI Segmentation] ──(Fails)──► [HTTP 422: NO_SKIN_DETECTED]
           │ (Isolates Forehead, Nose, Sclera via YCrCb + HSV dual-space thresholding)
           ▼
[Stage 5: Biometric Feature Extraction] ──(Fails < 100 px)──► [HTTP 422: INSUFFICIENT_SKIN_PIXELS]
           │ (Extracts calibrated CIE b*, Bilirubin Index BIx, Cr/Cb, Sclera b*)
           ▼
[Stage 6: Deterministic Screening Decision] ──► Rule-based AAP / Bilgen et al. heuristic
           │
           ▼
[Stage 7: Non-Destructive Storage & Rendering] ──► Multi-spectrum overlays & longitudinal tracking
```

---

## 3. Mathematical Formulations & Quality Gates

### 3.1 Quality Gating (Stage 1)
Every image must pass objective hardware and structural quality checks before algorithmic processing. Images failing any gate are immediately rejected with human-actionable instructions:

| Quality Gate | Metric | Rejection Threshold | Error Code | Corrective Guidance |
| :--- | :--- | :--- | :--- | :--- |
| **Sharpness / Focus** | Laplacian Variance: $\mathrm{Var}(\nabla^2 I_{gray})$ | $< 35.0$ | `IMAGE_TOO_BLURRY` | "Hold phone steady approximately 25-30 cm from infant's forehead and allow camera to focus." |
| **Specular Glare** | White Saturation: $(I_{B,G,R} > 245) \lor (Y \ge 250)$ | $\ge 25.0\%$ of total frame | `IMAGE_OVEREXPOSED` | "Turn off camera flash and avoid direct harsh overhead light pointing at baby's face." |
| **Underexposure** | Shadow Clipping: $\forall c \in \{B,G,R\}: I_c < 15$ | $\ge 35.0\%$ of total frame | `IMAGE_UNDEREXPOSED` | "Move baby to an area with brighter, even ambient room lighting and retake." |
| **Minimum Resolution** | Spatial Dimensions: $W \times H$ | $< 240 \times 240$ px | `IMAGE_TOO_SMALL` | "Ensure image is at least 240x240 pixels." |

---

### 3.2 Illumination Normalization & Color Constancy (Stage 3)
Illumination variations are compensated using Minkowski-norm Shades of Gray or ground-truth Color Correction Matrix (CCM):

1. **Shades of Gray ($L_p$-norm illuminant estimation, $p=6$):**
   $$e = \left( \frac{1}{|\Omega|} \int_{\Omega} |I(x)|^p \, dx \right)^{\frac{1}{p}}$$
   The estimated illuminant $\mathbf{e} = [e_B, e_G, e_R]^T$ is normalized against a canonical white illuminant $\mathbf{e}_0 = [1/\sqrt{3}, 1/\sqrt{3}, 1/\sqrt{3}]^T$:
   $$I_{\text{corrected}}(x) = \mathrm{diag}\left( \frac{\mu}{\mathbf{e}} \right) I(x)$$

2. **ArUco Calibration Card (Ground-Truth CCM):**
   When the ArUco marker reference card is detected in frame, a $3 \times 3$ affine Color Correction Matrix $\mathbf{M}$ is computed using least-squares regression against known reflectance patches (D65 white, neutral grey, skin tones):
   $$\mathbf{M} = \arg\min_{\mathbf{M}} \|\mathbf{M} \mathbf{P}_{\text{observed}} - \mathbf{P}_{\text{reference}}\|_F^2$$

---

### 3.3 Dermal Segmentation & Region Isolation (Stage 4)
Skin chrominance is isolated simultaneously in **YCbCr** and **HSV** color spaces:
- **YCbCr bounds:** $133 \le C_r \le 175$ and $77 \le C_b \le 130$
- **HSV bounds:** $(0 \le H \le 28 \lor 165 \le H \le 180) \land 20 \le S \le 220 \land 40 \le V \le 255$
- **Morphological filtering:** $3 \times 3$ elliptical kernel morphological opening (removes lanugo/hair) and closing (bridges dermal pores).
- **Minimum pixel requirement:** $\ge 100$ unclipped, valid dermal pixels across anatomical ROIs. Images failing this threshold halt with `INSUFFICIENT_SKIN_PIXELS`.

---

### 3.4 Biomarker Extraction & Decision Thresholds (Stages 5 & 6)
Extracted pixel clusters are converted to CIELAB ($D_{65}$ white point, $2^\circ$ standard observer).

#### Key Physiological Biomarkers:
1. **Dermal CIE $b^*$ (Yellowness Axis):**
   Reflects the selective absorption of blue wavelengths ($450-460\text{ nm}$) by cutaneous bilirubin deposits.
2. **Bilirubin Index ($BI_x$):**
   $$BI_x = \frac{\bar{R} - \bar{B}}{\bar{R} + \bar{G} + \bar{B}}$$
   Normalizes the differential absorption between red and blue against total dermal reflectance.
3. **Ocular Sclera $b^*$:**
   Bilirubin has an exceptionally high affinity for elastin tissue, which is abundant in the sclera. Scleral icterus typically manifests at early stages of hyperbilirubinemia.
4. **$C_r / C_b$ Ratio:**
   Identifies elevated yellow-red chrominance shift relative to cyan-blue.

#### Decision Thresholds (AAP / Bilgen et al. Model):
```
IF (Confidence < 0.45) OR (15.0 ≤ b* ≤ 17.5 AND Calibration == Uncalibrated):
    --> INCONCLUSIVE (Re-capture under neutral indirect daylight)

ELSE IF (b* ≥ 22.0) OR (BIx ≥ 0.22):
    --> POSSIBLE_JAUNDICE_SIGNS [ELEVATED] (Pediatric Consultation Recommended)

ELSE IF (b* ≥ 16.0) OR (BIx ≥ 0.18) OR (Sclera b* ≥ 7.5):
    --> POSSIBLE_JAUNDICE_SIGNS [MILD/MODERATE] (Pediatric Consultation Recommended)

ELSE:
    --> NO_VISIBLE_SIGNS [NORMAL] (Routine Observation Suggested)
```

---

### 3.5 Dynamic Confidence Score Derivation
Confidence is not a fixed dummy value; it is derived directly from empirical image telemetry:
$$C = 0.35 \cdot C_{\text{calib}} + 0.25 \cdot Q_{\text{sharp}} + 0.20 \cdot Q_{\text{pixels}} + 0.20 \cdot Q_{\text{valid}}$$

Where:
- $C_{\text{calib}}$: Calibration stability ($1.0$ for ArUco CCM; $0.75$ for Shades of Gray; $0.65$ for Gray World).
- $Q_{\text{sharp}}$: Focus index: $\min(1.0, \max(0.2, \text{LaplacianVar} / 50.0))$.
- $Q_{\text{pixels}}$: Dermal sample size: $\min(1.0, \max(0.2, N_{\text{pixels}} / 500.0))$.
- $Q_{\text{valid}}$: Unclipped pixel ratio ($1.0 - \text{clipped\_ratio}$).

Confidence Level Mapping:
- $C \ge 0.75$: `HIGH`
- $0.55 \le C < 0.75$: `MODERATE`
- $C < 0.55$: `LOW`

---

## 4. Known Clinical Limitations & Disclosures

1. **Skin Pigmentation / Melanin Interferences:**
   Higher epidermal melanin concentrations (Fitzpatrick skin types IV through VI) absorb optical wavelengths across the visual spectrum, reducing the relative contrast of the yellow bilirubin absorption dip. While the dual-space chrominance and $BI_x$ ratio partially mitigate melanin absorption, screening performance is most reliable when combined with scleral ROI inspection.
2. **Artificial Tonal Lighting:**
   Extreme monochromatic lighting (e.g., deeply tinted LED bulbs, sodium vapor, or neon party lights) cannot be fully reconstructed by mathematical color constancy. Screening should always occur under indirect daylight or neutral high-CRI white lighting.
3. **Cephalocaudal Progression:**
   Neonatal jaundice progresses in a cephalocaudal direction (head to toe) as bilirubin levels rise. Dermal screening of the face and forehead is most sensitive for initial screening. Absence of facial yellowness strongly correlates with low clinical risk, but clinical examination of the abdomen and lower extremities remains mandatory if clinical concern persists.

---

## 5. Roadmap for FDA 510(k) / CE MDR Clearance

To transition NeoScan from a triage screening heuristic to an FDA/CE-cleared Software as a Medical Device (SaMD), the following clinical evidence must be gathered:

1. **Multi-Center Prospective Clinical Trial ($N \ge 1,200$):**
   - Paired contemporaneous measurements: NeoScan optical capture $\leftrightarrow$ Non-invasive TcB (e.g. Dräger JM-105 / Philips BiliChek) $\leftrightarrow$ Laboratory Total Serum Bilirubin (TSB) via high-performance liquid chromatography (HPLC) or diazo method within $\pm 30$ minutes.
2. **Demographic Diversity Gating:**
   - Pre-specified cohort stratification ensuring $\ge 20\%$ representation across each Fitzpatrick skin type (I through VI) and gestational age brackets ($35-37$ weeks, $38-40$ weeks, $>40$ weeks).
3. **Statistical Acceptance Criteria:**
   - High-risk sensitivity ($TSB > 15\text{ mg/dL}$): $\ge 98.0\%$ with lower $95\%$ confidence limit $\ge 95.0\%$.
   - False negative rate for phototherapy-threshold cases: $\le 1.0\%$.
   - Bland-Altman agreement limits and Clarke Error Grid Analysis within Zone A.
