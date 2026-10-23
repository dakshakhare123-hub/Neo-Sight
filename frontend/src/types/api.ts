export interface QualityGateMetrics {
  passed: boolean;
  sharpness_score: number;
  is_sharp: boolean;
  valid_pixel_ratio: number;
  overexposed_ratio: number;
  underexposed_ratio: number;
  warnings: string[];
}

export interface LightingCondition {
  category: "LOW_LIGHT" | "WARM_INCANDESCENT" | "NEUTRAL_INDOOR" | "BALANCED_DAYLIGHT" | "COOL_OVERCAST";
  label: string;
  description: string;
  cct_kelvin: number;
  illuminant_rgb: [number, number, number];
  norm_illuminant: [number, number, number];
  mean_luminance: number;
  icon: string;
}

export interface FusedBiomarkers {
  fused_lab_b_star: number;
  fused_bilirubin_index: number;
  fused_cr_cb_ratio: number;
  fused_yellow_blue_diff: number;
  total_confidence_weight: number;
}

export interface RiskAssessment {
  risk_category: "LOW_RISK" | "MODERATE_RISK" | "HIGH_RISK";
  title: string;
  color: string;
  badge: string;
  confidence_percent: number;
  equivalent_tsb_range: string;
  class_probabilities: Record<string, number>;
  recommendation: string;
  disclaimer: string;
}

export interface AnalyzeResponse {
  success: boolean;
  active_correction_method: string;
  quality_gate: QualityGateMetrics;
  lighting_condition: LightingCondition;
  calibration_details: Record<string, any>;
  face_detection: {
    detected: boolean;
    method: string;
    rois_found: string[];
  };
  fused_biomarkers: FusedBiomarkers;
  roi_breakdown: Record<string, {
    available: boolean;
    quality_score: number;
    effective_weight: number;
    raw_b_star: number;
    corrected_b_star: number;
    corrected_bix: number;
  }>;
  risk_assessment: RiskAssessment;
  visualizations?: {
    corrected_image_base64?: string;
    diagnostic_overlay_base64?: string;
    yellowness_heatmap_base64?: string;
  };
}
