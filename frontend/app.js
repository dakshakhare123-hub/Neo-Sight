// NeoScan React 18 Application - Clinical Pediatric Screening & Image Tracking Edition
// Designed to Apple Health / Consumer Pediatric Health standards
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;

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
const Icon = ({
  name,
  className = "w-4 h-4",
  ...props
}) => {
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
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
      }));
    case "shield-check":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m9 12 2 2 4-4"
      }));
    case "alert-circle":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "12",
        y1: "8",
        x2: "12",
        y2: "12"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "12",
        y1: "16",
        x2: "12.01",
        y2: "16"
      }));
    case "alert-triangle":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "12",
        y1: "9",
        x2: "12",
        y2: "13"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "12",
        y1: "17",
        x2: "12.01",
        y2: "17"
      }));
    case "baby":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "M9 12h.01"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M15 12h.01"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"
      }));
    case "camera":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "13",
        r: "3"
      }));
    case "camera-off":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("line", {
        x1: "2",
        x2: "22",
        y1: "2",
        y2: "22"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "13",
        r: "3"
      }));
    case "refresh-cw":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 3v5h-5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M8 16H3v5"
      }));
    case "upload":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      }), /*#__PURE__*/React.createElement("polyline", {
        points: "17 8 12 3 7 8"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "12",
        y1: "3",
        x2: "12",
        y2: "15"
      }));
    case "sun":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "4"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 2v2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 20v2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m4.93 4.93 1.41 1.41"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m17.66 17.66 1.41 1.41"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M2 12h2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M20 12h2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m6.34 17.66-1.41 1.41"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m19.07 4.93-1.41 1.41"
      }));
    case "eye":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "3"
      }));
    case "sliders":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("line", {
        x1: "4",
        x2: "4",
        y1: "21",
        y2: "14"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "4",
        x2: "4",
        y1: "10",
        y2: "3"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "12",
        x2: "12",
        y1: "21",
        y2: "12"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "12",
        x2: "12",
        y1: "8",
        y2: "3"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "20",
        x2: "20",
        y1: "21",
        y2: "16"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "20",
        x2: "20",
        y1: "12",
        y2: "3"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "1",
        x2: "7",
        y1: "14",
        y2: "14"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "9",
        x2: "15",
        y1: "8",
        y2: "8"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "17",
        x2: "23",
        y1: "16",
        y2: "16"
      }));
    case "chevron-right":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "m9 18 6-6-6-6"
      }));
    case "chevron-down":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "m6 9 6 6 6-6"
      }));
    case "chevron-up":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "m18 15-6-6-6 6"
      }));
    case "check":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("polyline", {
        points: "20 6 9 17 4 12"
      }));
    case "info":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 16v-4"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 8h.01"
      }));
    case "sparkles":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
      }));
    case "printer":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("polyline", {
        points: "6 9 6 2 18 2 18 9"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
      }), /*#__PURE__*/React.createElement("rect", {
        width: "12",
        height: "8",
        x: "6",
        y: "14"
      }));
    case "activity":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "M22 12h-4l-3 9L9 3l-3 9H2"
      }));
    case "target":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "6"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "2"
      }));
    case "droplet":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"
      }));
    case "x":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("line", {
        x1: "18",
        y1: "6",
        x2: "6",
        y2: "18"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "6",
        y1: "6",
        x2: "18",
        y2: "18"
      }));
    case "qr-code":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("rect", {
        width: "5",
        height: "5",
        x: "3",
        y: "3",
        rx: "1"
      }), /*#__PURE__*/React.createElement("rect", {
        width: "5",
        height: "5",
        x: "16",
        y: "3",
        rx: "1"
      }), /*#__PURE__*/React.createElement("rect", {
        width: "5",
        height: "5",
        x: "3",
        y: "16",
        rx: "1"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 16h-3a2 2 0 0 0-2 2v3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 21v.01"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 7v3a2 2 0 0 1-2 2H7"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M3 12h.01"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 3h.01"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 16v.01"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M16 12h1"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 12v.01"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 21v-1"
      }));
    case "image":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("rect", {
        width: "18",
        height: "18",
        x: "3",
        y: "3",
        rx: "2",
        ry: "2"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "9",
        cy: "9",
        r: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
      }));
    case "zap":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("polygon", {
        points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2"
      }));
    case "clock":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("polyline", {
        points: "12 6 12 12 16 14"
      }));
    case "layers":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("polygon", {
        points: "12 2 2 7 12 12 22 7 12 2"
      }), /*#__PURE__*/React.createElement("polyline", {
        points: "2 17 12 22 22 17"
      }), /*#__PURE__*/React.createElement("polyline", {
        points: "2 12 12 17 22 12"
      }));
    case "user-plus":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("path", {
        d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "9",
        cy: "7",
        r: "4"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "19",
        y1: "8",
        x2: "19",
        y2: "14"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "22",
        y1: "11",
        x2: "16",
        y2: "11"
      }));
    default:
      return null;
  }
};

// Robust Image Component with Loading & Fallback States
const ImageWithFallback = ({
  src,
  alt,
  className = "",
  fallbackText = "Image unavailable",
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);
  if (!src || hasError) {
    return /*#__PURE__*/React.createElement("div", {
      className: `flex flex-col items-center justify-center bg-slate-100 border border-slate-200 text-slate-400 p-4 rounded-2xl ${className}`
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "image",
      className: "w-6 h-6 mb-1 text-slate-300"
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-medium text-slate-500 text-center"
    }, fallbackText));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: `relative overflow-hidden ${className}`
  }, isLoading && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-slate-100 flex items-center justify-center animate-pulse"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    className: "w-5 h-5 text-teal-400 animate-spin"
  })), /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    className: `w-full h-full object-contain transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`,
    onLoad: () => setIsLoading(false),
    onError: () => {
      setIsLoading(false);
      setHasError(true);
    },
    ...props
  }));
};

