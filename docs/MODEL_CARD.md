# Model Card: NeoScan Newborn Jaundice Screening System

## Model Details
- **Developer:** NeoScan Pediatric Medical AI Team
- **Model Architecture:** Support Vector Machine with Radial Basis Function (RBF) Kernel (`sklearn.svm.SVC`)
- **Input Modality:** RGB Smartphone or Digital Camera Newborn Photograph (Forehead, Cheeks, or Sternum)
- **Feature Pipeline:** `UnifiedPreprocessor`
  - Laplacian variance sharpness gating (threshold $\ge 20.0$)
  - Sensor over/underexposure clipping filtration
  - Shades-of-Gray color constancy normalization (Minkowski norm $p=6$)
  - Dual-space skin segmentation (YCbCr + HSV)
  - 20-dimensional biometric feature extraction (CIELAB, YCrCb, Bilirubin Index $BI_x$)
- **Output:**
  - Jaundice Probability Score ($0.0 - 1.0$)
  - Screening Triage Recommendation:
    - Probability $< 0.16$: *Routine Observation Suggested*
    - Probability $\ge 0.16$: *Pediatric Consultation Recommended*
  - Out-of-Distribution (OOD) Quality & Reliability Advisory

---

## Intended Use
- **Primary Purpose:** Non-invasive, pre-screening risk stratification adjuvant for neonatal jaundice in home or primary care outpatient settings.
- **Target Population:** Full-term and near-term neonates aged $1 - 28$ days.
- **Contraindications & Limitations:**
  - **NOT A STANDALONE DIAGNOSTIC DEVICE.** It does NOT replace laboratory Total Serum Bilirubin (TSB) or transcutaneous bilirubinometer (TcB) measurements.
  - Not validated for premature infants ($< 35$ weeks gestational age) or neonates undergoing active phototherapy.
  - Not validated on heavily pigmented skin types (Fitzpatrick V-VI) due to demographic limitations in public training cohorts.

---

## Ethical Considerations & Skin Tone Equity
- **Data Provenance:** Trained on BioMedInformatics NJN Iraq cohort (2023) and validated across Ghaem Hospital Iran cohort (2020).
- **Skin Tone Bias Disclaimer:** Publicly accessible neonatal datasets primarily represent Middle Eastern / Fitzpatrick skin types II-IV. Cutaneous melanin absorbs light in the same spectral region as bilirubin, potentially altering optical yellowing thresholds in darker skin tones.
- **Safety Mitigation:** The app enforces explicit clinical advisories that visual screening is supportive only and urges immediate clinical evaluation if lethargy, poor feeding, or cephalocaudal yellowing progression is observed.

---

## Performance Summary (Held-Out Test Set, $N=153$)
- **ROC-AUC:** 0.8194
- **PR-AUC:** 0.6027
- **Sensitivity (@ T=0.16):** 85.0% (95% CI: [72.7%, 95.1%])
- **Specificity (@ T=0.16):** 62.8% (95% CI: [53.8%, 71.3%])
- **Negative Predictive Value (NPV):** 92.2%
- **Out-of-Distribution Rejection:** Mahalanobis distance gating ($Cutoff = 64.4$) rejects non-standard optics and anomalous lighting.
