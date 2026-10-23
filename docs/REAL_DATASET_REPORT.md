# Real Clinical Dataset Training & Validation Report
## Trained on Neonatal Jaundice (NJN) Clinical Cohort

---

### 1. Dataset Provenance
- **Source**: Real Neonatal Jaundice dataset (761 clinical patient records & 760 infant photographs)
- **Normal Infants**: 561 subjects (physiologically normal baseline)
- **Jaundice Infants**: 200 subjects (clinically confirmed hyperbilirubinemia)
- **Stratification**: Jaundice cases are stratified into **Moderate Risk** ($BI_x \le 0.40$) and **High Risk** ($BI_x > 0.40$) to match the AAP 2022 clinical triage guidelines.

### 2. Validation Metrics on Holdout Clinical Test Set (20% Split, N=153)
- **Overall Accuracy**: **96.73%**
- **Macro F1-Score**: **0.9498**
- **High-Risk Sensitivity (Recall)**: **100.0%** (Zero missed severe jaundice cases)
- **Low-Risk Specificity (Recall)**: **97.35%** (Virtually eliminates false alarms)

### 3. Confusion Matrix
```
               precision    recall  f1-score   support

    HIGH_RISK       0.95      1.00      0.98        21
     LOW_RISK       0.98      0.97      0.98       113
MODERATE_RISK       0.89      0.89      0.89        19

     accuracy                           0.97       153
    macro avg       0.94      0.96      0.95       153
 weighted avg       0.97      0.97      0.97       153

```

![Real Dataset Confusion Matrix](file:///Users/dakshakhare/Desktop/Avishkar/docs/real_dataset_confusion_matrix.png)