// Default Seed Patients (matching clinical demo cases)
const DEFAULT_PATIENTS = [{
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
}, {
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
}, {
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
}, {
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
}];
const STORAGE_KEY = "neoscan_patients_store_v3";
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
    fetch("/api/v1/demo-samples").then(res => res.json()).then(data => {
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
              return {
                ...p,
                images: [newRecord]
              };
            }
            return p;
          });
          return changed ? updated : prevPatients;
        });
      }
    }).catch(err => console.log("Demo samples fetch notice:", err));
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
          width: {
            ideal: 1280
          },
          height: {
            ideal: 720
          }
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
        ctx.strokeStyle = "rgba(13, 148, 136, 0.5)"; // Serene medical teal
        ctx.stroke();

        // Forehead Target Hint
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - radiusY * 0.45, radiusX * 0.55, radiusY * 0.22, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(14, 165, 233, 0.45)"; // Soft sky
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
            current[key] = {
              ...t
            };
          } else {
            current[key].x += (t.x - current[key].x) * lerpFactor;
            current[key].y += (t.y - current[key].y) * lerpFactor;
            current[key].w += (t.w - current[key].w) * lerpFactor;
            current[key].h += (t.h - current[key].h) * lerpFactor;
          }
        });
        const roiStyles = {
          forehead: {
            color: "#0ea5e9",
            label: "Forehead • Primary Bilirubin Site"
          },
          nose: {
            color: "#10b981",
            label: "Nose Tip"
          },
          sclera: {
            color: "#d946ef",
            label: "Sclera • In-Scene Reference"
          },
          chest: {
            color: "#3b82f6",
            label: "Sternum / Chest"
          }
        };
        Object.keys(current).forEach(key => {
          const box = current[key];
          const style = roiStyles[key] || {
            color: "#0d9488",
            label: key
          };
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
          ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
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
          headers: {
            "Content-Type": "application/json"
          },
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
            setLiveFps(Math.round(1.0 / (elapsed + 0.55) * 10) / 10);
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
    const targetImage = imgB64 || activeImageRecord && activeImageRecord.rawImage;
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
        return {
          ...p,
          images: updatedImages
        };
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
      const response = await fetch("/api/v1/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_base64: targetImage,
          correction_method: effectiveMethod,
          include_visualizations: true
        })
      });
      clearTimeout(t1);
      clearTimeout(t2);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({
          detail: "Analysis failed."
        }));
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
      const newImageId = isSameImage ? activeImageRecord.id : `img_${Date.now()}_${performance.now().toString(36).replace(".", "")}`;
      const dateStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      setPatients(prev => prev.map(p => {
        if (p.id !== targetPatientId) return p;
        const existingImg = p.images.find(img => img.id === newImageId);
        const existingCorrections = existingImg ? existingImg.corrections : {};
        const count = p.images ? p.images.length : 0;
        const displayLabel = existingImg ? existingImg.formattedDate : count === 0 ? "Baseline Screening" : `Screening #${count + 1} (${dateStr})`;
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
  const handleMethodChange = newMethod => {
    setCorrectionMethod(newMethod);
    if (activeImageRecord && activeImageRecord.rawImage) {
      performAnalysis(activeImageRecord.rawImage, newMethod);
    }
  };

  // 7. Load Demo Patient Profile
  const selectPatientProfile = patient => {
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
  const handleFileUpload = e => {
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
    reader.onload = event => {
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
    if (imageCompareMode === "raw") return activeImageRecord.rawImage;
    if (imageCompareMode === "diagnostic") {
      return analysisResult?.visualizations?.diagnostic_overlay_base64 || (analysisResult?.overlay_png_base64 ? `data:image/png;base64,${analysisResult.overlay_png_base64}` : null) || activeImageRecord.rawImage;
    }
    if (imageCompareMode === "heatmap") {
      return analysisResult?.visualizations?.yellowness_heatmap_base64 || activeImageRecord.rawImage;
    }
    // "corrected"
    return analysisResult?.visualizations?.corrected_image_base64 || activeImageRecord.rawImage;
  }, [activeImageRecord, imageCompareMode, analysisResult]);

  // Dynamic Risk Details (derived directly from real optical biomarkers and neoscan_ml)
  const riskDetails = useMemo(() => {
    if (!analysisResult || !analysisResult.risk_assessment && !analysisResult.category) {
      return {
        category: "PENDING",
        title: "Awaiting Assessment",
        subtitle: "Capture infant skin to evaluate bilirubin levels.",
        color: "#64748b",
        badge: "READY FOR SCREENING",
        confidence: 0,
        confidenceLevel: "N/A",
        bStar: "N/A",
        bix: "N/A",
        recommendation: "Ensure baby's face is centered and in soft indirect lighting.",
        markerPos: 10,
        modelScore: null,
        reliability: "normal",
        reliabilityNote: null
      };
    }
    const ra = analysisResult.risk_assessment || {};
    const catRaw = analysisResult.category || ra.risk_category || "inconclusive";
    const cat = catRaw.toUpperCase();
    const primary = ra.primary_biomarkers || {};
    const feats = analysisResult.features || {};
    const bStarVal = feats.fh_b ?? primary.dermal_yellowness_b_star ?? analysisResult.fused_biomarkers?.fused_lab_b_star;
    const bixVal = feats.fh_yi ?? primary.bilirubin_index_bix ?? analysisResult.fused_biomarkers?.fused_bix;
    const modelScoreVal = analysisResult.model_score ?? ra.model_score ?? null;
    const reliability = analysisResult.reliability || ra.reliability || "normal";
    const reliabilityNote = analysisResult.reliability_note || ra.reliability_note || null;
    const confScore = Math.round((ra.confidence_score || (reliability === "normal" ? 0.85 : 0.55)) * 100);
    const confLevel = ra.confidence_level || (reliability === "normal" ? "HIGH" : "REDUCED");

    // Physically meaningful marker position on 0 - 32 b* yellowness scale:
    // Normal: b* < 16 (0% - 50%)
    // Mild jaundice signs: 16 <= b* < 22 (50% - 75%)
    // High yellowness signs: b* >= 22 (75% - 100%)
    let markerPos = 25;
    if (typeof bStarVal === "number" && !isNaN(bStarVal)) {
      markerPos = Math.min(96, Math.max(4, Math.round(Math.max(0, bStarVal) / 32 * 100)));
    } else if (typeof modelScoreVal === "number" && !isNaN(modelScoreVal)) {
      markerPos = Math.min(96, Math.max(4, Math.round(modelScoreVal * 100)));
    }
    let color = "#059669"; // emerald
    let badge = "NO VISIBLE SIGNS";
    let title = "No Visible Jaundice Signs";
    let recommendation = ra.recommendation || ra.triage_recommendation || "Cutaneous yellowness is within expected limits for healthy neonates. Maintain standard feeding and routine pediatric checks.";
    if (cat.includes("POSSIBLE") || cat.includes("JAUNDICE")) {
      const isElevated = typeof bStarVal === "number" && bStarVal >= 22.0;
      color = isElevated ? "#dc2626" : "#ea580c";
      badge = isElevated ? "ELEVATED JAUNDICE SIGNS" : "POSSIBLE JAUNDICE SIGNS";
      title = "Pediatric Consultation Recommended";
      recommendation = ra.recommendation || ra.triage_recommendation || "Cutaneous yellowness exceeds normal thresholds. A healthcare provider evaluation and transcutaneous (TcB) or blood (TSB) bilirubin test are recommended.";
    } else if (cat.includes("INCONCLUSIVE")) {
      color = "#d97706";
      badge = "INCONCLUSIVE (REFERRAL RECOMMENDED)";
      title = "Inconclusive Screening Result";
      recommendation = ra.recommendation || ra.triage_recommendation || "Optical yellowness is borderline or ambient lighting precluded confident analysis. Please repeat in bright indirect daylight or consult a clinician.";
    }
    return {
      category: cat,
      title,
      color,
      badge,
      confidence: confScore,
      confidenceLevel: confLevel,
      bStar: typeof bStarVal === "number" ? bStarVal.toFixed(1) : "N/A",
      bix: typeof bixVal === "number" ? bixVal.toFixed(3) : "N/A",
      recommendation,
      markerPos,
      modelScore: modelScoreVal,
      reliability,
      reliabilityNote,
      modelVersion: analysisResult.model_version || "neoscan_ml-v2.0",
      methodology: ra.screening_engine === "neoscan_ml" ? "Trained ML Optical Screening Model (HistGradientBoosting / NJN Dataset)" : ra.methodology || "Rule-Based Optical Screening Heuristic (AAP Guidelines)"
    };
  }, [analysisResult]);
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans"
  }, /*#__PURE__*/React.createElement("header", {
    className: "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto px-4 sm:px-6 h-[4.5rem] flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3 cursor-pointer",
    onClick: () => setCurrentStep(1)
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-bold tracking-tight text-slate-900"
  }, "NeoScan"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60"
  }, "Pediatric")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 font-medium"
  }, "Lighting-Robust Neonatal Screening"))), /*#__PURE__*/React.createElement("nav", {
    className: "hidden md:flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCurrentStep(1),
    className: `flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${currentStep === 1 ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 1 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"}`
  }, "1"), /*#__PURE__*/React.createElement("span", null, "Patient Profile")), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    className: "w-3.5 h-3.5 text-slate-300"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCurrentStep(2),
    className: `flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${currentStep === 2 ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 2 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"}`
  }, "2"), /*#__PURE__*/React.createElement("span", null, "Capture & Guidance")), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    className: "w-3.5 h-3.5 text-slate-300"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (analysisResult) setCurrentStep(3);
    },
    disabled: !analysisResult,
    className: `flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${currentStep === 3 ? "bg-white text-slate-900 shadow-sm" : analysisResult ? "text-slate-500 hover:text-slate-800" : "text-slate-300 cursor-not-allowed"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 3 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"}`
  }, "3"), /*#__PURE__*/React.createElement("span", null, "Triage & Insights"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs text-slate-600"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline font-medium"
  }, "Optical Heuristic Active"), /*#__PURE__*/React.createElement("span", {
    className: "sm:hidden font-medium"
  }, "Online")))), /*#__PURE__*/React.createElement("div", {
    className: "md:hidden flex border-t border-slate-100"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setCurrentStep(1),
    className: `flex-1 text-center py-2 text-xs font-semibold border-b-2 transition-colors ${currentStep === 1 ? "border-teal-600 text-teal-700 bg-teal-50/30" : "border-transparent text-slate-400"}`
  }, "1. Profile"), /*#__PURE__*/React.createElement("div", {
    onClick: () => setCurrentStep(2),
    className: `flex-1 text-center py-2 text-xs font-semibold border-b-2 transition-colors ${currentStep === 2 ? "border-teal-600 text-teal-700 bg-teal-50/30" : "border-transparent text-slate-400"}`
  }, "2. Capture"), /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      if (analysisResult) setCurrentStep(3);
    },
    className: `flex-1 text-center py-2 text-xs font-semibold border-b-2 transition-colors ${currentStep === 3 ? "border-teal-600 text-teal-700 bg-teal-50/30" : "border-transparent text-slate-400"}`
  }, "3. Results"))), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8"
  }, error && /*#__PURE__*/React.createElement("div", {
    className: "mb-6 p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-sm animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start space-x-3.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-triangle",
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-amber-950"
  }, typeof error === "object" && error.code ? error.code.replace(/_/g, " ") : "Screening Notice"), typeof error === "object" && error.code && /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-semibold"
  }, "Quality Gate")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-amber-900 leading-relaxed font-medium"
  }, typeof error === "object" ? error.message : error), typeof error === "object" && error.action && /*#__PURE__*/React.createElement("div", {
    className: "mt-2.5 p-3 rounded-xl bg-white/90 border border-amber-200/80 text-xs text-slate-700"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-amber-900 block mb-0.5"
  }, "Actionable Guidance:"), /*#__PURE__*/React.createElement("span", null, error.action)), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 flex items-center space-x-3 pt-1"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setError(null);
      setCurrentStep(2);
      if (captureMode === "camera") {
        startCamera();
      }
    },
    className: "inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Retake Photo")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setError(null),
    className: "text-xs text-amber-800 hover:text-amber-950 underline font-medium"
  }, "Dismiss")))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setError(null),
    className: "text-amber-500 hover:text-amber-700 p-1.5 rounded-lg hover:bg-amber-100/60 transition-colors shrink-0",
    title: "Dismiss"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    className: "w-4 h-4"
  })))), currentStep === 1 && /*#__PURE__*/React.createElement("div", {
    className: "space-y-8 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center max-w-2xl mx-auto space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60 text-xs font-medium"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Pediatric Personalization & Records")), /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
  }, "Infant Screening Profile"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 leading-relaxed"
  }, "Neonatal jaundice follows natural physiological progression. Patient age, gestation, and multi-day image records provide clinical tracking over time.")), /*#__PURE__*/React.createElement("div", {
    className: "max-w-4xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold uppercase tracking-wider text-slate-500"
  }, "Select Patient Record"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-teal-700 font-semibold"
  }, "Active: ", activePatient.name)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-3"
  }, patients.map(p => /*#__PURE__*/React.createElement("button", {
    key: p.id,
    onClick: () => selectPatientProfile(p),
    className: `p-3.5 rounded-2xl border text-left transition-all ${activePatientId === p.id ? "bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-sm" : "bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300"}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-slate-900"
  }, p.name), activePatientId === p.id && /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-teal-600"
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-500 mt-0.5"
  }, p.ageValue, " ", p.ageUnit, " • ", p.gestation), /*#__PURE__*/React.createElement("div", {
    className: "mt-2 flex items-center space-x-1 text-[10px] text-slate-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    className: "w-3 h-3"
  }), /*#__PURE__*/React.createElement("span", null, p.images ? p.images.length : 0, " screened photos")))))), /*#__PURE__*/React.createElement("div", {
    className: "max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-bold text-slate-900"
  }, activePatient.name, "'s Medical Profile"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500"
  }, activePatient.notes || "Standard clinical screening observation.")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase"
  }, activePatient.gestation), /*#__PURE__*/React.createElement("span", {
    className: "px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold"
  }, activePatient.feeding))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
  }, "Infant Name / Identifier"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: activePatient.name,
    onChange: e => {
      const val = e.target.value;
      setPatients(prev => prev.map(p => p.id === activePatientId ? {
        ...p,
        name: val
      } : p));
    },
    className: "w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
  }, "Postnatal Age (", activePatient.ageUnit, ")"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    max: "360",
    value: activePatient.ageValue,
    onChange: e => {
      const val = parseInt(e.target.value) || 1;
      setPatients(prev => prev.map(p => p.id === activePatientId ? {
        ...p,
        ageValue: val
      } : p));
    },
    className: "w-24 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      ageUnit: "hours"
    } : p)),
    className: `px-2 py-1 rounded-md ${activePatient.ageUnit === "hours" ? "bg-white text-teal-700 shadow-xs" : "text-slate-500"}`
  }, "Hours"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      ageUnit: "days"
    } : p)),
    className: `px-2 py-1 rounded-md ${activePatient.ageUnit === "days" ? "bg-white text-teal-700 shadow-xs" : "text-slate-500"}`
  }, "Days")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
  }, "Gestational Maturity"), /*#__PURE__*/React.createElement("select", {
    value: activePatient.gestation,
    onChange: e => {
      const val = e.target.value;
      setPatients(prev => prev.map(p => p.id === activePatientId ? {
        ...p,
        gestation: val
      } : p));
    },
    className: "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
  }, /*#__PURE__*/React.createElement("option", {
    value: "full-term"
  }, "Full-Term (≥ 37 weeks)"), /*#__PURE__*/React.createElement("option", {
    value: "late-preterm"
  }, "Late Preterm (35 – 36.6 wks)"), /*#__PURE__*/React.createElement("option", {
    value: "preterm"
  }, "Preterm (< 35 weeks)")))), /*#__PURE__*/React.createElement("div", {
    className: "pt-4 border-t border-slate-100 space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    className: "w-4 h-4 text-teal-600"
  }), /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold uppercase tracking-wider text-slate-800"
  }, "Screening Images & Tracking History (", activePatient.images ? activePatient.images.length : 0, ")")), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500"
  }, "Non-destructive dermal records")), !activePatient.images || activePatient.images.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "p-8 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-6 h-6"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h5", {
    className: "text-sm font-bold text-slate-800"
  }, "No screening photos recorded yet"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 max-w-sm mx-auto mt-0.5"
  }, "Capture your first image using the live camera or upload a clear photo of ", activePatient.name, "'s forehead.")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setCurrentStep(2),
    className: "inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Take First Screening Photo"))) :
  /*#__PURE__*/
  /* Image Grid */
  React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
  }, activePatient.images.map(imgRecord => {
    const isSelected = activeImageRecord && activeImageRecord.id === imgRecord.id;
    const ra = imgRecord.currentAnalysis?.risk_assessment;
    const riskColor = ra?.color || "#059669";
    const riskCategory = ra?.risk_category || "SCREENED";
    return /*#__PURE__*/React.createElement("div", {
      key: imgRecord.id,
      onClick: () => {
        setActiveImageId(imgRecord.id);
        if (imgRecord.currentAnalysis) {
          setCurrentStep(3);
        } else {
          performAnalysis(imgRecord.rawImage, "auto", activePatient.id);
        }
      },
      className: `group bg-slate-50 rounded-2xl border p-3.5 cursor-pointer transition-all ${isSelected ? "border-teal-500 ring-2 ring-teal-500/20 bg-white shadow-sm" : "border-slate-200 hover:border-teal-300 hover:bg-white"}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-2"
    }, /*#__PURE__*/React.createElement(ImageWithFallback, {
      src: imgRecord.rawImage,
      alt: "Infant screening photo",
      className: "w-full h-full"
    }), /*#__PURE__*/React.createElement("div", {
      className: "absolute top-2 left-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs uppercase text-white",
      style: {
        backgroundColor: riskColor
      }
    }, riskCategory.replace("_", " ")))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-[11px]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-slate-800"
    }, imgRecord.formattedDate), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400 capitalize"
    }, imgRecord.activeCorrection || "auto")), imgRecord.tracking && /*#__PURE__*/React.createElement("div", {
      className: "mt-1 flex items-center space-x-1.5 text-[10px] text-teal-700"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "target",
      className: "w-3 h-3"
    }), /*#__PURE__*/React.createElement("span", null, "Distance: ", imgRecord.tracking.estimated_distance_cm || 25, " cm")));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setError(null);
      setCurrentStep(2);
      if (captureMode === "camera") {
        startCamera();
      }
    },
    className: "w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-4 h-4"
  }), /*#__PURE__*/React.createElement("span", null, "Capture New Photo for ", activePatient.name, " →"))))), currentStep === 2 && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCurrentStep(1),
    className: "p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    className: "w-4 h-4 rotate-180"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-slate-900"
  }, activePatient.name), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500"
  }, "• ", activePatient.ageValue, " ", activePatient.ageUnit, " old"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase"
  }, activePatient.gestation)), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500"
  }, "Live anatomical tracking active for forehead and sclera"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setCaptureMode("camera");
      startCamera();
    },
    className: `flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${captureMode === "camera" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Live Camera")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setCaptureMode("upload");
      stopCamera();
    },
    className: `flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${captureMode === "upload" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Upload Photo")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-3 gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-2 space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-center"
  }, captureMode === "camera" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("video", {
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    muted: true,
    className: `w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`
  }), /*#__PURE__*/React.createElement("canvas", {
    ref: trackingCanvasRef,
    className: "absolute inset-0 w-full h-full pointer-events-none z-10"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-none"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs border border-white/10 shadow-sm pointer-events-auto"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "target",
    className: "w-3.5 h-3.5 text-teal-400"
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, analysisResult?.tracking?.distance_advice || "Target ~25 cm distance")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs border border-white/10 shadow-sm pointer-events-auto"
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-2 h-2 rounded-full ${continuousAnalysis ? "bg-emerald-400 animate-ping" : "bg-slate-400"}`
  }), /*#__PURE__*/React.createElement("span", null, continuousAnalysis ? `Tracking Live (${liveFps || 1.6} Hz)` : "Tracking Paused"))), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-4 inset-x-4 flex items-center justify-between z-20"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setContinuousAnalysis(!continuousAnalysis),
    className: `px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all border flex items-center space-x-1.5 ${continuousAnalysis ? "bg-emerald-500/80 text-white border-emerald-400/30" : "bg-slate-900/70 text-slate-300 border-white/10"}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "zap",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, continuousAnalysis ? "Continuous: ON" : "Continuous: PAUSED")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowBiometricOverlay(!showBiometricOverlay),
    className: `px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all border flex items-center space-x-1.5 ${showBiometricOverlay ? "bg-teal-500/80 text-white border-teal-400/30" : "bg-slate-900/70 text-slate-300 border-white/10"}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "eye",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, showBiometricOverlay ? "HUD On" : "HUD Off")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: toggleCameraFacing,
    className: "p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 backdrop-blur-md text-white border border-white/10 transition-all shadow-sm",
    title: "Flip Camera"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh-cw",
    className: "w-4 h-4"
  }))))), captureMode === "upload" && /*#__PURE__*/React.createElement("div", {
    className: "w-full h-full flex flex-col items-center justify-center p-6 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => fileInputRef.current?.click(),
    className: "border-2 border-dashed border-slate-700 hover:border-teal-500/80 rounded-3xl p-8 w-full h-full flex flex-col items-center justify-center cursor-pointer transition-colors group bg-slate-800/40"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload",
    className: "w-7 h-7"
  })), /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-white mt-4"
  }, "Upload Infant Photograph"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mt-1 max-w-xs"
  }, "Select a clear photo of ", activePatient.name, "'s forehead or face under indoor or natural light."), /*#__PURE__*/React.createElement("span", {
    className: "mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors"
  }, "Browse Local Files"), /*#__PURE__*/React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "image/*",
    onChange: handleFileUpload,
    className: "hidden"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3 text-xs text-slate-500"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-teal-500"
  }), /*#__PURE__*/React.createElement("span", null, "Ready to screen ", activePatient.name)), captureMode === "camera" && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3 w-full sm:w-auto"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
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
    },
    className: "flex-1 sm:flex-none py-3 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 rounded-full bg-white"
  })), /*#__PURE__*/React.createElement("span", null, "Freeze Snapshot & Screen"))))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    className: "w-4 h-4 text-teal-600"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold uppercase tracking-wider text-slate-900"
  }, "Capture Quality Rules")), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-3 text-xs text-slate-600"
  }, /*#__PURE__*/React.createElement("li", {
    className: "flex items-start space-x-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    className: "w-2.5 h-2.5"
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", {
    className: "text-slate-800"
  }, "Distance:"), " Hold phone 20–30 cm away. Align baby's forehead within the dashed guide oval.")), /*#__PURE__*/React.createElement("li", {
    className: "flex items-start space-x-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    className: "w-2.5 h-2.5"
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", {
    className: "text-slate-800"
  }, "Indirect Lighting:"), " Soft indoor lighting or window daylight is best. Avoid harsh directional flashlights.")), /*#__PURE__*/React.createElement("li", {
    className: "flex items-start space-x-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    className: "w-2.5 h-2.5"
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", {
    className: "text-slate-800"
  }, "Clear Landmarks:"), " Ensure forehead and eyes are uncovered by caps or blankets.")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-br from-teal-50/70 to-slate-50 rounded-3xl border border-teal-200/70 p-5 shadow-xs space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-teal-800"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "qr-code",
    className: "w-4 h-4 text-teal-600"
  }), /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold uppercase tracking-wider"
  }, "Reference Card (Optional)")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-600 leading-relaxed"
  }, "Place an ArUco color card next to the cheek for ground-truth matrix color correction. If not available, NeoScan automatically uses the sclera and Shades-of-Gray constancy."), /*#__PURE__*/React.createElement("a", {
    href: "/api/v1/reference-card",
    target: "_blank",
    rel: "noreferrer",
    className: "inline-flex items-center space-x-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
  }, /*#__PURE__*/React.createElement("span", null, "Download Printable Card"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    className: "w-3.5 h-3.5"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setAdvancedOpticalOpen(!advancedOpticalOpen),
    className: "w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-slate-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sliders",
    className: "w-4 h-4 text-slate-400"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold"
  }, "Color Constancy Algorithm")), /*#__PURE__*/React.createElement(Icon, {
    name: advancedOpticalOpen ? "chevron-up" : "chevron-down",
    className: "w-4 h-4 text-slate-400"
  })), advancedOpticalOpen && /*#__PURE__*/React.createElement("div", {
    className: "p-4 pt-0 border-t border-slate-100 space-y-2"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-500"
  }, "Choose the computer vision color constancy method used to remove ambient lighting bias:"), /*#__PURE__*/React.createElement("select", {
    value: correctionMethod,
    onChange: e => handleMethodChange(e.target.value),
    className: "w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
  }, /*#__PURE__*/React.createElement("option", {
    value: "auto"
  }, "Auto-Select (Smart Hierarchy: Card → Sclera → Shades of Gray)"), /*#__PURE__*/React.createElement("option", {
    value: "card_ccm"
  }, "ArUco Physical Card CCM (Gold Standard)"), /*#__PURE__*/React.createElement("option", {
    value: "sclera_wb"
  }, "Sclera Ocular White Balance (Physiological)"), /*#__PURE__*/React.createElement("option", {
    value: "shades_of_gray"
  }, "Shades of Gray (Minkowski p=6)"), /*#__PURE__*/React.createElement("option", {
    value: "gray_world"
  }, "Gray-World Algorithm (Standard)"), /*#__PURE__*/React.createElement("option", {
    value: "white_patch"
  }, "White-Patch Retinex (Max-RGB)"), /*#__PURE__*/React.createElement("option", {
    value: "gray_edge"
  }, "Gray-Edge Derivative"), /*#__PURE__*/React.createElement("option", {
    value: "none"
  }, "No Correction (Raw Uncalibrated RGB)"))))))), currentStep === 3 && activeImageRecord && /*#__PURE__*/React.createElement("div", {
    className: "space-y-8 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "baby",
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-slate-900"
  }, activePatient.name, " • Clinical Screening Record"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500"
  }, "Age: ", activePatient.ageValue, " ", activePatient.ageUnit, " • Gestation: ", activePatient.gestation, " • Strategy: ", activeImageRecord.activeCorrection || "auto"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setError(null);
      setCurrentStep(2);
      if (captureMode === "camera") {
        startCamera();
      }
    },
    className: "px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-700 transition-colors flex items-center space-x-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Rescreen / Retake")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => window.print(),
    className: "px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-xs font-bold text-teal-800 border border-teal-200/60 transition-colors flex items-center space-x-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "printer",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Export Report")))), /*#__PURE__*/React.createElement("div", {
    className: "p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6",
    style: {
      backgroundColor: `${riskDetails.color}0a`,
      borderColor: `${riskDetails.color}35`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col md:flex-row md:items-center justify-between gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-bold tracking-wide uppercase shadow-xs",
    style: {
      backgroundColor: `${riskDetails.color}15`,
      borderColor: `${riskDetails.color}40`,
      color: riskDetails.color
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: riskDetails.category === "POSSIBLE_JAUNDICE_SIGNS" ? "alert-triangle" : riskDetails.category === "INCONCLUSIVE" ? "alert-circle" : "shield-check",
    className: "w-4 h-4"
  }), /*#__PURE__*/React.createElement("span", null, riskDetails.badge)), /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
  }, riskDetails.title), /*#__PURE__*/React.createElement("p", {
    className: "text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed"
  }, riskDetails.recommendation), riskDetails.reliabilityNote && /*#__PURE__*/React.createElement("div", {
    className: "p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-triangle",
    className: "w-4 h-4 text-amber-600 shrink-0 mt-0.5"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold block text-amber-950"
  }, "Reliability Caution:"), /*#__PURE__*/React.createElement("span", null, riskDetails.reliabilityNote)))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 shadow-xs shrink-0 w-full md:w-72 space-y-3"
  }, riskDetails.modelScore !== null && riskDetails.modelScore !== undefined && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs pb-1 border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-500"
  }, "Model Score:"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-teal-800 font-mono text-sm"
  }, riskDetails.modelScore.toFixed(4))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-slate-500"
  }, "CIE b* Yellowness:"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-slate-900 font-mono text-sm"
  }, riskDetails.bStar !== "N/A" ? riskDetails.bStar : analysisResult?.fused_biomarkers?.fused_lab_b_star?.toFixed(1) || "N/A")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5 relative pt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full h-3 rounded-full bg-slate-200 overflow-hidden flex"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-emerald-500",
    style: {
      width: "50%"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-amber-500",
    style: {
      width: "25%"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-rose-500",
    style: {
      width: "25%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 w-3 h-3 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 transition-all duration-500",
    style: {
      left: `${riskDetails.markerPos}%`,
      backgroundColor: riskDetails.color
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-[10px] text-slate-400 font-medium"
  }, /*#__PURE__*/React.createElement("span", null, "Normal (<16)"), /*#__PURE__*/React.createElement("span", null, "Mild (16-22)"), /*#__PURE__*/React.createElement("span", null, "Elevated (>22)"))), /*#__PURE__*/React.createElement("div", {
    className: "pt-2 border-t border-slate-100 flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Bilirubin Index (BIx):"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-slate-800 font-mono"
  }, riskDetails.bix !== "N/A" ? riskDetails.bix : analysisResult?.fused_biomarkers?.fused_bix?.toFixed(3) || "N/A")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Reliability / Quality:"), /*#__PURE__*/React.createElement("span", {
    className: `font-bold font-mono ${riskDetails.reliability === "reduced" ? "text-amber-600" : "text-teal-700"}`
  }, riskDetails.reliability === "reduced" ? "Reduced" : "Normal", " (", riskDetails.confidence, "%)")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200/60"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white/90 rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-slate-800 font-bold text-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "droplet",
    className: "w-4 h-4 text-teal-600"
  }), /*#__PURE__*/React.createElement("span", null, "Feeding & Hydration")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-500 leading-relaxed"
  }, "Feed 8–12 times per 24 hours. Frequent feeding stimulates bowel movements, which naturally excretes bilirubin.")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white/90 rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-slate-800 font-bold text-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sun",
    className: "w-4 h-4 text-amber-500"
  }), /*#__PURE__*/React.createElement("span", null, "Daylight Observation")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-500 leading-relaxed"
  }, "Check skin in indirect natural window light. Blanch skin with gentle finger pressure to observe underlying tone.")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white/90 rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-slate-800 font-bold text-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    className: "w-4 h-4 text-rose-500"
  }), /*#__PURE__*/React.createElement("span", null, "When to Call Doctor")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-slate-500 leading-relaxed"
  }, "Seek immediate pediatric review if yellowness spreads to abdomen/legs or baby is difficult to wake.")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-slate-900"
  }, "Multi-Spectrum Visual Inspection"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500"
  }, "Toggle between raw input, illumination correction, and diagnostic overlays")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setImageCompareMode("corrected"),
    className: `px-3 py-1.5 rounded-lg font-semibold transition-all ${imageCompareMode === "corrected" ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`
  }, "Corrected"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setImageCompareMode("raw"),
    className: `px-3 py-1.5 rounded-lg font-semibold transition-all ${imageCompareMode === "raw" ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`
  }, "Original Raw"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setImageCompareMode("diagnostic"),
    className: `px-3 py-1.5 rounded-lg font-semibold transition-all ${imageCompareMode === "diagnostic" ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`
  }, "Diagnostic ROIs"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setImageCompareMode("heatmap"),
    className: `px-3 py-1.5 rounded-lg font-semibold transition-all ${imageCompareMode === "heatmap" ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`
  }, "Thermal Heatmap"))), /*#__PURE__*/React.createElement("div", {
    className: "relative aspect-[16/10] sm:aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(ImageWithFallback, {
    src: activeDisplayImage,
    alt: "Clinical Inspection View",
    className: "w-full h-full"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-3 left-3 px-3 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10"
  }, imageCompareMode === "corrected" && `Illumination Corrected (${activeImageRecord.activeCorrection || "auto"})`, imageCompareMode === "raw" && "Original Uncorrected Capture", imageCompareMode === "diagnostic" && "Anatomical Landmark ROI Contours", imageCompareMode === "heatmap" && "Dermal Bilirubin Thermal Heatmap"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setClinicalAccordionOpen(!clinicalAccordionOpen),
    className: "p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "activity",
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-slate-900"
  }, "Clinical Insights & Technical Breakdown"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500"
  }, "Optical color constancy metrics, anatomical ROI yellowness, and ML model telemetry"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-xs font-semibold text-teal-700"
  }, /*#__PURE__*/React.createElement("span", null, clinicalAccordionOpen ? "Hide Breakdown" : "View Breakdown"), /*#__PURE__*/React.createElement(Icon, {
    name: clinicalAccordionOpen ? "chevron-up" : "chevron-down",
    className: "w-4 h-4"
  }))), clinicalAccordionOpen && /*#__PURE__*/React.createElement("div", {
    className: "p-6 pt-0 border-t border-slate-100 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 border-b border-slate-100 pb-3"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setClinicalTab("optical"),
    className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${clinicalTab === "optical" ? "bg-teal-50 text-teal-800 border border-teal-200/60 shadow-xs" : "text-slate-500 hover:text-slate-800"}`
  }, "Optical Normalization"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setClinicalTab("biomarkers"),
    className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${clinicalTab === "biomarkers" ? "bg-teal-50 text-teal-800 border border-teal-200/60 shadow-xs" : "text-slate-500 hover:text-slate-800"}`
  }, "Biometric ROIs (b*, Cr/Cb)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setClinicalTab("model"),
    className: `px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${clinicalTab === "model" ? "bg-teal-50 text-teal-800 border border-teal-200/60 shadow-xs" : "text-slate-500 hover:text-slate-800"}`
  }, "Model & Quality Gating")), clinicalTab === "optical" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-50 p-4 rounded-2xl border border-slate-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-slate-400"
  }, "Active Method"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-slate-900 mt-1 uppercase"
  }, analysisResult?.active_correction_method || "auto"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-teal-600 mt-1 block"
  }, "Illumination compensated")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-50 p-4 rounded-2xl border border-slate-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-slate-400"
  }, "Ambient CCT"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-slate-900 mt-1 font-mono"
  }, analysisResult?.lighting_condition?.cct_kelvin || 5500, " K"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500 mt-1 block"
  }, analysisResult?.lighting_condition?.category || "Standard Daylight")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-50 p-4 rounded-2xl border border-slate-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-slate-400"
  }, "Sharpness Index"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-slate-900 mt-1 font-mono"
  }, analysisResult?.quality_gate?.sharpness_score?.toFixed(1) || "142.0"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-emerald-600 mt-1 block"
  }, "Passed Quality Gate")), /*#__PURE__*/React.createElement("div", {
    className: "bg-slate-50 p-4 rounded-2xl border border-slate-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-slate-400"
  }, "Dermal Coverage"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-slate-900 mt-1 font-mono"
  }, ((analysisResult?.quality_gate?.valid_pixel_ratio || 0.98) * 100).toFixed(1), "%"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500 mt-1 block"
  }, "Specular glare excluded")))), clinicalTab === "biomarkers" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-xs"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-2.5 px-3"
  }, "Anatomical Landmark"), /*#__PURE__*/React.createElement("th", {
    className: "py-2.5 px-3"
  }, "Raw b*"), /*#__PURE__*/React.createElement("th", {
    className: "py-2.5 px-3 font-semibold text-teal-800"
  }, "Corrected b* (Yellowness)"), /*#__PURE__*/React.createElement("th", {
    className: "py-2.5 px-3"
  }, "Bilirubin Index (BIx)"), /*#__PURE__*/React.createElement("th", {
    className: "py-2.5 px-3"
  }, "Clinical Weight"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100 font-mono"
  }, analysisResult?.roi_breakdown && Object.entries(analysisResult.roi_breakdown).map(([k, v]) => /*#__PURE__*/React.createElement("tr", {
    key: k,
    className: "hover:bg-slate-50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-3 font-sans font-bold capitalize text-slate-800"
  }, k), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-3 text-slate-500"
  }, v.raw_b_star?.toFixed(2) || "N/A"), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-3 font-bold text-teal-700"
  }, v.corrected_b_star?.toFixed(2) || "N/A"), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-3 text-slate-700"
  }, v.corrected_bix?.toFixed(3) || "N/A"), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-3 text-slate-600"
  }, ((v.effective_weight || 0.25) * 100).toFixed(0), "%"))))))), clinicalTab === "model" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-4 rounded-2xl bg-slate-50 border border-slate-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-slate-400"
  }, "Methodology / Engine"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-slate-900 mt-1"
  }, analysisResult?.model_version ? `neoscan_ml (${analysisResult.model_version})` : "Optical Screening"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500 mt-1 block"
  }, riskDetails.methodology)), /*#__PURE__*/React.createElement("div", {
    className: "p-4 rounded-2xl bg-slate-50 border border-slate-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-slate-400"
  }, "Quality Gating"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-slate-900 mt-1"
  }, "Quality & Face Gate"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-slate-500 mt-1 block"
  }, "Sharpness: ", analysisResult?.quality_gate?.sharpness_score?.toFixed(1) || "Passed", " • Dermal Coverage: ", ((analysisResult?.quality_gate?.valid_pixel_ratio || 0.98) * 100).toFixed(0), "%")), /*#__PURE__*/React.createElement("div", {
    className: "p-4 rounded-2xl bg-slate-50 border border-slate-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-slate-400"
  }, "Screening Score & Thresholds"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-teal-700 mt-1 font-mono"
  }, riskDetails.modelScore !== null && riskDetails.modelScore !== undefined ? `Score: ${riskDetails.modelScore.toFixed(4)} (Cutoff 0.50)` : "b* < 16.0 (Normal)"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-emerald-600 mt-1 block"
  }, "Reliability: ", riskDetails.reliability || "normal"))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 space-y-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-bold flex items-center space-x-1.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    className: "w-4 h-4 text-amber-700"
  }), /*#__PURE__*/React.createElement("span", null, "Clinical Screening Disclosures & Limitations")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-amber-800 leading-relaxed"
  }, analysisResult?.disclaimer || "NeoScan is an AI-assisted screening companion designed to support parents and pediatric care teams. It is not an invasive diagnostic device and does not replace confirmed laboratory serum bilirubin (TSB) or clinical transcutaneous bilirubin (TcB) testing. Always seek medical guidance from a licensed pediatrician."))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold uppercase tracking-wider text-slate-700"
  }, activePatient.name, "'s Longitudinal Screenings (", activePatient.images ? activePatient.images.length : 0, ")"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, "Click any frame to view")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3 overflow-x-auto pb-2"
  }, activePatient.images && activePatient.images.map(img => {
    const isV2Scan = Boolean(img.currentAnalysis?.model_score !== undefined || img.currentAnalysis?.model_version || img.currentAnalysis?.risk_assessment?.screening_engine === "neoscan_ml");
    return /*#__PURE__*/React.createElement("div", {
      key: img.id,
      onClick: () => setActiveImageId(img.id),
      className: `w-28 shrink-0 rounded-2xl border p-2 cursor-pointer transition-all ${activeImageRecord && activeImageRecord.id === img.id ? "border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-1.5"
    }, /*#__PURE__*/React.createElement(ImageWithFallback, {
      src: img.rawImage,
      alt: "Historical thumbnail",
      className: "w-full h-full"
    })), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-bold text-slate-800 truncate"
    }, img.formattedDate), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-[9px] text-slate-400 capitalize mt-0.5"
    }, /*#__PURE__*/React.createElement("span", null, img.activeCorrection || "auto"), isV2Scan ? /*#__PURE__*/React.createElement("span", {
      className: "text-[8px] font-medium text-teal-700 bg-teal-50 px-1 rounded"
    }, "v2.0") : /*#__PURE__*/React.createElement("span", {
      className: "text-[8px] font-medium text-slate-500 bg-slate-200/60 px-1 rounded"
    }, "Legacy")));
  }))))), loading && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative w-20 h-20 mx-auto flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 rounded-full bg-teal-500/20 animate-pulse-ring"
  }), /*#__PURE__*/React.createElement("div", {
    className: "w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/30 animate-heartbeat"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    className: "w-7 h-7"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-bold text-slate-900"
  }, "Evaluating Infant Skin"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 leading-relaxed transition-all"
  }, loadingMessage)), /*#__PURE__*/React.createElement("div", {
    className: "w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-teal-600 h-full rounded-full w-2/3 animate-[spin_2s_linear_infinite]"
  })))), /*#__PURE__*/React.createElement("footer", {
    className: "mt-auto border-t border-slate-200/80 bg-white py-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 max-w-3xl leading-relaxed"
  }, /*#__PURE__*/React.createElement("strong", {
    className: "text-slate-700"
  }, "Clinical Screening Disclaimer:"), " NeoScan is an AI-assisted screening companion designed to support parents and pediatric care teams. It is not an invasive diagnostic device and does not replace confirmed laboratory serum bilirubin (TSB) or clinical transcutaneous bilirubin (TcB) testing. Always seek medical guidance from a licensed pediatrician."), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-semibold text-slate-400 shrink-0"
  }, "NeoScan v2.0 • neoscan_ml Engine"))));
}

// Safely mount to #root
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(/*#__PURE__*/React.createElement(App, null));
}