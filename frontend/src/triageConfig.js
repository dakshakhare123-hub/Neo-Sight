/**
 * NeoScan Triage Engine Configuration
 * Standard clinical thresholds and guidance conforming to AAP 2022 Guidelines.
 */

export const TRIAGE_CONFIG = {
  // Model decision threshold
  MODEL_THRESHOLD: 0.50,
  
  // CIE b* yellowness screening bands
  B_STAR_BANDS: {
    LOW_MAX: 14.0,
    MODERATE_MAX: 20.0
  },
  
  // Clinical red flags
  EARLY_ONSET_HOURS: 24.0,
  
  // Accessible, high-contrast palette tokens (WCAG AA/AAA compliant)
  COLORS: {
    URGENT: "#8F1D40",    // Crimson-Plum (WCAG AAA 8.69:1 on white)
    ELEVATED: "#8F1D40",  // Crimson-Plum
    WARNING: "#9E5700",   // Amber-Gold (WCAG AA 5.50:1 on white)
    NORMAL: "#1E6F43",    // Sage-Emerald (WCAG AA 6.16:1 on white)
    NEUTRAL: "#725B7E"    // Muted Plum (WCAG AA 5.12:1 on white)
  },
  
  DISCLAIMER: (
    "NeoScan is an AI-assisted screening companion designed to support parents and pediatric care teams. " +
    "It is not an invasive diagnostic device and does not replace confirmed laboratory serum bilirubin (TSB) " +
    "or clinical transcutaneous bilirubin (TcB) testing. Always seek medical guidance from a licensed pediatrician."
  )
};
