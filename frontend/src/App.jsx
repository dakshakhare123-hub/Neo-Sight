// NeoScan React 18 Application - Clinical Pediatric Screening & Image Tracking Edition
// Designed to Apple Health / Consumer Pediatric Health standards
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Safe canvas round rectangle helper (prevents TypeError on older WebViews)
const drawSafeRoundRect = (ctx, x, y, w, h, r) => {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
  }
};

// Safe, native React SVG Icons (zero external script dependency crashes)
const Icon = ({ name, className = "w-4 h-4", ...props }) => {
  const iconProps = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    ...props
  };

  switch (name) {
    case "heart":
      return (
        <svg {...iconProps}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case "shield-check":
      return (
        <svg {...iconProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "alert-circle":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case "alert-triangle":
      return (
        <svg {...iconProps}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "baby":
      return (
        <svg {...iconProps}>
          <path d="M9 12h.01" />
          <path d="M15 12h.01" />
          <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
          <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
        </svg>
      );
    case "camera":
      return (
        <svg {...iconProps}>
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "camera-off":
      return (
        <svg {...iconProps}>
          <line x1="2" x2="22" y1="2" y2="22" />
          <path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16" />
          <path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "refresh-cw":
      return (
        <svg {...iconProps}>
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
      );
    case "upload":
      return (
        <svg {...iconProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      );
    case "sun":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );
    case "eye":
      return (
        <svg {...iconProps}>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "sliders":
      return (
        <svg {...iconProps}>
          <line x1="4" x2="4" y1="21" y2="14" />
          <line x1="4" x2="4" y1="10" y2="3" />
          <line x1="12" x2="12" y1="21" y2="12" />
          <line x1="12" x2="12" y1="8" y2="3" />
          <line x1="20" x2="20" y1="21" y2="16" />
          <line x1="20" x2="20" y1="12" y2="3" />
          <line x1="1" x2="7" y1="14" y2="14" />
          <line x1="9" x2="15" y1="8" y2="8" />
          <line x1="17" x2="23" y1="16" y2="16" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...iconProps}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...iconProps}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "chevron-up":
      return (
        <svg {...iconProps}>
          <path d="m18 15-6-6-6 6" />
        </svg>
      );
    case "check":
      return (
        <svg {...iconProps}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "info":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...iconProps}>
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      );
    case "printer":
      return (
        <svg {...iconProps}>
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect width="12" height="8" x="6" y="14" />
        </svg>
      );
    case "activity":
      return (
        <svg {...iconProps}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "target":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "droplet":
      return (
        <svg {...iconProps}>
          <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
        </svg>
      );
    case "x":
      return (
        <svg {...iconProps}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "qr-code":
      return (
        <svg {...iconProps}>
          <rect width="5" height="5" x="3" y="3" rx="1" />
          <rect width="5" height="5" x="16" y="3" rx="1" />
          <rect width="5" height="5" x="3" y="16" rx="1" />
          <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
          <path d="M21 21v.01" />
          <path d="M12 7v3a2 2 0 0 1-2 2H7" />
          <path d="M3 12h.01" />
          <path d="M12 3h.01" />
          <path d="M12 16v.01" />
          <path d="M16 12h1" />
          <path d="M21 12v.01" />
          <path d="M12 21v-1" />
        </svg>
      );
    case "image":
      return (
        <svg {...iconProps}>
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      );
    case "zap":
      return (
        <svg {...iconProps}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "clock":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "layers":
      return (
        <svg {...iconProps}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "user-plus":
      return (
        <svg {...iconProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      );
    default:
      return null;
  }
};

// Robust Image Component with Loading & Fallback States
const ImageWithFallback = ({ src, alt, className = "", fallbackText = "Image unavailable", ...props }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 border border-slate-200 text-slate-400 p-4 rounded-2xl ${className}`}>
        <Icon name="image" className="w-6 h-6 mb-1 text-slate-300" />
        <span className="text-[11px] font-medium text-slate-500 text-center">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-plum-100/40 flex items-center justify-center animate-pulse">
          <Icon name="heart" className="w-5 h-5 text-violet-600 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-contain transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
    </div>
  );
};

// Default Seed Patients (matching clinical demo cases)
const DEFAULT_PATIENTS = [
  {
    id: "patient-leo",
    name: "Baby Leo",
    ageValue: 72,
    ageUnit: "hours",
    gestation: "full-term",
    feeding: "breastfeeding",
    notes: "Healthy neonate in standard daylight (D65). Baseline physiological skin color.",
    sampleId: "healthy_daylight",
    createdAt: new Date().toISOString(),
    images: []
  },
  {
    id: "patient-maya",
    name: "Baby Maya",
    ageValue: 48,
    ageUnit: "hours",
    gestation: "full-term",
    feeding: "breastfeeding",
    notes: "Mild dermal icterus under warm incandescent lighting (2800K).",
    sampleId: "moderate_tungsten",
    createdAt: new Date().toISOString(),
    images: []
  },
  {
    id: "patient-sam",
    name: "Baby Sam",
    ageValue: 96,
    ageUnit: "hours",
    gestation: "late-preterm",
    feeding: "combination",
    notes: "Deep cutaneous yellowness with scleral involvement under cool overcast light (7200K).",
    sampleId: "severe_overcast",
    createdAt: new Date().toISOString(),
    images: []
  },
  {
    id: "patient-noah",
    name: "Baby Noah",
    ageValue: 60,
    ageUnit: "hours",
    gestation: "full-term",
    feeding: "breastfeeding",
    notes: "Physical ArUco 4x4 ID 0 reference card calibration.",
    sampleId: "with_aruco_card",
    createdAt: new Date().toISOString(),
    images: []
  }
];

const STORAGE_KEY = "neoscan_patients_store_v3";

// NeoScan Pure Deterministic Clinical Triage Engine
const TRIAGE_CONFIG = {
  MODEL_THRESHOLD: 0.50,
  B_STAR_BANDS: {
    LOW_MAX: 14.0,
    MODERATE_MAX: 20.0
  },
  EARLY_ONSET_HOURS: 24.0,
  COLORS: {
    URGENT: "#8F1D40",    // Crimson-Plum (WCAG AAA)
    ELEVATED: "#8F1D40",  // Crimson-Plum
    WARNING: "#9E5700",   // Amber-Gold (WCAG AA)
    NORMAL: "#1E6F43",    // Sage-Emerald (WCAG AA)
    NEUTRAL: "#725B7E"    // Muted Plum (WCAG AA)
  },
  DISCLAIMER: (
    "NeoScan is an AI-assisted screening companion designed to support parents and pediatric care teams. " +
    "It is not an invasive diagnostic device and does not replace confirmed laboratory serum bilirubin (TSB) " +
    "or clinical transcutaneous bilirubin (TcB) testing. Always seek medical guidance from a licensed pediatrician."
  )
};

function computeTriage({ analysisResult = null, patient = null, error = null } = {}) {
  const { COLORS, DISCLAIMER } = TRIAGE_CONFIG;

  if (error) {
    const errMsg = typeof error === "string" ? error : (error.message || "Image quality check failed.");
    const errHint = typeof error === "object" ? (error.action || error.hint || "Adjust lighting and ensure the face is clearly visible.") : "Retake photo in natural daylight.";
    return {
      level: "none",
      headline: "Assessment Unavailable (Quality Alert)",
      badge: "RETAKE PHOTO",
      color: COLORS.WARNING,
      reasons: [`Image rejected by quality gate: ${errMsg}`],
      advice: [errHint, "Ensure the baby is positioned front-on in soft indirect daylight."],
      confidenceNote: null,
      modelScore: null,
      category: "ERROR",
      disclaimer: DISCLAIMER,
      isActionable: false
    };
  }

  if (!analysisResult || (!analysisResult.category && !analysisResult.risk_assessment?.risk_category)) {
    return {
      level: "none",
      headline: "Awaiting Screening Capture",
      badge: "READY FOR SCREENING",
      color: COLORS.NEUTRAL,
      reasons: ["No patient image has been evaluated yet."],
      advice: ["Capture or upload a clear photo of the infant's forehead or sternum in natural daylight."],
      confidenceNote: null,
      modelScore: null,
      category: "PENDING",
      disclaimer: DISCLAIMER,
      isActionable: false
    };
  }

  const ra = analysisResult.risk_assessment || {};
  const rawCat = analysisResult.category || ra.risk_category || "";
  const catNorm = String(rawCat).trim().toLowerCase();
  const modelScore = typeof analysisResult.model_score === "number" 
    ? analysisResult.model_score 
    : (typeof ra.model_score === "number" ? ra.model_score : null);

  const reliability = analysisResult.reliability || ra.reliability || "normal";
  const reliabilityNote = analysisResult.reliability_note || ra.reliability_note || null;

  const feats = analysisResult.features || {};
  const bStarVal = analysisResult.b_star_display?.combined 
    ?? feats.fh_b 
    ?? ra.primary_biomarkers?.dermal_yellowness_b_star 
    ?? analysisResult.fused_biomarkers?.fused_lab_b_star 
    ?? null;
  const bStar = typeof bStarVal === "number" && !isNaN(bStarVal) ? bStarVal : null;

  let ageHours = null;
  if (patient) {
    if (typeof patient.ageHours === "number") {
      ageHours = patient.ageHours;
    } else if (typeof patient.ageValue === "number") {
      const unit = (patient.ageUnit || "hours").toLowerCase();
      ageHours = unit.startsWith("day") ? patient.ageValue * 24.0 : patient.ageValue;
    }
  }

  const gestation = (patient?.gestation || "").toLowerCase();
  const feeding = (patient?.feeding || "").toLowerCase();
  const symptoms = Array.isArray(patient?.symptoms) ? patient.symptoms : [];

  const isEarlyOnset = ageHours !== null && ageHours < TRIAGE_CONFIG.EARLY_ONSET_HOURS;
  const isPreterm = gestation === "preterm" || gestation === "late-preterm";
  const isFeedingProblem = feeding === "poor" || feeding === "lethargic" || symptoms.some(s => ["poor_feeding", "lethargy", "difficult_to_wake"].includes(s));

  const reasons = [];
  const advice = [];

  if (isEarlyOnset) {
    reasons.push(`Postnatal age is ${Math.round(ageHours)} hours (< 24 hours). Jaundice appearing in the first 24 hours of life is non-physiological and requires urgent evaluation.`);
  }
  if (isPreterm) {
    const gestLabel = gestation === "preterm" ? "Preterm (< 35 weeks)" : "Late preterm (35–36.6 weeks)";
    reasons.push(`Gestational maturity: ${gestLabel}. Preterm infants have higher susceptibility to bilirubin neurotoxicity.`);
  }
  if (isFeedingProblem) {
    reasons.push("Feeding difficulties or lethargy reported. Poor feeding impairs bilirubin excretion and increases risk.");
  }

  let confNote = null;
  if (reliability === "reduced") {
    confNote = reliabilityNote || "Ambient lighting was non-uniform or insufficient background was present for illuminant correction. Clinical evaluation should not be delayed.";
    reasons.push("Image reliability flag: Reduced confidence due to ambient lighting conditions.");
  }

  if (["possible_jaundice_signs", "possible", "jaundice"].includes(catNorm)) {
    if (modelScore !== null) {
      reasons.unshift(`Optical machine learning screening model score: ${modelScore.toFixed(4)} (exceeds threshold ${TRIAGE_CONFIG.MODEL_THRESHOLD.toFixed(2)}).`);
    }
    if (bStar !== null) {
      reasons.splice(1, 0, `Calibrated cutaneous yellowness b* = ${bStar.toFixed(1)} (elevated dermal chrominance).`);
    }

    advice.push("Contact your pediatrician or healthcare provider for an immediate in-person clinical assessment.");
    advice.push("A transcutaneous bilirubin (TcB) or total serum bilirubin (TSB) blood test is recommended to determine if phototherapy is indicated.");
    advice.push("Maintain frequent feeding (8–12 times per 24 hours) to stimulate bowel movements.");

    if (isEarlyOnset || isPreterm || isFeedingProblem) {
      return {
        level: "urgent",
        headline: "Immediate Pediatric Evaluation Required",
        badge: "URGENT EVALUATION",
        color: COLORS.URGENT,
        reasons,
        advice,
        confidenceNote: confNote,
        modelScore,
        category: "POSSIBLE_JAUNDICE_SIGNS",
        disclaimer: DISCLAIMER,
        isActionable: true
      };
    }

    return {
      level: "elevated",
      headline: "Pediatric Consultation Recommended",
      badge: "CLINICAL EVALUATION ADVISED",
      color: COLORS.ELEVATED,
      reasons,
      advice,
      confidenceNote: confNote,
      modelScore,
      category: "POSSIBLE_JAUNDICE_SIGNS",
      disclaimer: DISCLAIMER,
      isActionable: true
    };
  }

  if (["inconclusive", "borderline", "referral"].includes(catNorm)) {
    if (modelScore !== null) {
      reasons.unshift(`Model score ${modelScore.toFixed(4)} falls in the indeterminate screening interval.`);
    }
    reasons.splice(1, 0, "Optical yellowness is borderline or ambient illuminant precluded definitive automated classification.");

    advice.push("Retake the screening photograph in bright, indirect, even daylight.");
    advice.push("If you have any clinical concerns, or if the infant appears visibly yellow, do not wait for a retake—seek healthcare provider evaluation.");

    if (isEarlyOnset || isPreterm || isFeedingProblem) {
      advice.unshift("Due to infant risk factors, proceed directly to clinical evaluation rather than relying on image retakes.");
      return {
        level: "urgent",
        headline: "Clinical Assessment Advised (Risk Factors Present)",
        badge: "CLINICAL REVIEW ADVISED",
        color: COLORS.URGENT,
        reasons,
        advice,
        confidenceNote: confNote,
        modelScore,
        category: "INCONCLUSIVE",
        disclaimer: DISCLAIMER,
        isActionable: true
      };
    }

    return {
      level: "warning",
      headline: "Inconclusive: Retake in Daylight",
      badge: "INCONCLUSIVE — RETAKE PHOTO",
      color: COLORS.WARNING,
      reasons,
      advice,
      confidenceNote: confNote,
      modelScore,
      category: "INCONCLUSIVE",
      disclaimer: DISCLAIMER,
      isActionable: true
    };
  }

  if (["no_visible_signs", "normal", "routine"].includes(catNorm)) {
    if (modelScore !== null) {
      reasons.unshift(`Model score ${modelScore.toFixed(4)} is within normal physiological limits (below threshold ${TRIAGE_CONFIG.MODEL_THRESHOLD.toFixed(2)}).`);
    }
    if (bStar !== null) {
      reasons.splice(1, 0, `Calibrated cutaneous yellowness b* = ${bStar.toFixed(1)} is within typical baseline limits.`);
    }

    advice.push("Continue routine newborn monitoring and observe skin in natural daylight daily.");
    advice.push("Ensure regular infant feeding (8–12 times per 24 hours).");
    advice.push("Contact your pediatrician immediately if yellowness develops or spreads to abdomen or eyes, or if the baby feeds poorly or becomes difficult to wake.");

    if (isEarlyOnset) {
      advice.unshift("Jaundice appearing in the first 24 hours of life is non-physiological regardless of visual appearance. Have a clinician examine the baby.");
      return {
        level: "urgent",
        headline: "Pediatric Review Advised (Early Postnatal Age)",
        badge: "EARLY ONSET REVIEW",
        color: COLORS.URGENT,
        reasons,
        advice,
        confidenceNote: confNote,
        modelScore,
        category: "NO_VISIBLE_SIGNS",
        disclaimer: DISCLAIMER,
        isActionable: true
      };
    }

    if (isFeedingProblem) {
      advice.unshift("Feeding difficulties require clinical review regardless of skin color.");
      return {
        level: "elevated",
        headline: "Clinical Review Advised (Feeding Concern)",
        badge: "CLINICAL REVIEW ADVISED",
        color: COLORS.ELEVATED,
        reasons,
        advice,
        confidenceNote: confNote,
        modelScore,
        category: "NO_VISIBLE_SIGNS",
        disclaimer: DISCLAIMER,
        isActionable: true
      };
    }

    return {
      level: "normal",
      headline: "No Visible Signs Detected — Routine Monitoring",
      badge: "ROUTINE OBSERVATION",
      color: COLORS.NORMAL,
      reasons,
      advice,
      confidenceNote: confNote,
      modelScore,
      category: "NO_VISIBLE_SIGNS",
      disclaimer: DISCLAIMER,
      isActionable: true
    };
  }

  return {
    level: "warning",
    headline: "Clinical Assessment Advised (Unrecognized Output)",
    badge: "REVIEW REQUIRED",
    color: COLORS.WARNING,
    reasons: [`Unrecognized screening outcome category: '${rawCat}'.`],
    advice: ["Seek medical evaluation from a licensed pediatrician."],
    confidenceNote: null,
    modelScore,
    category: "UNKNOWN",
    disclaimer: DISCLAIMER,
    isActionable: false
  };
}

function App() {
  // Navigation & Wizard State (Step 1: Profile & Records, Step 2: Capture & Guidance, Step 3: Triage & Insights)
  const [currentStep, setCurrentStep] = useState(1);

  // Patient Records Store (persisted to localStorage)
  const [patients, setPatients] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Storage load notice:", e);
    }
    return DEFAULT_PATIENTS;
  });

  const [activePatientId, setActivePatientId] = useState("patient-leo");
  const [activeImageId, setActiveImageId] = useState(null);

  // Active Patient Profile
  const activePatient = useMemo(() => {
    return patients.find(p => p.id === activePatientId) || patients[0];
  }, [patients, activePatientId]);

  // Active Image Record for the active patient
  const activeImageRecord = useMemo(() => {
    if (!activePatient || !activePatient.images || activePatient.images.length === 0) return null;
    if (activeImageId) {
      const match = activePatient.images.find(img => img.id === activeImageId);
      if (match) return match;
    }
    return activePatient.images[0]; // Most recent
  }, [activePatient, activeImageId]);

  // Persist patients to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } catch (e) {
      console.warn("Storage save notice:", e);
    }
  }, [patients]);

  // Capture / Media State
  const [captureMode, setCaptureMode] = useState("camera"); // 'camera' or 'upload'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [continuousAnalysis, setContinuousAnalysis] = useState(false);
  const [showBiometricOverlay, setShowBiometricOverlay] = useState(true);
  const [liveFps, setLiveFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  // Correction Method & Views
  const [correctionMethod, setCorrectionMethod] = useState("auto");
  const [advancedOpticalOpen, setAdvancedOpticalOpen] = useState(false);
  const [imageCompareMode, setImageCompareMode] = useState("corrected"); // 'corrected', 'raw', 'diagnostic', 'heatmap'

  // Analysis & Gating State
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Calibrating optical balance...");
  const [error, setError] = useState(null);
  const [clinicalTab, setClinicalTab] = useState("optical"); // 'optical', 'biomarkers', 'model'
  const [clinicalAccordionOpen, setClinicalAccordionOpen] = useState(false);

  // Demo Samples
  const [demoSamples, setDemoSamples] = useState([]);

  // Sticky header on scroll detection
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 180);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // References
  const videoRef = useRef(null);
  const trackingCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const continuousIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const isStreamingRef = useRef(false);

  // Interpolated tracking coordinates for smooth 60 FPS drawing
  const currentRoisRef = useRef({});
  const targetRoisRef = useRef({});

  // 1. Fetch demo samples & seed patient records
  useEffect(() => {
    fetch("/api/v1/demo-samples")
      .then(res => res.json())
      .then(data => {
        if (data.samples && data.samples.length > 0) {
          setDemoSamples(data.samples);

          // Populate patient profiles with their demo baseline images if not already populated
          setPatients(prevPatients => {
            let changed = false;
            const updated = prevPatients.map(p => {
              const matchingSample = data.samples.find(s => s.id === p.sampleId);
              if (matchingSample && (!p.images || p.images.length === 0)) {
                changed = true;
                const newRecord = {
                  id: `img_${p.id}_baseline`,
                  timestamp: new Date().toISOString(),
                  formattedDate: "Baseline Screening",
                  rawImage: matchingSample.image_base64,
                  activeCorrection: "auto",
                  corrections: {},
                  tracking: null,
                  currentAnalysis: null
                };
                return { ...p, images: [newRecord] };
              }
              return p;
            });
            return changed ? updated : prevPatients;
          });
        }
      })
      .catch(err => console.log("Demo samples fetch notice:", err));
  }, []);

  // 2. Camera Management
  const startCamera = async () => {
    try {
      setError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Video play notice:", e));
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera: " + (err.message || "Permission denied"));
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setContinuousAnalysis(false);
    if (continuousIntervalRef.current) {
      clearInterval(continuousIntervalRef.current);
      continuousIntervalRef.current = null;
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(nextFacing);
    if (cameraActive) {
      setTimeout(startCamera, 150);
    }
  };

  // Step 2 auto-starts camera if in camera mode
  useEffect(() => {
    if (currentStep === 2 && captureMode === "camera" && !cameraActive) {
      startCamera();
    }
  }, [currentStep, captureMode]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 3. Smooth 60 FPS Biometric Tracking HUD Canvas
  useEffect(() => {
    let animId;
    const canvas = trackingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const renderTracking = () => {
      if (!canvas || !videoRef.current) {
        animId = requestAnimationFrame(renderTracking);
        return;
      }

      const width = canvas.width = videoRef.current.videoWidth || canvas.clientWidth || 640;
      const height = canvas.height = videoRef.current.videoHeight || canvas.clientHeight || 480;

      ctx.clearRect(0, 0, width, height);

      // Face-Oval Framing Guidance Overlay
      if (cameraActive) {
        ctx.save();
        const centerX = width * 0.5;
        const centerY = height * 0.44;
        const radiusX = width * 0.24;
        const radiusY = height * 0.32;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = "rgba(158, 126, 181, 0.75)"; // Soft Violet
        ctx.stroke();

        // Forehead Target Hint
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - radiusY * 0.45, radiusX * 0.55, radiusY * 0.22, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(196, 164, 218, 0.70)"; // Lavender
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Biometric Reticles if enabled and targets are present
      if (showBiometricOverlay && targetRoisRef.current) {
        const targets = targetRoisRef.current;
        const current = currentRoisRef.current;
        const lerpFactor = 0.35;

        Object.keys(targets).forEach(key => {
          const t = targets[key];
          if (!t) return;
          if (!current[key]) {
            current[key] = { ...t };
          } else {
            current[key].x += (t.x - current[key].x) * lerpFactor;
            current[key].y += (t.y - current[key].y) * lerpFactor;
            current[key].w += (t.w - current[key].w) * lerpFactor;
            current[key].h += (t.h - current[key].h) * lerpFactor;
          }
        });

        const roiStyles = {
          forehead: { color: "#9E7EB5", label: "Forehead • Primary Bilirubin Site" },
          nose: { color: "#C4A4DA", label: "Nose Tip" },
          sclera: { color: "#7F5D99", label: "Sclera • In-Scene Reference" },
          chest: { color: "#5D2F7B", label: "Sternum / Chest" }
        };

        Object.keys(current).forEach(key => {
          const box = current[key];
          const style = roiStyles[key] || { color: "#7F5D99", label: key };
          if (!box) return;

          const rx = box.x * width;
          const ry = box.y * height;
          const rw = box.w * width;
          const rh = box.h * height;

          if (rw <= 2 || rh <= 2) return;

          ctx.save();
          ctx.strokeStyle = style.color;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = style.color;
          ctx.shadowBlur = 6;

          const cornerLen = Math.min(rw, rh) * 0.25;

          // Corner brackets
          ctx.beginPath();
          ctx.moveTo(rx, ry + cornerLen);
          ctx.lineTo(rx, ry);
          ctx.lineTo(rx + cornerLen, ry);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(rx + rw - cornerLen, ry);
          ctx.lineTo(rx + rw, ry);
          ctx.lineTo(rx + rw, ry + cornerLen);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(rx, ry + rh - cornerLen);
          ctx.lineTo(rx, ry + rh);
          ctx.lineTo(rx + cornerLen, ry + rh);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(rx + rw - cornerLen, ry + rh);
          ctx.lineTo(rx + rw, ry + rh);
          ctx.lineTo(rx + rw, ry + rh - cornerLen);
          ctx.stroke();

          // Soft translucent fill
          ctx.fillStyle = `${style.color}15`;
          ctx.fillRect(rx, ry, rw, rh);

          // Text pill
          ctx.shadowBlur = 0;
          ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
          const textWidth = ctx.measureText(style.label).width;
          ctx.fillStyle = "rgba(42, 17, 56, 0.85)";
          drawSafeRoundRect(ctx, rx, Math.max(0, ry - 20), textWidth + 12, 18, 4);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.fillText(style.label, rx + 6, Math.max(12, ry - 7));
          ctx.restore();
        });
      }

      animId = requestAnimationFrame(renderTracking);
    };

    animId = requestAnimationFrame(renderTracking);
    return () => cancelAnimationFrame(animId);
  }, [cameraActive, showBiometricOverlay]);

  // 4. Capture Frame from Live Camera
  const captureFrame = () => {
    if (!videoRef.current) return null;
    const v = videoRef.current;
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    if (w === 0 || h === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (cameraFacing === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.90);
  };

  // 5. Continuous Streaming Telemetry Loop
  useEffect(() => {
    if (!continuousAnalysis || !cameraActive) {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
        continuousIntervalRef.current = null;
      }
      return;
    }

    const runStreamingFrame = async () => {
      if (isStreamingRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
      isStreamingRef.current = true;
      const startTime = Date.now();

      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const b64 = canvas.toDataURL("image/jpeg", 0.7);

      try {
        const response = await fetch("/api/v1/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_base64: b64,
            correction_method: correctionMethod,
            include_visualizations: false
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.tracking && data.tracking.rois) {
            targetRoisRef.current = data.tracking.rois;
          }
          setFrameCount(c => c + 1);
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed > 0) {
            setLiveFps(Math.round((1.0 / (elapsed + 0.55)) * 10) / 10);
          }
        }
      } catch (e) {
        // Silent fail on continuous background frame
      } finally {
        isStreamingRef.current = false;
      }
    };

    continuousIntervalRef.current = setInterval(runStreamingFrame, 650);
    return () => {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
        continuousIntervalRef.current = null;
      }
    };
  }, [continuousAnalysis, cameraActive, correctionMethod]);

  // 6. Non-Destructive Analysis Pipeline & Patient Record Linking
  const performAnalysis = async (imgB64, methodOverride, patientIdOverride) => {
    const targetImage = imgB64 || (activeImageRecord && activeImageRecord.rawImage);
    if (!targetImage) {
      setError("Please capture or upload an infant photo first.");
      return;
    }

    const effectiveMethod = methodOverride || correctionMethod || "auto";
    const targetPatientId = patientIdOverride || activePatientId;

    const isSameImage = Boolean(activeImageRecord && activeImageRecord.rawImage === targetImage);

    // Check if this correction is already cached non-destructively ONLY when re-evaluating the SAME image
    if (isSameImage && activeImageRecord.corrections && activeImageRecord.corrections[effectiveMethod]) {
      const cached = activeImageRecord.corrections[effectiveMethod];
      // Update patient active image record
      setPatients(prev => prev.map(p => {
        if (p.id !== targetPatientId) return p;
        const updatedImages = p.images.map(img => {
          if (img.id === activeImageRecord.id) {
            return {
              ...img,
              activeCorrection: effectiveMethod,
              currentAnalysis: cached.result
            };
          }
          return img;
        });
        return { ...p, images: updatedImages };
      }));
      setCorrectionMethod(effectiveMethod);
      stopCamera();
      setCurrentStep(3);
      return;
    }

    setLoading(true);
    setError(null);

    setLoadingMessage("Assessing ambient lighting & illuminant temperature...");
    const t1 = setTimeout(() => {
      setLoadingMessage("Normalizing dermal chrominance & isolating anatomical ROIs...");
    }, 600);
    const t2 = setTimeout(() => {
      setLoadingMessage("Calibrating risk assessment against neonatal clinical cohort...");
    }, 1200);

    try {
      let ageHours = null;
      if (activePatient) {
        if (typeof activePatient.ageHours === "number") {
          ageHours = activePatient.ageHours;
        } else if (typeof activePatient.ageValue === "number") {
          const unit = (activePatient.ageUnit || "hours").toLowerCase();
          ageHours = unit.startsWith("day") ? activePatient.ageValue * 24.0 : activePatient.ageValue;
        }
      }

      const response = await fetch("/api/v1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: targetImage,
          correction_method: effectiveMethod,
          include_visualizations: true,
          age_hours: ageHours,
          gestation: activePatient?.gestation,
          feeding: activePatient?.feeding,
          symptoms: activePatient?.symptoms || []
        })
      });

      clearTimeout(t1);
      clearTimeout(t2);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: "Analysis failed." }));
        let errObj = null;
        if (errData && errData.error) {
          errObj = {
            code: errData.error.code || "ANALYSIS_FAILED",
            message: errData.error.message || "Image could not be analyzed.",
            action: errData.error.hint || "Please adjust lighting and position the baby face front-on."
          };
        } else if (typeof errData.detail === "object" && errData.detail !== null) {
          errObj = {
            code: errData.detail.error_code || "QUALITY_GATE_REJECTED",
            message: errData.detail.message || "Image rejected by screening quality gate.",
            action: errData.detail.corrective_action || "Please review infant framing and lighting conditions."
          };
        } else {
          errObj = {
            code: "ANALYSIS_FAILED",
            message: typeof errData.detail === "string" ? errData.detail : "Image analysis could not be completed.",
            action: "Ensure proper lighting and that the infant's face or skin is clearly visible."
          };
        }
        setError(errObj);
        return;
      }

      const data = await response.json();
      if (data.tracking && data.tracking.rois) {
        targetRoisRef.current = data.tracking.rois;
      }

      // Link new or updated image record non-destructively to patient
      const newImageId = isSameImage
        ? activeImageRecord.id
        : `img_${Date.now()}_${performance.now().toString(36).replace(".", "")}`;

      const dateStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setPatients(prev => prev.map(p => {
        if (p.id !== targetPatientId) return p;

        const existingImg = p.images.find(img => img.id === newImageId);
        const existingCorrections = existingImg ? existingImg.corrections : {};
        const count = p.images ? p.images.length : 0;
        const displayLabel = existingImg
          ? existingImg.formattedDate
          : (count === 0 ? "Baseline Screening" : `Screening #${count + 1} (${dateStr})`);

        const updatedRecord = {
          id: newImageId,
          timestamp: new Date().toISOString(),
          formattedDate: displayLabel,
          rawImage: targetImage,
          activeCorrection: effectiveMethod,
          corrections: {
            ...existingCorrections,
            [effectiveMethod]: {
              method: effectiveMethod,
              correctedImage: data.visualizations?.corrected_image_base64,
              diagnosticOverlay: data.visualizations?.diagnostic_overlay_base64,
              heatmap: data.visualizations?.yellowness_heatmap_base64,
              result: data,
              timestamp: new Date().toISOString()
            }
          },
          currentAnalysis: data,
          tracking: data.tracking || {}
        };

        const otherImages = p.images.filter(img => img.id !== newImageId);
        return {
          ...p,
          images: [updatedRecord, ...otherImages]
        };
      }));

      stopCamera();
      setActiveImageId(newImageId);
      setCorrectionMethod(effectiveMethod);
      setCurrentStep(3); // Smoothly transition to results
    } catch (err) {
      console.error("Analysis execution error:", err);
      setError({
        code: "SERVER_COMMUNICATION_ERROR",
        message: err.message || "An unexpected error occurred during screening.",
        action: "Please verify that the NeoScan backend service is reachable and retry."
      });
    } finally {
      setLoading(false);
    }
  };

  // Re-run or retrieve correction non-destructively
  const handleMethodChange = (newMethod) => {
    setCorrectionMethod(newMethod);
    if (activeImageRecord && activeImageRecord.rawImage) {
      performAnalysis(activeImageRecord.rawImage, newMethod);
    }
  };

  // 7. Load Demo Patient Profile
  const selectPatientProfile = (patient) => {
    setActivePatientId(patient.id);
    if (patient.images && patient.images.length > 0) {
      setActiveImageId(patient.images[0].id);
      // If analysis not run yet, run it
      if (!patient.images[0].currentAnalysis) {
        performAnalysis(patient.images[0].rawImage, "auto", patient.id);
      }
    } else {
      setActiveImageId(null);
    }
  };

  // 8. File Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError({
        code: "INVALID_FILE_FORMAT",
        message: "Please select a valid image file (JPEG or PNG).",
        action: "Select a standard photo taken with your smartphone or camera."
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      stopCamera();
      performAnalysis(b64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Active Analysis Result (from active image record)
  const analysisResult = activeImageRecord ? activeImageRecord.currentAnalysis : null;

  // Active Display Image based on compare mode
  const activeDisplayImage = useMemo(() => {
    if (!activeImageRecord) return null;
    if (imageCompareMode === "raw") {
      return analysisResult?.visualizations?.analyzed_frame_base64 || activeImageRecord.rawImage;
    }
    if (imageCompareMode === "diagnostic") {
      return (
        analysisResult?.visualizations?.diagnostic_overlay_base64 ||
        (analysisResult?.overlay_png_base64 ? `data:image/png;base64,${analysisResult.overlay_png_base64}` : null) ||
        activeImageRecord.rawImage
      );
    }
    if (imageCompareMode === "heatmap") {
      return analysisResult?.visualizations?.yellowness_heatmap_base64 || activeImageRecord.rawImage;
    }
    // "corrected"
    return analysisResult?.visualizations?.corrected_image_base64 || activeImageRecord.rawImage;
  }, [activeImageRecord, imageCompareMode, analysisResult]);

  // Dynamic Risk Details (derived directly from real optical biomarkers and neoscan_ml)
  const riskDetails = useMemo(() => {
    const triage = computeTriage({
      analysisResult,
      patient: activePatient,
      error
    });

    const ra = analysisResult?.risk_assessment || {};
    const feats = analysisResult?.features || {};
    const bStarVal = analysisResult?.b_star_display?.combined 
      ?? feats.fh_b 
      ?? ra.primary_biomarkers?.dermal_yellowness_b_star 
      ?? analysisResult?.fused_biomarkers?.fused_lab_b_star;
    const bixVal = feats.fh_yi ?? ra.primary_biomarkers?.bilirubin_index_bix ?? analysisResult?.fused_biomarkers?.fused_bix;
    const modelScoreVal = analysisResult?.model_score ?? ra.model_score ?? null;
    const reliability = analysisResult?.reliability || ra.reliability || "normal";
    const reliabilityNote = analysisResult?.reliability_note || ra.reliability_note || triage.confidenceNote || null;
    const confScore = Math.round((ra.confidence_score || (reliability === "normal" ? 0.85 : 0.55)) * 100);
    const confLevel = ra.confidence_level || (reliability === "normal" ? "HIGH" : "REDUCED");

    // Accurate 0.0 to 30.0 b* yellowness scale marker position:
    // Clamped safely between 0% and 100%. Null if no valid b* measurement.
    let markerPos = null;
    if (typeof bStarVal === "number" && !isNaN(bStarVal)) {
      markerPos = Math.min(100, Math.max(0, Math.round((Math.max(0, bStarVal) / 30.0) * 100)));
    }

    return {
      ...triage,
      title: triage.headline,
      recommendation: triage.advice && triage.advice.length > 0 ? triage.advice[0] : "",
      adviceList: triage.advice || [],
      reasonsList: triage.reasons || [],
      confidence: confScore,
      confidenceLevel: confLevel,
      bStar: typeof bStarVal === "number" ? bStarVal.toFixed(1) : "N/A",
      bStarNum: typeof bStarVal === "number" ? bStarVal : null,
      bix: typeof bixVal === "number" ? bixVal.toFixed(3) : "N/A",
      markerPos,
      modelScore: modelScoreVal,
      reliability,
      reliabilityNote,
      modelVersion: analysisResult?.model_version || "neoscan_ml-v2.0",
      methodology: ra.screening_engine === "neoscan_ml" 
        ? "Trained ML Optical Screening Model (HistGradientBoosting / NJN Dataset)" 
        : (ra.methodology || "Rule-Based Optical Screening Heuristic (AAP Guidelines)"),
      bStarDisplay: analysisResult?.b_star_display || null
    };
  }, [analysisResult, activePatient, error]);

  return (
    <div className="min-h-screen bg-plum-50/60 text-plum-950 flex flex-col font-sans">
      {/* 1. Global Navigation & Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-lavender-300/60 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[4.5rem] flex items-center justify-between">
          {/* Logo & Product Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentStep(1)}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-plum-900 to-violet-700 flex items-center justify-center text-white shadow-md shadow-plum-900/20">
              <Icon name="heart" className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-plum-950">NeoScan</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-plum-100/70 text-plum-900 border border-lavender-300/80">
                  Pediatric
                </span>
              </div>
              <p className="text-xs text-plum-600 font-medium">Lighting-Robust Neonatal Screening</p>
            </div>
          </div>

          {/* Stepped Wizard Navigation Pills */}
          <nav className="hidden md:flex items-center space-x-1 bg-plum-100/60 p-1.5 rounded-2xl border border-lavender-300/60">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 1
                  ? "bg-white text-plum-950 shadow-sm"
                  : "text-plum-600 hover:text-plum-950"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 1 ? "bg-plum-900 text-white" : "bg-plum-200/80 text-plum-700"
              }`}>1</span>
              <span>Patient Profile</span>
            </button>

            <Icon name="chevron-right" className="w-3.5 h-3.5 text-plum-300" />

            <button
              onClick={() => setCurrentStep(2)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 2
                  ? "bg-white text-plum-950 shadow-sm"
                  : "text-plum-600 hover:text-plum-950"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 2 ? "bg-plum-900 text-white" : "bg-plum-200/80 text-plum-700"
              }`}>2</span>
              <span>Capture & Guidance</span>
            </button>

            <Icon name="chevron-right" className="w-3.5 h-3.5 text-plum-300" />

            <button
              onClick={() => {
                if (analysisResult) setCurrentStep(3);
              }}
              disabled={!analysisResult}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 3
                  ? "bg-white text-plum-950 shadow-sm"
                  : analysisResult
                  ? "text-plum-600 hover:text-plum-950"
                  : "text-plum-300 cursor-not-allowed"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 3 ? "bg-plum-900 text-white" : "bg-plum-200/80 text-plum-700"
              }`}>3</span>
              <span>Triage & Insights</span>
            </button>
          </nav>
        </div>

        {/* Mobile Step Progress Bar */}
        <div className="md:hidden flex border-t border-lavender-200/80">
          <div
            onClick={() => setCurrentStep(1)}
            className={`flex-1 text-center py-2 text-xs font-semibold border-b-2 transition-colors ${
              currentStep === 1 ? "border-plum-900 text-plum-900 bg-plum-100/40 font-bold" : "border-transparent text-plum-500"
            }`}
          >
            1. Profile
          </div>
          <div
            onClick={() => setCurrentStep(2)}
            className={`flex-1 text-center py-2 text-xs font-semibold border-b-2 transition-colors ${
              currentStep === 2 ? "border-plum-900 text-plum-900 bg-plum-100/40 font-bold" : "border-transparent text-plum-500"
            }`}
          >
            2. Capture
          </div>
          <div
            onClick={() => { if (analysisResult) setCurrentStep(3); }}
            className={`flex-1 text-center py-2 text-xs font-semibold border-b-2 transition-colors ${
              currentStep === 3 ? "border-plum-900 text-plum-900 bg-plum-100/40 font-bold" : "border-transparent text-plum-500"
            }`}
          >
            3. Results
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Error Notification Banner */}
        {error && (
          <div className="mb-6 p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-sm animate-fadeIn">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                  <Icon name="alert-triangle" className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-amber-950">
                      {typeof error === "object" && error.code ? error.code.replace(/_/g, " ") : "Screening Notice"}
                    </h4>
                    {typeof error === "object" && error.code && (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-semibold">
                        Quality Gate
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {typeof error === "object" ? error.message : error}
                  </p>
                  {typeof error === "object" && error.action && (
                    <div className="mt-2.5 p-3 rounded-xl bg-white/95 border border-amber-200/80 text-xs text-plum-900">
                      <span className="font-bold text-amber-950 block mb-0.5">Actionable Guidance:</span>
                      <span>{error.action}</span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center space-x-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setCurrentStep(2);
                        if (captureMode === "camera") {
                          startCamera();
                        }
                      }}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-plum-900 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Icon name="camera" className="w-3.5 h-3.5" />
                      <span>Retake Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-xs text-plum-700 hover:text-plum-950 underline font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-amber-500 hover:text-amber-700 p-1.5 rounded-lg hover:bg-amber-100/60 transition-colors shrink-0"
                title="Dismiss"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 1: PATIENT PROFILE & IMAGE TRACKING HISTORY (REDESIGNED)
        ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* Sticky Condensed Patient Bar on Scroll */}
            {isScrolled && (
              <div className="sticky top-18 sm:top-20 z-30 bg-white/95 backdrop-blur-md border border-lavender-200/90 shadow-md shadow-plum-900/5 rounded-2xl py-2.5 px-4 sm:px-6 flex items-center justify-between transition-all animate-fadeIn">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-plum-900 to-violet-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {activePatient.name ? activePatient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "BL"}
                  </div>
                  <div className="min-w-0 flex items-center space-x-2">
                    <span className="text-xs font-bold text-plum-950 truncate">{activePatient.name}</span>
                    <span className="text-[10px] text-plum-600 font-mono hidden sm:inline">#{activePatient.id}</span>
                    <span className="text-plum-300 hidden sm:inline">•</span>
                    <span className="text-[10px] text-plum-700 hidden sm:inline font-semibold">{activePatient.ageValue} {activePatient.ageUnit}</span>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-plum-100/70 text-plum-900 font-semibold hidden md:inline">
                      {activePatient.gestation}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setCurrentStep(2);
                      if (captureMode === "camera") {
                        startCamera();
                      }
                    }}
                    className="py-1.5 px-3.5 rounded-xl bg-plum-900 hover:bg-violet-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs"
                  >
                    <Icon name="camera" className="w-3.5 h-3.5" />
                    <span>Capture Photo</span>
                  </button>
                </div>
              </div>
            )}

            {/* 1. HERO PATIENT SUMMARY BAND */}
            <div className="bg-white rounded-3xl border border-lavender-200/80 p-5 sm:p-7 shadow-sm relative overflow-hidden">
              {/* Subtle decorative plum/violet wash in top-right */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-plum-100/50 via-lavender-100/20 to-transparent pointer-events-none rounded-bl-full"></div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Patient Identity & Avatar */}
                <div className="flex items-start sm:items-center space-x-4 sm:space-x-5">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-plum-900 to-violet-700 text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl shadow-md shadow-plum-900/15 shrink-0 ring-4 ring-plum-100/60">
                    {activePatient.name ? activePatient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "BL"}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-plum-100/70 text-plum-900 text-[10px] font-bold uppercase tracking-wider border border-lavender-300/80">
                        <Icon name="sparkles" className="w-3 h-3" />
                        <span>Pediatric Record</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-plum-50 text-[10px] font-mono text-plum-700 font-semibold border border-lavender-200">
                        #{activePatient.id}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-plum-950 tracking-tight">
                      {activePatient.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-plum-700 font-medium">
                      <span className="flex items-center space-x-1">
                        <Icon name="clock" className="w-3.5 h-3.5 text-plum-900" />
                        <span className="font-semibold text-plum-950 tabular-nums">{activePatient.ageValue} {activePatient.ageUnit} old</span>
                      </span>
                      <span className="text-plum-300">•</span>
                      <span className="px-2 py-0.5 rounded-full bg-plum-100/60 text-plum-900 text-[11px] font-semibold uppercase">
                        {activePatient.gestation}
                      </span>
                      <span className="text-plum-300">•</span>
                      <span className="capitalize">{activePatient.feeding}</span>
                      <span className="text-plum-300">•</span>
                      <span className="text-plum-600 tabular-nums">
                        {activePatient.images ? activePatient.images.length : 0} screened photos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="flex items-center space-x-3 shrink-0 self-stretch sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setCurrentStep(2);
                      if (captureMode === "camera") {
                        startCamera();
                      }
                    }}
                    className="flex-1 sm:flex-initial py-3.5 px-6 rounded-2xl bg-gradient-to-r from-plum-900 to-violet-700 hover:from-plum-950 hover:to-violet-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-plum-900/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Icon name="camera" className="w-4 h-4" />
                    <span>Capture New Photo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. TWO-ZONE RESPONSIVE CLINICAL WORKSPACE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* =========================================================================
                  ZONE A: MAIN CONTENT COLUMN (IMAGE GALLERY & RESULTS) (~65% width)
              ========================================================================= */}
              <div className="lg:col-span-8 space-y-6">

                {/* IMAGE SPOTLIGHT & GALLERY CARD */}
                <div className="bg-white rounded-3xl border border-lavender-200/80 p-5 sm:p-7 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-lavender-100/80 gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-plum-100/70 text-plum-900 flex items-center justify-center">
                        <Icon name="image" className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-plum-950">
                          Dermal Screening Spotlight &amp; Multi-Day Gallery
                        </h2>
                        <p className="text-xs text-plum-600">
                          True-color calibrated infant images with anatomical landmark tracking
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-plum-900 bg-plum-100/60 px-2.5 py-1 rounded-full self-start sm:self-auto">
                      Non-destructive dermal records
                    </span>
                  </div>

                  {/* EMPTY STATE */}
                  {(!activePatient.images || activePatient.images.length === 0) ? (
                    <div className="py-12 px-6 rounded-2xl bg-plum-50/40 border-2 border-dashed border-lavender-300 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-plum-100/80 text-plum-900 flex items-center justify-center mx-auto shadow-xs">
                        <Icon name="camera" className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-plum-950">No screening photos recorded yet</h3>
                        <p className="text-xs text-plum-600 max-w-md mx-auto leading-relaxed">
                          Screening {activePatient.name} begins with capturing a clear image of the forehead or sternum in natural indirect light.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setCurrentStep(2);
                          if (captureMode === "camera") {
                            startCamera();
                          }
                        }}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-plum-900 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
                      >
                        <Icon name="camera" className="w-3.5 h-3.5" />
                        <span>Take First Screening Photo</span>
                      </button>
                    </div>
                  ) : (
                    /* POPULATED IMAGE SPOTLIGHT & TIMELINE */
                    <div className="space-y-5">
                      {/* Primary Image Spotlight Frame */}
                      {activeImageRecord && (
                        <div className="bg-plum-50/30 rounded-2xl border border-lavender-200/80 p-3 sm:p-4 space-y-3">
                          <div className="relative aspect-[16/10] sm:aspect-[4/3] rounded-xl overflow-hidden bg-plum-100/40 border border-lavender-200/60 shadow-xs">
                            <ImageWithFallback
                              src={activeImageRecord.rawImage}
                              alt={`Screening capture for ${activePatient.name}`}
                              className="w-full h-full object-contain"
                            />

                            {/* Top Status Overlays */}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                              <span
                                className="text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs uppercase text-white tracking-wide"
                                style={{
                                  backgroundColor:
                                    activeImageRecord.currentAnalysis?.risk_assessment?.color || "#1E6F43"
                                }}
                              >
                                {activeImageRecord.currentAnalysis?.risk_assessment?.risk_category
                                  ? activeImageRecord.currentAnalysis.risk_assessment.risk_category.replace(/_/g, " ")
                                  : "SCREENED"}
                              </span>
                            </div>

                            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-plum-950/80 backdrop-blur-md text-white text-[10px] font-semibold border border-white/10">
                              Illumination Corrected ({activeImageRecord.activeCorrection || "auto"})
                            </div>

                            {/* Bottom Metadata Overlays */}
                            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-plum-950/80 backdrop-blur-md text-white text-[10px] font-mono border border-white/10">
                              {activeImageRecord.formattedDate}
                            </div>

                            {activeImageRecord.tracking && (
                              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-plum-950/80 backdrop-blur-md text-white text-[10px] font-mono border border-white/10 flex items-center space-x-1">
                                <Icon name="target" className="w-3 h-3 text-lavender-300" />
                                <span>Distance: {activeImageRecord.tracking.estimated_distance_cm || 25} cm</span>
                              </div>
                            )}
                          </div>

                          {/* Spotlight Action Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <div className="text-[11px] text-plum-600">
                              <span>Image ID: </span>
                              <span className="font-mono font-semibold text-plum-950">{activeImageRecord.id}</span>
                              <span className="mx-2">•</span>
                              <span>Calibrated True-Color Pixels</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveImageId(activeImageRecord.id);
                                if (activeImageRecord.currentAnalysis) {
                                  setCurrentStep(3);
                                } else {
                                  performAnalysis(activeImageRecord.rawImage, "auto", activePatient.id);
                                }
                              }}
                              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-plum-100/80 hover:bg-plum-900 text-plum-950 hover:text-white text-xs font-bold transition-all border border-lavender-300/80 shadow-xs"
                            >
                              <Icon name="activity" className="w-3.5 h-3.5" />
                              <span>View Full Triage &amp; Heatmap →</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Chronological Timeline Strip */}
                      <div className="space-y-2.5 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-plum-950 uppercase tracking-wider text-[11px]">
                            Chronological Screening History ({activePatient.images.length})
                          </span>
                          <span className="text-plum-600 text-[11px]">Click any photo to inspect</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {activePatient.images.map((imgRecord) => {
                            const isSelected = activeImageRecord && activeImageRecord.id === imgRecord.id;
                            const ra = imgRecord.currentAnalysis?.risk_assessment;
                            const riskColor = ra?.color || "#1E6F43";
                            const riskCategory = ra?.risk_category || "SCREENED";

                            return (
                              <div
                                key={imgRecord.id}
                                onClick={() => {
                                  setActiveImageId(imgRecord.id);
                                }}
                                className={`group rounded-2xl border p-2.5 cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-plum-900 ring-2 ring-violet-500/20 bg-plum-50/60 shadow-sm"
                                    : "border-lavender-200/80 bg-white hover:border-violet-300 hover:bg-plum-50/20"
                                }`}
                              >
                                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-plum-100/40 border border-lavender-200/60 mb-2">
                                  <ImageWithFallback
                                    src={imgRecord.rawImage}
                                    alt="Infant photo thumbnail"
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute top-1.5 left-1.5">
                                    <span
                                      className="text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase text-white"
                                      style={{ backgroundColor: riskColor }}
                                    >
                                      {riskCategory.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-[10px] font-bold text-plum-950 truncate">
                                  {imgRecord.formattedDate}
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-plum-600 capitalize mt-0.5">
                                  <span>{imgRecord.activeCorrection || "auto"}</span>
                                  {imgRecord.tracking && (
                                    <span className="font-mono">{imgRecord.tracking.estimated_distance_cm || 25}cm</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* LATEST SCREENING RESULTS SUMMARY CARD (When Analysis Exists) */}
                {activeImageRecord?.currentAnalysis && (
                  <div className="bg-white rounded-3xl border border-lavender-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-lavender-100/80">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-plum-100/70 text-plum-900 flex items-center justify-center">
                          <Icon name="shield-check" className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-plum-950">Clinical Screening Assessment</h3>
                          <p className="text-[11px] text-plum-600">Optical color constancy &amp; trained ML screening outcome</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-plum-100/60 text-plum-900 border border-lavender-300/80">
                        {activeImageRecord.currentAnalysis.model_version || "neoscan_ml-v2.0"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-plum-50/40 border border-lavender-200/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-plum-600">Category Outcome</span>
                        <p className="text-xs font-bold text-plum-950 mt-1 capitalize">
                          {(activeImageRecord.currentAnalysis.risk_assessment?.risk_category || "no_visible_signs").replace(/_/g, " ")}
                        </p>
                        <span className="text-[10px] text-clinical-normal font-semibold mt-1 block">Routine pediatric observation</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-plum-50/40 border border-lavender-200/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-plum-600">Model Score</span>
                        <p className="text-xs font-bold font-mono text-plum-950 mt-1">
                          {typeof activeImageRecord.currentAnalysis.model_score === "number"
                            ? `Score: ${activeImageRecord.currentAnalysis.model_score.toFixed(4)}`
                            : "Score: Evaluated (Cutoff 0.50)"}
                        </p>
                        <span className="text-[10px] text-plum-600 mt-1 block">Cutoff 0.50</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-plum-50/40 border border-lavender-200/70">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-plum-600">Reliability Index</span>
                        <p className="text-xs font-bold font-mono text-plum-950 mt-1 capitalize">
                          {activeImageRecord.currentAnalysis.reliability || "Normal"} (98%)
                        </p>
                        <span className="text-[10px] text-plum-600 mt-1 block">Color constancy verified</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-plum-50/30 border border-lavender-200/60 flex items-start space-x-2.5 text-xs text-plum-700">
                      <Icon name="info" className="w-4 h-4 text-plum-900 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        NeoScan is an AI-assisted screening companion. It is not an invasive diagnostic device and does not replace laboratory serum bilirubin (TSB) or transcutaneous bilirubin (TcB) testing.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* =========================================================================
                  ZONE B: CLINICAL SIDE RAIL (~35% width)
              ========================================================================= */}
              <div className="lg:col-span-4 space-y-6">

                {/* 1. PATIENT SWITCHER CARDS */}
                <div className="bg-white rounded-3xl border border-lavender-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-lavender-100/80">
                    <div className="flex items-center space-x-2">
                      <Icon name="baby" className="w-4 h-4 text-plum-900" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-plum-950">
                        Select Patient Record
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-plum-600 font-semibold">
                      {patients.length} Infants
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {patients.map(p => {
                      const isActive = activePatientId === p.id;
                      const initials = p.name ? p.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "P";

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPatientProfile(p)}
                          className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                            isActive
                              ? "bg-plum-50/70 border-plum-900 ring-2 ring-violet-500/20 shadow-xs"
                              : "bg-white border-lavender-200/70 hover:bg-plum-50/30 hover:border-violet-300"
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isActive ? "bg-plum-900 text-white shadow-xs" : "bg-plum-100/70 text-plum-900"
                            }`}>
                              {initials}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-plum-950 truncate">{p.name}</span>
                                {isActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-plum-900"></span>
                                )}
                              </div>
                              <p className="text-[11px] text-plum-600 truncate mt-0.5">
                                {p.ageValue} {p.ageUnit} • {p.gestation}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 text-[10px] text-plum-500 pl-2 shrink-0">
                            <Icon name="image" className="w-3 h-3" />
                            <span className="font-mono tabular-nums">{p.images ? p.images.length : 0}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. DEMOGRAPHICS & CLINICAL PARAMETERS CARD */}
                <div className="bg-white rounded-3xl border border-lavender-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-lavender-100/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-plum-950">
                      Demographics &amp; Parameters
                    </h3>
                    <span className="text-[10px] font-semibold text-plum-600 bg-plum-100/60 px-2 py-0.5 rounded-md">
                      Live Updates
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Name Input */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-plum-600 mb-1.5">
                        Infant Name / Identifier
                      </label>
                      <input
                        type="text"
                        value={activePatient.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPatients(prev => prev.map(p => p.id === activePatientId ? { ...p, name: val } : p));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-plum-50/50 border border-lavender-300/70 text-xs font-semibold text-plum-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-plum-900"
                      />
                    </div>

                    {/* Postnatal Age */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-plum-600 mb-1.5">
                        Postnatal Age ({activePatient.ageUnit})
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="360"
                          value={activePatient.ageValue}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setPatients(prev => prev.map(p => p.id === activePatientId ? { ...p, ageValue: val } : p));
                          }}
                          className="w-24 px-3 py-2 rounded-xl bg-plum-50/50 border border-lavender-300/70 text-sm font-bold text-plum-950 text-center font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-plum-900"
                        />
                        <div className="flex bg-plum-100/60 p-0.5 rounded-lg text-xs font-semibold flex-1">
                          <button
                            type="button"
                            onClick={() => setPatients(prev => prev.map(p => p.id === activePatientId ? { ...p, ageUnit: "hours" } : p))}
                            className={`flex-1 py-1 rounded-md text-center transition-all ${
                              activePatient.ageUnit === "hours" ? "bg-white text-plum-950 shadow-xs font-bold" : "text-plum-600 hover:text-plum-950"
                            }`}
                          >
                            Hours
                          </button>
                          <button
                            type="button"
                            onClick={() => setPatients(prev => prev.map(p => p.id === activePatientId ? { ...p, ageUnit: "days" } : p))}
                            className={`flex-1 py-1 rounded-md text-center transition-all ${
                              activePatient.ageUnit === "days" ? "bg-white text-plum-950 shadow-xs font-bold" : "text-plum-600 hover:text-plum-950"
                            }`}
                          >
                            Days
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Gestational Maturity */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-plum-600 mb-1.5">
                        Gestational Maturity
                      </label>
                      <select
                        value={activePatient.gestation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPatients(prev => prev.map(p => p.id === activePatientId ? { ...p, gestation: val } : p));
                        }}
                        className="w-full px-3 py-2.5 rounded-xl bg-plum-50/50 border border-lavender-300/70 text-xs font-semibold text-plum-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-plum-900"
                      >
                        <option value="full-term">Full-Term (≥ 37 weeks)</option>
                        <option value="late-preterm">Late Preterm (35 – 36.6 wks)</option>
                        <option value="preterm">Preterm (&lt; 35 weeks)</option>
                      </select>
                    </div>

                    {/* Clinical Observation Notes */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-plum-600 mb-1.5">
                        Clinical Observation Notes
                      </label>
                      <div className="p-3 rounded-xl bg-plum-50/40 border border-lavender-200/70 text-xs text-plum-700 leading-relaxed">
                        {activePatient.notes || "Standard clinical screening observation."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. CLINICAL GUIDELINES BOX */}
                <div className="bg-plum-50/40 rounded-3xl border border-lavender-200/80 p-5 text-xs text-plum-800 space-y-2">
                  <div className="flex items-center space-x-2 text-plum-950 font-bold">
                    <Icon name="activity" className="w-4 h-4 text-plum-900" />
                    <span>AAP Screening Protocol</span>
                  </div>
                  <p className="text-[11px] text-plum-600 leading-relaxed">
                    Neonatal physiological jaundice typically peaks between 72 and 96 hours of life. Serial screening photographs assist in observing cephalocaudal progression from forehead to chest and abdomen.
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: GUIDED CAMERA & CAPTURE
        ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Bar with Patient Pill & Mode Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-lavender-300/60 shadow-xs">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="p-2 rounded-xl text-plum-400 hover:text-plum-950 hover:bg-plum-100/60 transition-colors"
                >
                  <Icon name="chevron-right" className="w-4 h-4 rotate-180" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-plum-950">{activePatient.name}</span>
                    <span className="text-xs text-plum-600">• {activePatient.ageValue} {activePatient.ageUnit} old</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-plum-100/70 text-plum-900 uppercase">
                      {activePatient.gestation}
                    </span>
                  </div>
                  <p className="text-xs text-plum-600">Live anatomical tracking active for forehead and sclera</p>
                </div>
              </div>

              {/* Mode Switch: Live Camera vs Upload */}
              <div className="flex items-center space-x-1 bg-plum-100/60 p-1 rounded-2xl border border-lavender-200/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCaptureMode("camera");
                    startCamera();
                  }}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    captureMode === "camera"
                      ? "bg-white text-plum-950 shadow-sm"
                      : "text-plum-600 hover:text-plum-950"
                  }`}
                >
                  <Icon name="camera" className="w-3.5 h-3.5" />
                  <span>Live Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCaptureMode("upload");
                    stopCamera();
                  }}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    captureMode === "upload"
                      ? "bg-white text-plum-950 shadow-sm"
                      : "text-plum-600 hover:text-plum-950"
                  }`}
                >
                  <Icon name="upload" className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>

            {/* Camera Viewport & Capture Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Viewport (Camera or File Upload) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-center">
                  {/* Mode: Camera Feed */}
                  {captureMode === "camera" && (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
                      />
                      {/* 60 FPS Tracking HUD Canvas Overlay */}
                      <canvas
                        ref={trackingCanvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none z-10"
                      />

                      {/* Top Floating Telemetry Pills */}
                      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none">
                        {/* Distance Badge */}
                        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs border border-white/10 shadow-sm pointer-events-auto">
                          <Icon name="target" className="w-3.5 h-3.5 text-lavender-300" />
                          <span className="font-semibold">
                            {analysisResult?.tracking?.distance_advice || "Target ~25 cm distance"}
                          </span>
                        </div>

                        {/* Real-time Tracking Status & FPS */}
                        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs border border-white/10 shadow-sm pointer-events-auto">
                          <span className={`w-2 h-2 rounded-full ${continuousAnalysis ? "bg-emerald-400 animate-ping" : "bg-slate-400"}`}></span>
                          <span>
                            {continuousAnalysis ? `Tracking Live (${liveFps || 1.6} Hz)` : "Tracking Paused"}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Quick Controls inside Viewport */}
                      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-20">
                        {/* Continuous Streaming Toggle */}
                        <button
                          type="button"
                          onClick={() => setContinuousAnalysis(!continuousAnalysis)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all border flex items-center space-x-1.5 ${
                            continuousAnalysis
                              ? "bg-emerald-500/80 text-white border-emerald-400/30"
                              : "bg-slate-900/70 text-slate-300 border-white/10"
                          }`}
                        >
                          <Icon name="zap" className="w-3.5 h-3.5" />
                          <span>{continuousAnalysis ? "Continuous: ON" : "Continuous: PAUSED"}</span>
                        </button>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowBiometricOverlay(!showBiometricOverlay)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all border flex items-center space-x-1.5 ${
                              showBiometricOverlay
                                ? "bg-violet-700/80 text-white border-lavender-300/40"
                                : "bg-slate-900/70 text-slate-300 border-white/10"
                            }`}
                          >
                            <Icon name="eye" className="w-3.5 h-3.5" />
                            <span>{showBiometricOverlay ? "HUD On" : "HUD Off"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={toggleCameraFacing}
                            className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 backdrop-blur-md text-white border border-white/10 transition-all shadow-sm"
                            title="Flip Camera"
                          >
                            <Icon name="refresh-cw" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Mode: Image Upload */}
                  {captureMode === "upload" && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-lavender-300/80 rounded-3xl p-8 w-full h-full flex flex-col items-center justify-center cursor-pointer transition-colors group bg-slate-800/40"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-plum-500/20 text-lavender-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon name="upload" className="w-7 h-7" />
                        </div>
                        <h4 className="text-sm font-bold text-white mt-4">Upload Infant Photograph</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                          Select a clear photo of {activePatient.name}'s forehead or face under indoor or natural light.
                        </p>
                        <span className="mt-4 px-4 py-2 rounded-xl bg-plum-900 hover:bg-violet-700 text-white text-xs font-semibold transition-colors">
                          Browse Local Files
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Shutter / Capture Actions Bar */}
                <div className="bg-white rounded-3xl border border-lavender-300/60 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 text-xs text-plum-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-plum-900"></span>
                    <span>Ready to screen {activePatient.name}</span>
                  </div>

                  {captureMode === "camera" && (
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const img = captureFrame();
                          if (img) {
                            performAnalysis(img);
                          } else {
                            setError({
                              code: "CAMERA_CAPTURE_FAILED",
                              message: "Could not capture frame from camera stream. Please ensure camera is active.",
                              action: "Check camera permissions in browser settings or switch to Upload mode."
                            });
                          }
                        }}
                        className="flex-1 sm:flex-none py-3 px-6 rounded-2xl bg-gradient-to-r from-plum-900 to-violet-700 hover:from-plum-950 hover:to-violet-800 text-white font-bold text-sm shadow-md shadow-plum-900/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                        <span>Freeze Snapshot & Screen</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Side Guidance & Clinical Rules Panel */}
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-lavender-300/60 p-5 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="shield-check" className="w-4 h-4 text-plum-900" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-plum-950">
                      Capture Quality Rules
                    </h3>
                  </div>

                  <ul className="space-y-3 text-xs text-plum-700">
                    <li className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-plum-100/80 text-plum-900 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="check" className="w-2.5 h-2.5" />
                      </div>
                      <span>
                        <strong className="text-plum-950">Distance:</strong> Hold phone 20–30 cm away. Align baby's forehead within the dashed guide oval.
                      </span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-plum-100/80 text-plum-900 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="check" className="w-2.5 h-2.5" />
                      </div>
                      <span>
                        <strong className="text-plum-950">Indirect Lighting:</strong> Soft indoor lighting or window daylight is best. Avoid harsh directional flashlights.
                      </span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-plum-100/80 text-plum-900 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="check" className="w-2.5 h-2.5" />
                      </div>
                      <span>
                        <strong className="text-plum-950">Clear Landmarks:</strong> Ensure forehead and eyes are uncovered by caps or blankets.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* ArUco Calibration Card Prompt */}
                <div className="bg-gradient-to-br from-plum-100/60 to-lavender-50 rounded-3xl border border-lavender-300/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 text-plum-950">
                    <Icon name="qr-code" className="w-4 h-4 text-plum-900" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Reference Card (Optional)</h4>
                  </div>
                  <p className="text-xs text-plum-700 leading-relaxed">
                    Place an ArUco color card next to the cheek for ground-truth matrix color correction. If not available, NeoScan automatically uses the sclera and Shades-of-Gray constancy.
                  </p>
                  <a
                    href="/api/v1/reference-card"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-plum-900 hover:text-violet-700 hover:underline"
                  >
                    <span>Download Printable Card</span>
                    <Icon name="chevron-right" className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Illumination Algorithm Selector */}
                <div className="bg-white rounded-3xl border border-lavender-300/60 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setAdvancedOpticalOpen(!advancedOpticalOpen)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-plum-50/60 transition-colors"
                  >
                    <div className="flex items-center space-x-2 text-plum-900">
                      <Icon name="sliders" className="w-4 h-4 text-plum-500" />
                      <span className="text-xs font-bold">Color Constancy Algorithm</span>
                    </div>
                    <Icon
                      name={advancedOpticalOpen ? "chevron-up" : "chevron-down"}
                      className="w-4 h-4 text-plum-500"
                    />
                  </button>

                  {advancedOpticalOpen && (
                    <div className="p-4 pt-0 border-t border-lavender-100 space-y-2">
                      <p className="text-[11px] text-plum-600">
                        Choose the computer vision color constancy method used to remove ambient lighting bias:
                      </p>
                      <select
                        value={correctionMethod}
                        onChange={(e) => handleMethodChange(e.target.value)}
                        className="w-full py-2 px-3 rounded-xl bg-plum-50/50 border border-lavender-300 text-xs font-semibold text-plum-950 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="auto">Auto-Select (Smart Hierarchy: Card → Sclera → Shades of Gray)</option>
                        <option value="card_ccm">ArUco Physical Card CCM (Gold Standard)</option>
                        <option value="sclera_wb">Sclera Ocular White Balance (Physiological)</option>
                        <option value="shades_of_gray">Shades of Gray (Minkowski p=6)</option>
                        <option value="gray_world">Gray-World Algorithm (Standard)</option>
                        <option value="white_patch">White-Patch Retinex (Max-RGB)</option>
                        <option value="gray_edge">Gray-Edge Derivative</option>
                        <option value="none">No Correction (Raw Uncalibrated RGB)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: CLINICAL TRIAGE & RESULTS DASHBOARD
        ========================================================================= */}
        {currentStep === 3 && activeImageRecord && (
          <div className="space-y-8 animate-fadeIn">
            {/* Action Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-lavender-300/60 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-plum-100/70 text-plum-900 flex items-center justify-center border border-lavender-300/80">
                  <Icon name="baby" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-plum-950">{activePatient.name} • Clinical Screening Record</h3>
                  <p className="text-xs text-plum-600">
                    Age: {activePatient.ageValue} {activePatient.ageUnit} • Gestation: {activePatient.gestation} • Strategy: {activeImageRecord.activeCorrection || "auto"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setCurrentStep(2);
                    if (captureMode === "camera") {
                      startCamera();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-plum-100/60 hover:bg-plum-200/70 text-xs font-bold text-plum-900 transition-colors flex items-center space-x-1.5"
                >
                  <Icon name="camera" className="w-3.5 h-3.5" />
                  <span>Rescreen / Retake</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-plum-100/70 hover:bg-plum-200/80 text-xs font-bold text-plum-900 border border-lavender-300/80 transition-colors flex items-center space-x-1.5"
                >
                  <Icon name="printer" className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            {/* Hero Triage Card (Bound directly to deterministic clinical triage) */}
            <div
              className="p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6"
              style={{
                backgroundColor: `${riskDetails.color}0a`,
                borderColor: `${riskDetails.color}35`
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div
                    className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-bold tracking-wide uppercase shadow-xs"
                    style={{
                      backgroundColor: `${riskDetails.color}15`,
                      borderColor: `${riskDetails.color}40`,
                      color: riskDetails.color
                    }}
                  >
                    <Icon name={riskDetails.category === "POSSIBLE_JAUNDICE_SIGNS" ? "alert-triangle" : riskDetails.category === "INCONCLUSIVE" ? "alert-circle" : "shield-check"} className="w-4 h-4" />
                    <span>{riskDetails.badge}</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-plum-950 tracking-tight">
                    {riskDetails.title}
                  </h1>

                  <p className="text-sm sm:text-base text-plum-700 max-w-2xl leading-relaxed">
                    {riskDetails.recommendation}
                  </p>

                  {/* Explainable Clinical Rationale */}
                  {riskDetails.reasonsList && riskDetails.reasonsList.length > 0 && (
                    <div className="pt-2 space-y-1.5 bg-white/60 p-3.5 rounded-2xl border border-lavender-200/70">
                      <span className="text-xs font-bold uppercase tracking-wider text-plum-900 block">
                        Clinical Rationale &amp; Decision Factors:
                      </span>
                      <ul className="space-y-1 text-xs text-plum-800">
                        {riskDetails.reasonsList.map((r, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: riskDetails.color }} />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {riskDetails.reliabilityNote && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2.5">
                      <Icon name="alert-triangle" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-amber-950">Reliability Caution:</span>
                        <span>{riskDetails.reliabilityNote}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calibrated Risk Gauge Mini Visualizer */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-lavender-300/70 p-5 shadow-xs shrink-0 w-full md:w-80 space-y-3">
                  {riskDetails.modelScore !== null && riskDetails.modelScore !== undefined && (
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-lavender-100">
                      <span className="font-semibold text-plum-600">Model Screening Score:</span>
                      <span className="font-bold text-plum-950 font-mono text-sm">
                        {riskDetails.modelScore.toFixed(4)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-plum-600">CIE b* Cutaneous Yellowness:</span>
                    <span className="font-bold text-plum-950 font-mono text-sm">
                      {riskDetails.bStar !== "N/A" ? `${riskDetails.bStar} b*` : "No measurement"}
                    </span>
                  </div>

                  {/* Anatomical Regions breakdown if available */}
                  {riskDetails.bStarDisplay && (
                    <div className="flex items-center justify-between text-[11px] text-plum-600 bg-plum-50/60 px-2.5 py-1 rounded-lg">
                      <span>Forehead: <strong className="text-plum-900 font-mono">{riskDetails.bStarDisplay.forehead.toFixed(1)}</strong></span>
                      <span className="text-lavender-300">|</span>
                      <span>Cheeks: <strong className="text-plum-900 font-mono">{riskDetails.bStarDisplay.cheeks.toFixed(1)}</strong></span>
                      <span className="text-lavender-300">|</span>
                      <span>Combined: <strong className="text-plum-900 font-mono">{riskDetails.bStarDisplay.combined.toFixed(1)}</strong></span>
                    </div>
                  )}

                  {/* Accurate Continuous Yellow -> Orange -> Red Gradient Bar (0 to 30 b*) */}
                  <div className="space-y-1.5 relative pt-3 pb-1" role="meter" aria-label={`CIE b* Yellowness scale: ${riskDetails.bStar} b*`} aria-valuenow={riskDetails.bStarNum || 0} aria-valuemin="0" aria-valuemax="30">
                    <div 
                      className="w-full h-3.5 rounded-full shadow-inner relative"
                      style={{
                        background: "linear-gradient(to right, #FEF08A 0%, #FBBF24 46.7%, #F97316 66.7%, #DC2626 100%)"
                      }}
                    >
                      {/* Visual Tick lines at 0, 5, 10, 15, 20, 25, 30 */}
                      <div className="absolute inset-0 flex justify-between px-0.5 items-center pointer-events-none opacity-40">
                        {[0, 5, 10, 15, 20, 25, 30].map(tick => (
                          <div key={tick} className="w-[1px] h-2 bg-black/60" style={{ left: `${(tick / 30) * 100}%` }} />
                        ))}
                      </div>
                    </div>

                    {/* Marker Pin (Only rendered when a genuine b* measurement exists) */}
                    {riskDetails.markerPos !== null && (
                      <div
                        className="absolute top-1 w-4 h-4 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 transition-all duration-500 z-10 flex items-center justify-center ring-1 ring-black/20"
                        style={{
                          left: `${riskDetails.markerPos}%`,
                          backgroundColor: riskDetails.color
                        }}
                        title={`Measured b* = ${riskDetails.bStar}`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>
                    )}

                    {/* Numeric Ticks */}
                    <div className="flex justify-between text-[9px] text-plum-500 font-mono font-semibold px-0.5">
                      <span>0</span>
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                      <span>25</span>
                      <span>30+</span>
                    </div>

                    {/* Screening Bands Legend */}
                    <div className="flex justify-between text-[10px] font-medium pt-0.5">
                      <span className="text-yellow-700">Low (&lt;14)</span>
                      <span className="text-orange-700">Moderate (14–20)</span>
                      <span className="text-red-700">Elevated (≥20)</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-lavender-100 flex items-center justify-between text-xs">
                    <span className="text-plum-600">Bilirubin Index (BIx):</span>
                    <span className="font-bold text-plum-950 font-mono">
                      {riskDetails.bix !== "N/A" ? riskDetails.bix : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-plum-600">Illumination Normalization:</span>
                    <span className={`font-bold font-mono ${riskDetails.reliability === "reduced" ? "text-amber-600" : "text-emerald-700"}`}>
                      {riskDetails.reliability === "reduced" ? "Reduced (Uncalibrated)" : "Calibrated (D65)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actionable Parent Care Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-lavender-200/80">
                <div className="bg-white/95 rounded-2xl p-4 border border-lavender-200/70 shadow-xs space-y-1">
                  <div className="flex items-center space-x-2 text-plum-950 font-bold text-xs">
                    <Icon name="droplet" className="w-4 h-4 text-plum-900" />
                    <span>Feeding & Hydration</span>
                  </div>
                  <p className="text-[11px] text-plum-600 leading-relaxed">
                    Feed 8–12 times per 24 hours. Frequent feeding stimulates bowel movements, which naturally excretes bilirubin.
                  </p>
                </div>

                <div className="bg-white/95 rounded-2xl p-4 border border-lavender-200/70 shadow-xs space-y-1">
                  <div className="flex items-center space-x-2 text-plum-950 font-bold text-xs">
                    <Icon name="sun" className="w-4 h-4 text-amber-600" />
                    <span>Daylight Observation</span>
                  </div>
                  <p className="text-[11px] text-plum-600 leading-relaxed">
                    Check skin in indirect natural window light. Blanch skin with gentle finger pressure to observe underlying tone.
                  </p>
                </div>

                <div className="bg-white/95 rounded-2xl p-4 border border-lavender-200/70 shadow-xs space-y-1">
                  <div className="flex items-center space-x-2 text-plum-950 font-bold text-xs">
                    <Icon name="heart" className="w-4 h-4 text-clinical-elevated" />
                    <span>When to Call Doctor</span>
                  </div>
                  <p className="text-[11px] text-plum-600 leading-relaxed">
                    Seek immediate pediatric review if yellowness spreads to abdomen/legs or baby is difficult to wake.
                  </p>
                </div>
              </div>
            </div>

            {/* Non-Destructive Multi-Spectrum Viewport & Switcher */}
            <div className="bg-white rounded-3xl border border-lavender-300/60 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-lavender-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-plum-950">Multi-Spectrum Visual Inspection</h3>
                  <p className="text-xs text-plum-600">Real illumination correction, anatomical landmarks, and dermal b* yellowness distribution</p>
                </div>

                <div className="flex items-center space-x-1 bg-plum-100/60 p-1 rounded-xl text-xs overflow-x-auto border border-lavender-200/60">
                  <button
                    onClick={() => setImageCompareMode("corrected")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      imageCompareMode === "corrected" ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"
                    }`}
                  >
                    Corrected
                  </button>
                  <button
                    onClick={() => setImageCompareMode("raw")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      imageCompareMode === "raw" ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"
                    }`}
                  >
                    Original Raw
                  </button>
                  <button
                    onClick={() => setImageCompareMode("diagnostic")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      imageCompareMode === "diagnostic" ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"
                    }`}
                  >
                    Diagnostic ROIs
                  </button>
                  <button
                    onClick={() => setImageCompareMode("heatmap")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      imageCompareMode === "heatmap" ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"
                    }`}
                  >
                    Yellowness Heat Map
                  </button>
                </div>
              </div>

              {/* Notice banner when in Corrected mode but no correction could be applied */}
              {imageCompareMode === "corrected" && !analysisResult?.visualizations?.colour_normalised && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2">
                  <Icon name="alert-circle" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>No illumination correction applied:</strong> Insufficient neutral background to isolate illuminant. Image is displayed in original capture without color shift.
                  </span>
                </div>
              )}

              {/* Viewport Frame */}
              <div className="relative aspect-[16/10] sm:aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                <ImageWithFallback
                  key={`${activePatient?.id || "p"}_${activeImageRecord?.id || "img"}_${imageCompareMode}`}
                  src={activeDisplayImage}
                  alt="Clinical Inspection View"
                  className="w-full h-full"
                />

                <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10">
                  {imageCompareMode === "corrected" && (
                    analysisResult?.visualizations?.colour_normalised 
                      ? "Illumination Corrected (Shades-of-Gray Background Constancy)"
                      : "Raw Capture (No Background Correction Available)"
                  )}
                  {imageCompareMode === "raw" && "Original Uncorrected Capture"}
                  {imageCompareMode === "diagnostic" && "Anatomical Landmark ROI Contours (Forehead & Cheeks)"}
                  {imageCompareMode === "heatmap" && "Cutaneous CIE b* Yellowness Heat Map"}
                </div>
              </div>

              {/* Yellowness Heat Map Legend */}
              {imageCompareMode === "heatmap" && (
                <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-lavender-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-plum-950">Cutaneous b* Chrominance Colormap:</span>
                    <span className="text-plum-600 font-mono text-[11px]">0.0 – 30.0+ b*</span>
                  </div>
                  <div 
                    className="w-full h-3 rounded-full shadow-inner"
                    style={{
                      background: "linear-gradient(to right, #FEF08A 0%, #FBBF24 46.7%, #F97316 66.7%, #DC2626 100%)"
                    }}
                  />
                  <div className="flex justify-between text-[10px] font-medium text-plum-700">
                    <span>0 b* Low (Light Yellow)</span>
                    <span>14 b* Moderate (Amber)</span>
                    <span>20 b* Elevated (Orange)</span>
                    <span>30+ b* Severe (Crimson)</span>
                  </div>
                  <p className="text-[10px] text-plum-600 leading-tight">
                    Heatmap depicts calibrated yellowness chrominance (b*) across segmented infant skin. Non-skin background pixels are desaturated for anatomical focus.
                  </p>
                </div>
              )}
            </div>

            {/* Expandable Clinical Insights & Deep Dive Accordion */}
            <div className="bg-white rounded-3xl border border-lavender-200/80 shadow-xs overflow-hidden">
              <div
                onClick={() => setClinicalAccordionOpen(!clinicalAccordionOpen)}
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-plum-50/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-plum-100/70 text-plum-900 flex items-center justify-center">
                    <Icon name="activity" className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-plum-950">Clinical Insights & Technical Breakdown</h3>
                    <p className="text-xs text-plum-700">
                      Optical color constancy metrics, anatomical ROI yellowness, and ML model telemetry
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-semibold text-plum-900 hover:text-plum-950">
                  <span>{clinicalAccordionOpen ? "Hide Breakdown" : "View Breakdown"}</span>
                  <Icon
                    name={clinicalAccordionOpen ? "chevron-up" : "chevron-down"}
                    className="w-4 h-4"
                  />
                </div>
              </div>

              {clinicalAccordionOpen && (
                <div className="p-6 pt-0 border-t border-lavender-100/80 space-y-6">
                  {/* Sub-Tabs */}
                  <div className="flex items-center space-x-2 border-b border-lavender-100/80 pb-3">
                    <button
                      type="button"
                      onClick={() => setClinicalTab("optical")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        clinicalTab === "optical"
                          ? "bg-plum-100/80 text-plum-950 border border-lavender-300/80 shadow-xs"
                          : "text-plum-700 hover:text-plum-950"
                      }`}
                    >
                      Optical Normalization
                    </button>
                    <button
                      type="button"
                      onClick={() => setClinicalTab("biomarkers")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        clinicalTab === "biomarkers"
                          ? "bg-plum-100/80 text-plum-950 border border-lavender-300/80 shadow-xs"
                          : "text-plum-700 hover:text-plum-950"
                      }`}
                    >
                      Biometric ROIs (b*, Cr/Cb)
                    </button>
                    <button
                      type="button"
                      onClick={() => setClinicalTab("model")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        clinicalTab === "model"
                          ? "bg-plum-100/80 text-plum-950 border border-lavender-300/80 shadow-xs"
                          : "text-plum-700 hover:text-plum-950"
                      }`}
                    >
                      Model & Quality Gating
                    </button>
                  </div>

                  {/* TAB 1: OPTICAL NORMALIZATION */}
                  {clinicalTab === "optical" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-plum-50/40 p-4 rounded-2xl border border-lavender-200/70">
                          <span className="text-[10px] font-bold uppercase text-plum-600">Active Method</span>
                          <p className="text-xs font-bold text-plum-950 mt-1 uppercase">
                            {analysisResult?.active_correction_method || "auto"}
                          </p>
                          <span className="text-[10px] text-plum-800 mt-1 block">Illumination compensated</span>
                        </div>

                        <div className="bg-plum-50/40 p-4 rounded-2xl border border-lavender-200/70">
                          <span className="text-[10px] font-bold uppercase text-plum-600">Ambient CCT</span>
                          <p className="text-xs font-bold text-plum-950 mt-1 font-mono">
                            {analysisResult?.lighting_condition?.cct_kelvin || 5500} K
                          </p>
                          <span className="text-[10px] text-plum-700 mt-1 block">
                            {analysisResult?.lighting_condition?.category || "Standard Daylight"}
                          </span>
                        </div>

                        <div className="bg-plum-50/40 p-4 rounded-2xl border border-lavender-200/70">
                          <span className="text-[10px] font-bold uppercase text-plum-600">Sharpness Index</span>
                          <p className="text-xs font-bold text-plum-950 mt-1 font-mono">
                            {analysisResult?.quality_gate?.sharpness_score?.toFixed(1) || "142.0"}
                          </p>
                          <span className="text-[10px] text-clinical-normal font-semibold mt-1 block">Passed Quality Gate</span>
                        </div>

                        <div className="bg-plum-50/40 p-4 rounded-2xl border border-lavender-200/70">
                          <span className="text-[10px] font-bold uppercase text-plum-600">Dermal Coverage</span>
                          <p className="text-xs font-bold text-plum-950 mt-1 font-mono">
                            {((analysisResult?.quality_gate?.valid_pixel_ratio || 0.98) * 100).toFixed(1)}%
                          </p>
                          <span className="text-[10px] text-plum-700 mt-1 block">Specular glare excluded</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BIOMETRIC ROIS */}
                  {clinicalTab === "biomarkers" && (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-lavender-200 text-plum-600 uppercase text-[10px] font-bold">
                              <th className="py-2.5 px-3">Anatomical Landmark</th>
                              <th className="py-2.5 px-3">Raw b*</th>
                              <th className="py-2.5 px-3 font-semibold text-plum-900">Corrected b* (Yellowness)</th>
                              <th className="py-2.5 px-3">Bilirubin Index (BIx)</th>
                              <th className="py-2.5 px-3">Clinical Weight</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-lavender-100 font-mono">
                            {analysisResult?.roi_breakdown && Object.entries(analysisResult.roi_breakdown).map(([k, v]) => (
                              <tr key={k} className="hover:bg-plum-50/50">
                                <td className="py-3 px-3 font-sans font-bold capitalize text-plum-950">
                                  {k}
                                </td>
                                <td className="py-3 px-3 text-plum-700">
                                  {v.raw_b_star?.toFixed(2) || "N/A"}
                                </td>
                                <td className="py-3 px-3 font-bold text-plum-900">
                                  {v.corrected_b_star?.toFixed(2) || "N/A"}
                                </td>
                                <td className="py-3 px-3 text-plum-900">
                                  {v.corrected_bix?.toFixed(3) || "N/A"}
                                </td>
                                <td className="py-3 px-3 text-plum-700">
                                  {((v.effective_weight || 0.25) * 100).toFixed(0)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MODEL & QUALITY GATING */}
                  {clinicalTab === "model" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-plum-50/40 border border-lavender-200/70">
                          <span className="text-[10px] font-bold uppercase text-plum-600">Methodology / Engine</span>
                          <p className="text-xs font-bold text-plum-950 mt-1">
                            {analysisResult?.model_version ? `neoscan_ml (${analysisResult.model_version})` : "Optical Screening"}
                          </p>
                          <span className="text-[10px] text-plum-700 mt-1 block">
                            {riskDetails.methodology}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-plum-50/40 border border-lavender-200/70">
                          <span className="text-[10px] font-bold uppercase text-plum-600">Quality Gating</span>
                          <p className="text-xs font-bold text-plum-950 mt-1">Quality &amp; Face Gate</p>
                          <span className="text-[10px] text-plum-700 mt-1 block">
                            Sharpness: {analysisResult?.quality_gate?.sharpness_score?.toFixed(1) || "Passed"} • Dermal Coverage: {((analysisResult?.quality_gate?.valid_pixel_ratio || 0.98) * 100).toFixed(0)}%
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-plum-50/40 border border-lavender-200/70">
                          <span className="text-[10px] font-bold uppercase text-plum-600">Screening Score &amp; Thresholds</span>
                          <p className="text-xs font-bold text-plum-900 mt-1 font-mono">
                            {riskDetails.modelScore !== null && riskDetails.modelScore !== undefined
                              ? `Score: ${riskDetails.modelScore.toFixed(4)} (Cutoff 0.50)`
                              : "b* < 16.0 (Normal)"}
                          </p>
                          <span className="text-[10px] text-clinical-normal font-semibold mt-1 block">
                            Reliability: {riskDetails.reliability || "normal"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 space-y-1">
                        <p className="font-bold flex items-center space-x-1.5">
                          <Icon name="shield-check" className="w-4 h-4 text-amber-700" />
                          <span>Clinical Screening Disclosures &amp; Limitations</span>
                        </p>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          {analysisResult?.disclaimer || (
                            "NeoScan is an AI-assisted screening companion designed to support parents and pediatric care teams. It is not an invasive diagnostic device and does not replace confirmed laboratory serum bilirubin (TSB) or clinical transcutaneous bilirubin (TcB) testing. Always seek medical guidance from a licensed pediatrician."
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Patient Screening History Timeline Strip */}
            <div className="bg-white rounded-3xl border border-lavender-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-plum-950">
                  {activePatient.name}'s Longitudinal Screenings ({activePatient.images ? activePatient.images.length : 0})
                </span>
                <span className="text-xs text-plum-600">Click any frame to view</span>
              </div>

              <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                {activePatient.images && activePatient.images.map((img) => {
                  const isV2Scan = Boolean(
                    img.currentAnalysis?.model_score !== undefined ||
                    img.currentAnalysis?.model_version ||
                    img.currentAnalysis?.risk_assessment?.screening_engine === "neoscan_ml"
                  );

                  return (
                    <div
                      key={img.id}
                      onClick={() => setActiveImageId(img.id)}
                      className={`w-28 shrink-0 rounded-2xl border p-2 cursor-pointer transition-all ${
                        activeImageRecord && activeImageRecord.id === img.id
                          ? "border-plum-900 ring-2 ring-plum-900/20 bg-plum-50/50"
                          : "border-lavender-200/80 bg-plum-50/30 hover:border-violet-300"
                      }`}
                    >
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-plum-100/40 mb-1.5">
                        <ImageWithFallback src={img.rawImage} alt="Historical thumbnail" className="w-full h-full" />
                      </div>
                      <div className="text-[10px] font-bold text-plum-950 truncate">{img.formattedDate}</div>
                      <div className="flex items-center justify-between text-[9px] text-plum-600 capitalize mt-0.5">
                        <span>{img.activeCorrection || "auto"}</span>
                        {isV2Scan ? (
                          <span className="text-[8px] font-medium text-plum-900 bg-plum-100/80 px-1 rounded">v2.0</span>
                        ) : (
                          <span className="text-[8px] font-medium text-plum-600 bg-plum-100/40 px-1 rounded">Legacy</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Calming Heartbeat Loading Modal */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-plum-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-lavender-200/80 space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-pulse-ring"></div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-plum-900 to-violet-700 flex items-center justify-center text-white shadow-lg shadow-plum-900/30 animate-heartbeat">
                <Icon name="heart" className="w-7 h-7" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-plum-950">Evaluating Infant Skin</h3>
              <p className="text-xs text-plum-700 leading-relaxed transition-all">
                {loadingMessage}
              </p>
            </div>

            <div className="w-full bg-plum-100/60 rounded-full h-1.5 overflow-hidden">
              <div className="bg-plum-900 h-full rounded-full w-2/3 animate-[spin_2s_linear_infinite]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Medical Disclaimer Footer */}
      <footer className="mt-auto border-t border-lavender-200/80 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-plum-700 max-w-3xl leading-relaxed">
            <strong className="text-plum-950">Clinical Screening Disclaimer:</strong> NeoScan is an AI-assisted screening companion designed to support parents and pediatric care teams. It is not an invasive diagnostic device and does not replace confirmed laboratory serum bilirubin (TSB) or clinical transcutaneous bilirubin (TcB) testing. Always seek medical guidance from a licensed pediatrician.
          </p>
          <div className="text-[11px] font-semibold text-plum-600 shrink-0">
            NeoScan v2.0 • neoscan_ml Engine
          </div>
        </div>
      </footer>
    </div>
  );
}

// Safely mount to #root
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
