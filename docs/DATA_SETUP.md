# NeoScan Clinical Dataset Setup Guide
**Mandate:** Zero mocks, zero synthetic labels, fully reproducible datasets.

This document describes how to obtain and position the openly licensed clinical datasets required for training and validating NeoScan.

---

## 1. Directory Structure

Place raw datasets in the following exact directory hierarchy:

```
Avishkar/
└── data/
    └── raw/
        ├── mendeley/
        │   ├── Forehead/          <-- 239 images: 1.jpg to 240.jpg
        │   └── Sternum/           <-- 239 images: 1.jpg to 240.jpg
        └── njn/
            ├── jaundice/          <-- 200 images: jaundice (1).jpg to (200).jpg
            ├── normal/            <-- 560 images: normal (1).jpg to (1119).jpg
            └── Pythons_Code_AI_Testing_Data/
                └── Excel File/
                    └── train.csv  <-- 760 records with ground-truth binary labels
```

---

## 2. Dataset 1: Mendeley Data (Primary Microscope Cohort)

- **Dataset Name:** Neonatal Jaundice Assessment: A Dataset of Forehead and Sternum Images for Bilirubin Estimation
- **DOI:** [10.17632/yfsz6c36vc.1](https://doi.org/10.17632/yfsz6c36vc.1)
- **Repository URL:** https://data.mendeley.com/datasets/yfsz6c36vc
- **Licence:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Institution:** Ghaem Hospital, Mashhad University of Medical Sciences, Iran

### Download Instructions:
1. Visit https://data.mendeley.com/datasets/yfsz6c36vc/1.
2. Click **Download All** (.zip archive, approx. 70 MB).
3. Unzip into `data/raw/mendeley/` so that `Forehead/` and `Sternum/` folders are present.

### Important Disclosure Regarding Continuous TSB Labels:
The public deposit on Mendeley contains exclusively the 478 image files. The accompanying spreadsheet with continuous TSB/TcB values was not attached to the public release by the authors. 
- Continuous regression models cannot be trained without genuine blood labels.
- If you obtain the clinical spreadsheet directly from the authors (IR.MUMS.MEDICAL.REC.1400.271), place `clinical_tsb.csv` in `data/raw/mendeley/` to activate the continuous regression pipeline.

---

## 3. Dataset 2: NJN Dataset (Secondary Ambient Smartphone Cohort)

- **Dataset Name:** NJN: A Dataset for the Normal and Jaundiced Newborns
- **Citation:** BioMedInformatics 2023, 3(3), 543-552. https://doi.org/10.3390/biomedinformatics3030037
- **Repository URL:** https://zenodo.org/record/7825810
- **Licence:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Institution:** Al-Elwiya Maternity Teaching Hospital, Baghdad, Iraq

### Download Instructions:
1. Download `NJN.rar` from Zenodo repository `7825810`.
2. Extract into `data/raw/njn/`.
3. Verify that `jaundice/` contains 200 files, `normal/` contains 560 files, and `train.csv` is present.

---

## 4. Automated Verification

Run the dataset audit tool to verify integrity:
```bash
python3 ml/audit_dataset.py
```
If any file is corrupt or unreadable, the script reports the error and flags it in `data/manifest.csv`.
