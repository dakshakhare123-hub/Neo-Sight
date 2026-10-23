"""
Clinical Risk Classification Engine
Loads the pre-trained, calibrated tree ensemble model, evaluates
the fused multi-ROI biomarker vector, and outputs risk stratification
with calibrated confidence intervals and actionable clinical advisories.

Design Rationale:
Direct numeric bilirubin prediction (e.g. "13.4 mg/dL") conveys false precision
and increases liability. Clinical guidelines (AAP 2022 Hyperbilirubinemia Guidelines)
rely on risk zone triage:
- LOW_RISK: Infant can be safely monitored at home.
- MODERATE_RISK: Transcutaneous or repeat screen recommended in 24-48 hours.
- HIGH_RISK: Urgent clinical serum bilirubin (TSB) blood test required.
"""

import os
import joblib
import numpy as np
from typing import Dict, Any, List

class JaundiceClassifier:
    def __init__(self, model_path: str = None):
        if model_path is None:
            # Look in ml/models under project root
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            model_path = os.path.join(base_dir, "ml", "models", "jaundice_risk_model.pkl")
            if not os.path.exists(model_path):
                # Check backend/../ml
                alt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "..", "ml", "models", "jaundice_risk_model.pkl")
                if os.path.exists(alt_path):
                    model_path = os.path.abspath(alt_path)
        self.model_path = model_path
        self._load_model()

    def _load_model(self):
        """Loads serialized model artifact."""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model artifact not found at: {self.model_path}. Run ml/train_model.py first.")
            
        artifact = joblib.load(self.model_path)
        self.model = artifact["model"]
        self.classes = artifact["classes"]
        self.features = artifact["features"]

    def predict_risk(self, fused_metrics: Dict[str, float]) -> Dict[str, Any]:
        """
        Takes the fused biomarker dictionary and evaluates risk category and confidence.
        fused_metrics keys:
            fused_lab_b_star, fused_bilirubin_index, fused_cr_cb_ratio, fused_yellow_blue_diff
        """
        # Vector order matching training: ["corr_b_star", "corr_bix", "corr_cr_cb", "corr_yb_diff"]
        x_vec = np.array([[
            fused_metrics.get("fused_lab_b_star", 15.0),
            fused_metrics.get("fused_bilirubin_index", 0.15),
            fused_metrics.get("fused_cr_cb_ratio", 1.1),
            fused_metrics.get("fused_yellow_blue_diff", 0.25)
        ]], dtype=np.float64)

        # Predict calibrated class probabilities
        probas = self.model.predict_proba(x_vec)[0]
        pred_idx = int(np.argmax(probas))
        predicted_class = self.classes[pred_idx]
        confidence = float(probas[pred_idx])

        # Map to clinical descriptions and urgency
        class_probas = {cls_name: round(float(prob), 4) for cls_name, prob in zip(self.classes, probas)}

        if predicted_class == "HIGH_RISK":
            title = "High Risk of Hyperbilirubinemia"
            color = "#dc2626"  # Red
            badge = "URGENT CLINICAL EVALUATION"
            recommendation = (
                "Optical yellowness strongly exceeds physiological baseline. "
                "Schedule an urgent pediatric evaluation for Total Serum Bilirubin (TSB) blood test within 6-12 hours."
            )
            equivalent_tsb_est = "> 14 mg/dL"
        elif predicted_class == "MODERATE_RISK":
            title = "Moderate Risk / Active Monitoring"
            color = "#d97706"  # Amber
            badge = "REPEAT SCREENING IN 24H"
            recommendation = (
                "Mild-to-moderate dermal yellowness detected. "
                "Ensure frequent feeding (8-12 times daily) and repeat screening with NeoScan or consult a pediatrician in 24 hours."
            )
            equivalent_tsb_est = "8 - 14 mg/dL"
        else: # LOW_RISK
            title = "Low Risk / Physiological Baseline"
            color = "#16a34a"  # Green
            badge = "ROUTINE OBSERVATION"
            recommendation = (
                "Dermal color metrics align with normal physiological neonatal limits. "
                "Continue standard neonatal care and routine pediatric well-baby checks."
            )
            equivalent_tsb_est = "< 8 mg/dL"

        return {
            "risk_category": predicted_class,
            "title": title,
            "color": color,
            "badge": badge,
            "confidence_percent": round(confidence * 100, 1),
            "equivalent_tsb_range": equivalent_tsb_est,
            "class_probabilities": class_probas,
            "recommendation": recommendation,
            "disclaimer": "Screening aid only, not an approved diagnostic device. Consult a licensed pediatrician for confirmed laboratory bilirubin testing."
        }
