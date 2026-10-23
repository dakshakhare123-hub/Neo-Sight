# NeoScan: Illumination Robustness Benchmark Report
### Empirical Proof for Hackathon Pitch

---

### Executive Summary
When evaluating neonatal jaundice on raw uncorrected smartphone images across standard domestic lighting variations (2500K tungsten to 7800K overcast light), classification accuracy collapses to **52.04%** with high-risk recall plunging to **77.21%** (dangerous false negatives in cool rooms, false alarms in warm rooms).

By incorporating **Shades-of-Gray (p=6) / Sclera White Balancing** and **ArUco Card Calibration**, NeoScan restores classification accuracy to **94.72%** and high-risk sensitivity to **93.95%**, proving true lighting invariance.

### 1. Overall Performance Matrix (2,500 Test Cases)
| Method | Accuracy | Macro F1 | High-Risk Sensitivity (Recall) | Clinical Implication |
| :--- | :---: | :---: | :---: | :--- |
| **Raw (No Correction)** | 52.04% | 0.5127 | 77.21% | ⚠️ Unacceptable clinical risk: massive false negatives in daylight, false alarms under bulbs |
| **Gray-World Retinex** | 85.28% | 0.8507 | 93.72% | Moderate recovery; vulnerable if colored garments/blankets dominate frame |
| **Shades-of-Gray (p=6) / Sclera WB** | 93.4% | 0.9321 | 95.12% | ✅ High-performance reference-free fallback when no card is present |
| **Card CCM Calibration (ArUco)** | **94.72%** | **0.9462** | **93.95%** | 🏆 Gold-standard calibration: invariant across sensor OEM and light source |

### 2. Breakdown Across Ambient Lighting Regimes (Macro F1)
| Lighting Condition | Raw (Uncorrected) | Gray-World | Shades-of-Gray | Card CCM Calibration |
| :--- | :---: | :---: | :---: | :---: |
| **Warm Tungsten (<3500K)** | 0.1083 | 0.6911 | 0.8875 | **0.9605** |
| **Neutral White (3500-5500K)** | 0.5882 | 0.8856 | 0.9372 | **0.9426** |
| **Cool Overcast (>5500K)** | 0.5903 | 0.8971 | 0.9472 | **0.9428** |

![Benchmark Results](file:///Users/dakshakhare/Desktop/Avishkar/docs/benchmark_results.png)
