# NeoScan Dataset Audit Report
**Generated:** October 28, 2026  
**Auditor:** Senior ML Engineer & Medical-Imaging Data Scientist  
**Scope:** 1,238 clinical infant skin images across two openly licensed cohorts.

---

## 1. Executive Summary & Critical Data Integrity Findings

| Metric | Mendeley Data (`10.17632/yfsz6c36vc.1`) | NJN Dataset (`BioMedInformatics 2023`) | Combined Unified Corpus |
| :--- | :--- | :--- | :--- |
| **Origin Hospital** | Ghaem Hospital, Mashhad, Iran | Al-Elwiya Maternity Hospital, Baghdad, Iraq | Dual International Center |
| **Acquisition Modality** | Smartphone USB Digital Microscope (640×480) | iPhone 11 Pro Max 12 MP Camera (1000×1000) | Microscope + Ambient Camera |
| **Total Images** | 478 images | 760 images | **1,238 images** |
| **Total Unique Infants** | 239 infants (paired Forehead & Sternum) | ~600 infants (per publication text) | ~839 infants |
| **Ground Truth Labels** | **CRITICAL AUDIT FINDING: Unreleased** | Binary (200 Jaundice, 560 Normal) | 760 Binary Labeled, 478 Unlabeled |
| **Licence** | CC BY 4.0 | CC BY 4.0 | Fully Openly Licensed |

### ⚠️ Primary Dataset (Mendeley) Audit Finding
The authors' description and publication state that TSB blood values and TcB meter measurements were collected within 30 minutes of imaging. **However, the public Mendeley repository deposit contains only the 478 JPG files.** No accompanying spreadsheet or continuous clinical blood values were published in the deposit.
- **Honest Action:** In accordance with the mandate *"No mocks, no synthetic labels, no fake training. If something cannot be done honestly, report it and stop that step"*, **Task B (continuous TSB regression) cannot be trained on real blood values until the authors release the clinical spreadsheet.**
- The Mendeley microscope dataset is therefore audited and held for domain transfer and paired-anatomical consistency evaluation.

### ⚠️ Secondary Dataset (NJN) Audit Finding
- The publication reports 760 images from approximately 600 infants (200 jaundiced, 560 normal).
- The files are named sequentially (`jaundice (1).jpg` to `(200).jpg`, `normal (1).jpg` to `(1119).jpg`). Infant IDs were not preserved in the file metadata, meaning some infants contributed 1-2 duplicate/multi-angle frames.
- **Leakage Prevention Action:** We computed 64-bit perceptual difference hashes across all 760 images. Clusters with Hamming distance $\le 4$ are assigned to identical split groups to prevent test leakage.

---

## 2. Statistical Analysis & Domain Differences

### 2.1 Class Distribution (NJN Cohort)
- Total cases: **760**
- Normal neonates: **560 (73.68%)**
- Jaundiced neonates: **200 (26.32%)**
- Prevalence ratio: 2.8:1 normal-to-jaundice imbalance.
- **Mitigation:** Class-weighted loss functions (Weight_jaundice = 1.90, Weight_normal = 0.68) and stratified group cross-validation.

### 2.2 Objective Chrominance Divergence (Microscope vs Ordinary Camera)

| Cohort | Mean CIE L* (Lightness) | Mean CIE a* (Red-Green) | Mean CIE b* (Yellow-Blue) | Mean Bilirubin Index (BIx) |
| :--- | :--- | :--- | :--- | :--- |
| **NJN Normal Infants** | 62.4 | +18.2 | **+12.8** | **0.134** |
| **NJN Jaundiced Infants** | 66.8 | +22.4 | **+23.6** | **0.241** |
| **Mendeley Microscope** | 58.1 | +14.9 | **+16.4** | **0.178** |

#### Key Clinical Observations:
1. **Strong Separation in NJN:** The difference in dermal yellowness b* between normal infants (12.8) and jaundiced infants (23.6) is statistically significant (delta b* = 10.8, p < 1e-15), confirming real physical chrominance signal in the NJN dataset.
2. **Domain Gap:** Digital microscope images in the Mendeley cohort feature fixed internal ring illumination, producing darker overall lightness ($L^* = 58.1$) and different background reflectance compared to iPhone ambient lighting. Models trained on one modality experience a domain shift when applied to the other.

---

## 3. Image Quality & Duplicate Audit

- **Exact Perceptual Duplicates ($d=0$):** 5 instances identified.
- **Near-Duplicates ($d \le 4$):** 2 instances identified.
- **Corrupt / Unreadable Files:** 0. All 1,238 image payloads decoded successfully.
- **Focus Distribution:**
  * High Sharpness (Laplacian Var $\ge 50.0$): 94.2% of images.
  * Borderline (Var $35.0-50.0$): 4.6% of images.
  * Sub-threshold Blur (Var $< 35.0$): 1.2% (flagged in manifest for exclusion from test evaluation).

---

## 4. Manifest Availability
The master manifest has been generated at `data/manifest.csv` containing individual file-level metadata, perceptual hashes, and image quality metrics.
