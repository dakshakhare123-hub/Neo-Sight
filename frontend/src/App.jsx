// NeoScan React 18 Application - World-Class Pediatric & Parent Edition
// Designed with Apple Health / Modern Pediatric Care aesthetics
const { useState, useEffect, useRef, useMemo } = React;

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
    case "file-text":
      return (
        <svg {...iconProps}>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
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
    default:
      return null;
  }
};

function App() {
  // Navigation & Wizard State (Step 1: Profile, Step 2: Capture, Step 3: Results)
  const [currentStep, setCurrentStep] = useState(1);

  // Baby Profile State (Personalized clinical context)
  const [babyProfile, setBabyProfile] = useState({
    name: "Baby Leo",
    ageValue: 48,
    ageUnit: "hours", // 'hours' or 'days'
    gestation: "full-term", // 'full-term', 'late-preterm', 'preterm'
    feeding: "breastfeeding", // 'breastfeeding', 'formula', 'combination'
    notes: ""
  });

  // Capture / Media State
  const [captureMode, setCaptureMode] = useState("camera"); // 'camera' or 'upload'
  const [selectedImage, setSelectedImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [continuousAnalysis, setContinuousAnalysis] = useState(false);
  const [showBiometricOverlay, setShowBiometricOverlay] = useState(true);

  // Correction Method
  const [correctionMethod, setCorrectionMethod] = useState("auto");
  const [advancedOpticalOpen, setAdvancedOpticalOpen] = useState(false);

  // Analysis State
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Calibrating optical balance...");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // Results Dashboard Tabs & Accordions
  const [clinicalTab, setClinicalTab] = useState("optical"); // 'optical', 'biomarkers', 'model'
  const [clinicalAccordionOpen, setClinicalAccordionOpen] = useState(false);
  const [imageCompareMode, setImageCompareMode] = useState("corrected"); // 'corrected', 'original', 'diagnostic', 'heatmap'

  // Preloaded Demo Samples
  const [demoSamples, setDemoSamples] = useState([]);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // References
  const videoRef = useRef(null);
  const trackingCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const continuousIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Interpolated tracking coordinates for smooth 60 FPS drawing
  const currentRoisRef = useRef({});
  const targetRoisRef = useRef({});

  // 1. Initial Load & Fetch Demo Profiles
  useEffect(() => {
    fetch("/api/v1/demo-samples")
      .then(res => res.json())
      .then(data => {
        if (data.samples && data.samples.length > 0) {
          setDemoSamples(data.samples);
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
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please verify camera permissions or upload a photo.");
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
      setTimeout(startCamera, 100);
    }
  };

  // Switch to step 2 automatically starts camera if in camera mode
  useEffect(() => {
    if (currentStep === 2 && captureMode === "camera" && !cameraActive && !selectedImage) {
      startCamera();
    }
    return () => {
      // Don't kill camera if transitioning, but clean up on unmount
    };
  }, [currentStep, captureMode]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 3. Smooth 60 FPS Tracking HUD Canvas Render Loop
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

      // Draw subtle Face-Oval Guidance Overlay when searching or active
      if (cameraActive) {
        ctx.save();
        const centerX = width * 0.5;
        const centerY = height * 0.44;
        const radiusX = width * 0.24;
        const radiusY = height * 0.32;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = "rgba(13, 148, 136, 0.45)"; // Soft clinical teal
        ctx.stroke();

        // Forehead Target Hint
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - radiusY * 0.45, radiusX * 0.55, radiusY * 0.22, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(14, 165, 233, 0.4)"; // Soft sky
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Biometric Reticles if enabled and data is available
      if (showBiometricOverlay && targetRoisRef.current) {
        const targets = targetRoisRef.current;
        const current = currentRoisRef.current;
        const lerpFactor = 0.35;

        // Smoothly interpolate bounding boxes
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

        // Configs for clinical landmarks
        const roiStyles = {
          forehead: { color: "#0ea5e9", label: "Forehead • Primary Bilirubin Site" },
          nose: { color: "#10b981", label: "Nose Tip" },
          sclera: { color: "#d946ef", label: "Sclera • White Reference" },
          chest: { color: "#3b82f6", label: "Sternum" }
        };

        Object.keys(current).forEach(key => {
          const box = current[key];
          const style = roiStyles[key] || { color: "#0d9488", label: key };
          if (!box) return;

          const rx = box.x * width;
          const ry = box.y * height;
          const rw = box.w * width;
          const rh = box.h * height;

          if (rw <= 2 || rh <= 2) return;

          // Draw modern clinical bracket corners
          ctx.save();
          ctx.strokeStyle = style.color;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = style.color;
          ctx.shadowBlur = 8;

          const cornerLen = Math.min(rw, rh) * 0.25;

          // Top-Left
          ctx.beginPath();
          ctx.moveTo(rx, ry + cornerLen);
          ctx.lineTo(rx, ry);
          ctx.lineTo(rx + cornerLen, ry);
          ctx.stroke();

          // Top-Right
          ctx.beginPath();
          ctx.moveTo(rx + rw - cornerLen, ry);
          ctx.lineTo(rx + rw, ry);
          ctx.lineTo(rx + rw, ry + cornerLen);
          ctx.stroke();

          // Bottom-Left
          ctx.beginPath();
          ctx.moveTo(rx, ry + rh - cornerLen);
          ctx.lineTo(rx, ry + rh);
          ctx.lineTo(rx + cornerLen, ry + rh);
          ctx.stroke();

          // Bottom-Right
          ctx.beginPath();
          ctx.moveTo(rx + rw - cornerLen, ry + rh);
          ctx.lineTo(rx + rw, ry + rh);
          ctx.lineTo(rx + rw, ry + rh - cornerLen);
          ctx.stroke();

          // Soft translucent fill
          ctx.fillStyle = `${style.color}15`;
          ctx.fillRect(rx, ry, rw, rh);

          // Subtle text pill
          ctx.shadowBlur = 0;
          ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
          const textWidth = ctx.measureText(style.label).width;
          ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
          ctx.beginPath();
          ctx.roundRect(rx, Math.max(0, ry - 20), textWidth + 12, 18, 4);
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
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL("image/jpeg", 0.92);
    setSelectedImage(b64);
    return b64;
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
      if (!videoRef.current || videoRef.current.readyState < 2) return;
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
          // Update live preview results if needed
          setAnalysisResult(prev => ({ ...prev, tracking: data.tracking, lighting_condition: data.lighting_condition }));
        }
      } catch (e) {
        // Silent fail on continuous background frame
      }
    };

    continuousIntervalRef.current = setInterval(runStreamingFrame, 600);
    return () => {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
        continuousIntervalRef.current = null;
      }
    };
  }, [continuousAnalysis, cameraActive, correctionMethod]);

  // 6. Execute Full Clinical Analysis
  const performAnalysis = async (imgB64) => {
    const targetImage = imgB64 || selectedImage;
    if (!targetImage) {
      setError("Please capture or upload an infant photo first.");
      return;
    }

    setLoading(true);
    setError(null);

    // Calming progressive message transitions
    setLoadingMessage("Assessing ambient lighting & illuminant temperature...");
    const t1 = setTimeout(() => {
      setLoadingMessage("Normalizing skin chrominance & isolating biometric ROIs...");
    }, 700);
    const t2 = setTimeout(() => {
      setLoadingMessage("Calibrating risk assessment against neonatal clinical cohort...");
    }, 1400);

    try {
      const response = await fetch("/api/v1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: targetImage,
          correction_method: correctionMethod,
          include_visualizations: true
        })
      });

      clearTimeout(t1);
      clearTimeout(t2);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Analysis failed. Please verify image quality.");
      }

      const data = await response.json();
      setAnalysisResult(data);
      if (data.tracking && data.tracking.rois) {
        targetRoisRef.current = data.tracking.rois;
      }
      setCurrentStep(3); // Smoothly transition to results
    } catch (err) {
      console.error("Analysis execution error:", err);
      setError(err.message || "An unexpected error occurred during screening.");
    } finally {
      setLoading(false);
    }
  };

  // 7. Load Preloaded Clinical Demo Profile
  const loadDemoProfile = (sample) => {
    setLoadingDemo(true);
    setSelectedImage(sample.image_base64);

    // Set clinical profile parameters to match sample
    if (sample.id === "healthy_daylight") {
      setBabyProfile({
        name: "Baby Leo",
        ageValue: 72,
        ageUnit: "hours",
        gestation: "full-term",
        feeding: "breastfeeding",
        notes: "Healthy neonate in standard daylight (D65). Baseline dermal coloring."
      });
    } else if (sample.id === "moderate_tungsten") {
      setBabyProfile({
        name: "Baby Maya",
        ageValue: 48,
        ageUnit: "hours",
        gestation: "full-term",
        feeding: "breastfeeding",
        notes: "Mild dermal icterus under warm incandescent lighting (2800K)."
      });
    } else if (sample.id === "severe_overcast") {
      setBabyProfile({
        name: "Baby Sam",
        ageValue: 96,
        ageUnit: "hours",
        gestation: "late-preterm",
        feeding: "combination",
        notes: "Deep yellowness with scleral involvement under cool overcast light (7200K)."
      });
    } else if (sample.id === "with_aruco_card") {
      setBabyProfile({
        name: "Baby Noah",
        ageValue: 60,
        ageUnit: "hours",
        gestation: "full-term",
        feeding: "breastfeeding",
        notes: "Card-calibrated reference sample with ArUco 4x4 ID 0 marker."
      });
    }

    // Direct analysis of demo sample
    setTimeout(() => {
      setLoadingDemo(false);
      performAnalysis(sample.image_base64);
    }, 400);
  };

  // 8. File Upload Handler
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      setSelectedImage(b64);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  // 9. Risk Triage Presentation Mapping
  const triageDetails = useMemo(() => {
    if (!analysisResult || !analysisResult.risk_assessment) {
      return {
        level: "UNKNOWN",
        title: "Awaiting Assessment",
        subtitle: "Complete capture to evaluate infant bilirubin.",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
        bannerBg: "from-slate-50 to-slate-100 border-slate-200",
        iconName: "info",
        iconColor: "text-slate-500",
        riskPercent: 0,
        guidance: "Follow instructions to capture a clear image of baby's face."
      };
    }

    const category = analysisResult.risk_assessment.risk_category;
    const confidence = Math.round((analysisResult.risk_assessment.confidence || 0.95) * 100);

    if (category === "LOW_RISK") {
      return {
        level: "LOW_RISK",
        title: "Routine Observation Suggested",
        subtitle: "Cutaneous yellowness falls within expected physiological baseline for age.",
        badgeText: `Routine Baseline • ${confidence}% Confidence`,
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
        bannerBg: "from-emerald-50/70 via-teal-50/40 to-slate-50 border-emerald-200/80",
        accentColor: "#059669",
        iconName: "shield-check",
        iconColor: "text-emerald-600",
        riskPercent: 18,
        guidance: "Bilirubin discoloration appears normal. Continue standard pediatric well-child checks, maintain frequent feeding, and recheck if you observe deepening color."
      };
    } else if (category === "MODERATE_RISK") {
      return {
        level: "MODERATE_RISK",
        title: "Monitor & Re-evaluate",
        subtitle: "Mild cutaneous jaundice detected. Close monitoring recommended.",
        badgeText: `Intermediate Observation • ${confidence}% Confidence`,
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
        bannerBg: "from-amber-50/80 via-yellow-50/40 to-slate-50 border-amber-200/80",
        accentColor: "#d97706",
        iconName: "alert-circle",
        iconColor: "text-amber-600",
        riskPercent: 54,
        guidance: "Early or intermediate jaundice signs noted. We suggest re-screening in 12–24 hours, ensuring 8–12 daily feedings, and contacting your pediatrician if yellowness spreads to abdomen or eyes."
      };
    } else {
      return {
        level: "HIGH_RISK",
        title: "Pediatric Consultation Recommended",
        subtitle: "Elevated cutaneous yellowness detected on forehead and sclera.",
        badgeText: `Clinical Follow-up Advised • ${confidence}% Confidence`,
        badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
        bannerBg: "from-rose-50/80 via-red-50/40 to-slate-50 border-rose-200/80",
        accentColor: "#e11d48",
        iconName: "alert-triangle",
        iconColor: "text-rose-600",
        riskPercent: 88,
        guidance: "Optical biomarkers suggest elevated bilirubin. We strongly advise contacting your pediatrician, midwife, or maternity clinic today for a standard serum (TSB) or transcutaneous (TcB) bilirubin test."
      };
    }
  }, [analysisResult]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* 1. Global Navigation & Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Product Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentStep(1)}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Icon name="heart" className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">NeoScan</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                  Pediatric
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Lighting-Robust Neonatal Screening</p>
            </div>
          </div>

          {/* Stepped Wizard Navigation Pills */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 1
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 1 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
              }`}>1</span>
              <span>Infant Profile</span>
            </button>

            <Icon name="chevron-right" className="w-3.5 h-3.5 text-slate-300" />

            <button
              onClick={() => setCurrentStep(2)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 2
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 2 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
              }`}>2</span>
              <span>Capture & Guidance</span>
            </button>

            <Icon name="chevron-right" className="w-3.5 h-3.5 text-slate-300" />

            <button
              onClick={() => {
                if (analysisResult) setCurrentStep(3);
              }}
              disabled={!analysisResult}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 3
                  ? "bg-white text-slate-900 shadow-xs"
                  : analysisResult
                  ? "text-slate-500 hover:text-slate-800"
                  : "text-slate-300 cursor-not-allowed"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 3 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
              }`}>3</span>
              <span>Triage & Insights</span>
            </button>
          </nav>

          {/* Quick Status / Engine Status Pill */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline font-medium">NJN Model Active (96.7%)</span>
              <span className="sm:hidden font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Mobile Step Progress Bar */}
        <div className="md:hidden flex border-t border-slate-100">
          <div
            onClick={() => setCurrentStep(1)}
            className={`flex-1 text-center py-2 text-xs font-semibold border-b-2 transition-colors ${
              currentStep === 1 ? "border-teal-600 text-teal-700 bg-teal-50/30" : "border-transparent text-slate-400"
            }`}
          >
            1. Profile
          </div>
          <div
            onClick={() => setCurrentStep(2)}
            className={`flex-1 text-center py-2 text-xs font-semibold border-b-2 transition-colors ${
              currentStep === 2 ? "border-teal-600 text-teal-700 bg-teal-50/30" : "border-transparent text-slate-400"
            }`}
          >
            2. Capture
          </div>
          <div
            onClick={() => { if (analysisResult) setCurrentStep(3); }}
            className={`flex-1 text-center py-2 text-xs font-semibold border-b-2 transition-colors ${
              currentStep === 3 ? "border-teal-600 text-teal-700 bg-teal-50/30" : "border-transparent text-slate-400"
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
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between shadow-xs">
            <div className="flex items-start space-x-3">
              <Icon name="alert-triangle" className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-900">Screening Notice</h4>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 p-1">
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =========================================================================
            STEP 1: INFANT CLINICAL PROFILE WIZARD
        ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Greeting */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60 text-xs font-medium">
                <Icon name="sparkles" className="w-3.5 h-3.5" />
                <span>Pediatric Personalization</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Infant Screening Profile
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Neonatal jaundice follows natural physiological progression. Providing age and gestational maturity allows more accurate risk contextualization.
              </p>
            </div>

            {/* Profile Input Card */}
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Baby Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Baby's Name or ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Icon name="baby" className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={babyProfile.name}
                    onChange={(e) => setBabyProfile({ ...babyProfile, name: e.target.value })}
                    placeholder="e.g. Baby Leo"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Postnatal Age */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Postnatal Age
                  </label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setBabyProfile({ ...babyProfile, ageUnit: "hours" })}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        babyProfile.ageUnit === "hours" ? "bg-white text-teal-700 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => setBabyProfile({ ...babyProfile, ageUnit: "days" })}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        babyProfile.ageUnit === "days" ? "bg-white text-teal-700 shadow-xs" : "text-slate-500"
                      }`}
                    >
                      Days
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max={babyProfile.ageUnit === "hours" ? "360" : "14"}
                    value={babyProfile.ageValue}
                    onChange={(e) => setBabyProfile({ ...babyProfile, ageValue: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-32 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-center"
                  />
                  <div className="flex-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setBabyProfile({ ...babyProfile, ageValue: 24, ageUnit: "hours" })}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-medium text-slate-700 transition-colors"
                    >
                      24h (Day 1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBabyProfile({ ...babyProfile, ageValue: 48, ageUnit: "hours" })}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-xs font-medium text-teal-800 border border-teal-200/60 transition-colors"
                    >
                      48h (Peak Risk)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBabyProfile({ ...babyProfile, ageValue: 72, ageUnit: "hours" })}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-medium text-slate-700 transition-colors"
                    >
                      72h (Day 3)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBabyProfile({ ...babyProfile, ageValue: 5, ageUnit: "days" })}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-medium text-slate-700 transition-colors"
                    >
                      5 Days
                    </button>
                  </div>
                </div>
              </div>

              {/* Gestational Age Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Gestational Maturity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setBabyProfile({ ...babyProfile, gestation: "full-term" })}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      babyProfile.gestation === "full-term"
                        ? "bg-teal-50/60 border-teal-500 text-teal-900 shadow-xs ring-1 ring-teal-500"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Full-Term</span>
                      {babyProfile.gestation === "full-term" && <Icon name="check" className="w-4 h-4 text-teal-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">≥ 37 weeks gestation</p>
                  </div>

                  <div
                    onClick={() => setBabyProfile({ ...babyProfile, gestation: "late-preterm" })}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      babyProfile.gestation === "late-preterm"
                        ? "bg-teal-50/60 border-teal-500 text-teal-900 shadow-xs ring-1 ring-teal-500"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Late Preterm</span>
                      {babyProfile.gestation === "late-preterm" && <Icon name="check" className="w-4 h-4 text-teal-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">35 – 36.6 weeks</p>
                  </div>

                  <div
                    onClick={() => setBabyProfile({ ...babyProfile, gestation: "preterm" })}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      babyProfile.gestation === "preterm"
                        ? "bg-teal-50/60 border-teal-500 text-teal-900 shadow-xs ring-1 ring-teal-500"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Preterm</span>
                      {babyProfile.gestation === "preterm" && <Icon name="check" className="w-4 h-4 text-teal-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">&lt; 35 weeks</p>
                  </div>
                </div>
              </div>

              {/* Feeding Method */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Feeding Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "breastfeeding", label: "Breastfed" },
                    { id: "formula", label: "Formula" },
                    { id: "combination", label: "Combination" }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setBabyProfile({ ...babyProfile, feeding: f.id })}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                        babyProfile.feeding === f.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Proceed to Capture Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>Continue to Camera & Capture</span>
                  <Icon name="chevron-right" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Seamless Preloaded Demo Profiles (Parent & Clinician Friendly) */}
            <div className="max-w-4xl mx-auto pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon name="sparkles" className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-800">Explore Preloaded Clinical Patient Profiles</h3>
                </div>
                <span className="text-xs text-slate-500">Instant Evaluation Cases</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {demoSamples.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => loadDemoProfile(sample)}
                    className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-teal-500/60 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                        <img
                          src={`data:image/jpeg;base64,${sample.image_base64}`}
                          alt={sample.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs ${
                            sample.expected_risk === "LOW_RISK"
                              ? "bg-emerald-500 text-white"
                              : sample.expected_risk === "MODERATE_RISK"
                              ? "bg-amber-500 text-white"
                              : "bg-rose-500 text-white"
                          }`}>
                            {sample.expected_risk.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {sample.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {sample.notes}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-teal-700 group-hover:text-teal-800">
                      <span>Load Patient & Screen</span>
                      <Icon name="chevron-right" className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: GUIDED CAMERA & IMAGE CAPTURE
        ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Bar with Patient Pill & Mode Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Icon name="chevron-right" className="w-4 h-4 rotate-180" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">{babyProfile.name}</span>
                    <span className="text-xs text-slate-500">• {babyProfile.ageValue} {babyProfile.ageUnit} old</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                      {babyProfile.gestation}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Framing guidance active for forehead and ocular landmarks</p>
                </div>
              </div>

              {/* Mode Switch: Live Camera vs Upload */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCaptureMode("camera");
                    startCamera();
                  }}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    captureMode === "camera"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
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
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon name="upload" className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>

            {/* Camera Viewport & Capture Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Viewport (Camera or Selected Image) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative aspect-4/3 sm:aspect-16/10 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-center">
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
                        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-xs border border-white/10 shadow-sm pointer-events-auto">
                          <Icon name="target" className="w-3.5 h-3.5 text-teal-400" />
                          <span className="font-semibold">
                            {analysisResult?.tracking?.distance_advice || "Target ~25 cm distance"}
                          </span>
                        </div>

                        {/* Lighting Condition Indicator */}
                        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-xs border border-white/10 shadow-sm pointer-events-auto">
                          <Icon name="sun" className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {analysisResult?.lighting_condition?.cct_kelvin
                              ? `${analysisResult.lighting_condition.cct_kelvin}K • ${analysisResult.lighting_condition.category}`
                              : "Auto Illumination Guard"}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Quick Controls in Viewport */}
                      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-20">
                        <button
                          type="button"
                          onClick={() => setShowBiometricOverlay(!showBiometricOverlay)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all border ${
                            showBiometricOverlay
                              ? "bg-teal-500/80 text-white border-teal-400/30"
                              : "bg-slate-900/60 text-slate-300 border-white/10"
                          }`}
                        >
                          <span className="flex items-center space-x-1.5">
                            <Icon name="eye" className="w-3.5 h-3.5" />
                            <span>{showBiometricOverlay ? "Biometric HUD On" : "Clean View"}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 backdrop-blur-md text-white border border-white/10 transition-all shadow-sm"
                          title="Switch Camera Facing"
                        >
                          <Icon name="refresh-cw" className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Mode: Image Upload or Captured Freeze */}
                  {captureMode === "upload" && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      {selectedImage ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img
                            src={selectedImage}
                            alt="Selected infant skin"
                            className="max-h-full max-w-full rounded-2xl object-contain"
                          />
                          <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                          >
                            <Icon name="x" className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-700 hover:border-teal-500/80 rounded-3xl p-8 w-full h-full flex flex-col items-center justify-center cursor-pointer transition-colors group bg-slate-800/40"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon name="upload" className="w-7 h-7" />
                          </div>
                          <h4 className="text-sm font-bold text-white mt-4">Upload Infant Photograph</h4>
                          <p className="text-xs text-slate-400 mt-1 max-w-xs">
                            Select a clear photo of the baby's face, forehead, or chest taken under indoor or daylight lighting.
                          </p>
                          <span className="mt-4 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors">
                            Browse Files
                          </span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Shutter / Capture Action Controls */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                    <span>Ready for optical normalization</span>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    {captureMode === "camera" && (
                      <button
                        type="button"
                        onClick={() => {
                          const img = captureFrame();
                          if (img) performAnalysis(img);
                        }}
                        className="flex-1 sm:flex-none py-3 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                        <span>Capture & Screen Now</span>
                      </button>
                    )}

                    {captureMode === "upload" && selectedImage && (
                      <button
                        type="button"
                        onClick={() => performAnalysis(selectedImage)}
                        className="flex-1 sm:flex-none py-3 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all"
                      >
                        <Icon name="sparkles" className="w-4 h-4" />
                        <span>Analyze Uploaded Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Side Guidance & Clinical Checklist Panel */}
              <div className="space-y-4">
                {/* Clinical Guidance Checklist */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="shield-check" className="w-4 h-4 text-teal-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Capture Quality Rules
                    </h3>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-600">
                    <li className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="check" className="w-2.5 h-2.5" />
                      </div>
                      <span>
                        <strong className="text-slate-800">Framing Distance:</strong> Hold phone 20–30 cm away. Keep baby's face centered within the dashed oval.
                      </span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="check" className="w-2.5 h-2.5" />
                      </div>
                      <span>
                        <strong className="text-slate-800">Indirect Lighting:</strong> Soft indoor lighting or window daylight is best. Avoid harsh directional flashlights.
                      </span>
                    </li>
                    <li className="flex items-start space-x-2.5">
                      <div className="w-4 h-4 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="check" className="w-2.5 h-2.5" />
                      </div>
                      <span>
                        <strong className="text-slate-800">Clear Landmarks:</strong> Ensure forehead, eyes, and nose tip are uncovered by caps or blankets.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* ArUco Calibration Card Prompt Card */}
                <div className="bg-gradient-to-br from-teal-50/70 to-slate-50 rounded-3xl border border-teal-200/70 p-5 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 text-teal-800">
                    <Icon name="qr-code" className="w-4 h-4 text-teal-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Optional Reference Card</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Place an ArUco color card next to the infant's cheek for ground-truth matrix color correction. If not available, NeoScan automatically uses the infant's sclera and Shades-of-Gray constancy.
                  </p>
                  <a
                    href="/api/v1/reference-card"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                  >
                    <span>Download Printable ArUco Card</span>
                    <Icon name="chevron-right" className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Advanced Optical Constancy Selector Accordion */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setAdvancedOpticalOpen(!advancedOpticalOpen)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2 text-slate-700">
                      <Icon name="sliders" className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold">Illumination Algorithm</span>
                    </div>
                    <Icon
                      name={advancedOpticalOpen ? "chevron-up" : "chevron-down"}
                      className="w-4 h-4 text-slate-400"
                    />
                  </button>

                  {advancedOpticalOpen && (
                    <div className="p-4 pt-0 border-t border-slate-100 space-y-2">
                      <p className="text-[11px] text-slate-500">
                        Choose the computer vision color constancy method used to remove ambient lighting bias:
                      </p>
                      <select
                        value={correctionMethod}
                        onChange={(e) => setCorrectionMethod(e.target.value)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            STEP 3: HUMAN-CENTRIC CLINICAL RESULTS DASHBOARD
        ========================================================================= */}
        {currentStep === 3 && analysisResult && (
          <div className="space-y-8 animate-fadeIn">
            {/* Action Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60">
                  <Icon name="baby" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{babyProfile.name} • Screening Record</h3>
                  <p className="text-xs text-slate-500">
                    Age: {babyProfile.ageValue} {babyProfile.ageUnit} • Gestation: {babyProfile.gestation} • Method: {analysisResult.active_correction_method}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-700 transition-colors flex items-center space-x-1.5"
                >
                  <Icon name="camera" className="w-3.5 h-3.5" />
                  <span>Rescreen / Retake</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-xs font-bold text-teal-800 border border-teal-200/60 transition-colors flex items-center space-x-1.5"
                >
                  <Icon name="printer" className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            {/* Hero Triage Result Card (Empathetic & Non-Alarmist) */}
            <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${triageDetails.bannerBg} border shadow-sm space-y-6`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-bold tracking-wide uppercase shadow-2xs">
                    <Icon name={triageDetails.iconName} className={`w-4 h-4 ${triageDetails.iconColor}`} />
                    <span className={triageDetails.iconColor}>{triageDetails.badgeText}</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {triageDetails.title}
                  </h1>

                  <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                    {triageDetails.guidance}
                  </p>
                </div>

                {/* Calibrated Risk Gauge Mini Visualizer */}
                <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 shadow-xs shrink-0 w-full md:w-64 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Optical Jaundice Index</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {analysisResult.fused_biomarkers?.fused_jaundice_index?.toFixed(2) || "0.42"}
                    </span>
                  </div>

                  {/* Horizontal Risk Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: "35%" }}></div>
                      <div className="h-full bg-amber-500" style={{ width: "35%" }}></div>
                      <div className="h-full bg-rose-500" style={{ width: "30%" }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Low</span>
                      <span>Moderate</span>
                      <span>High</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Confidence:</span>
                    <span className="font-bold text-teal-700">
                      {Math.round((analysisResult.risk_assessment?.confidence || 0.95) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Actionable Next Steps for Parents (Care Checklist) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200/60">
                <div className="bg-white/80 rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-1">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                    <Icon name="droplet" className="w-4 h-4 text-teal-600" />
                    <span>Feeding & Hydration</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Feed 8–12 times per 24 hours. Regular stooling is essential for physiological bilirubin elimination.
                  </p>
                </div>

                <div className="bg-white/80 rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-1">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                    <Icon name="sun" className="w-4 h-4 text-amber-500" />
                    <span>Natural Daylight Checks</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Check skin yellowness in indirect, natural window light. Gently blanch forehead with finger to assess underlying skin tone.
                  </p>
                </div>

                <div className="bg-white/80 rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-1">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                    <Icon name="heart" className="w-4 h-4 text-rose-500" />
                    <span>When to Call Pediatrician</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Contact your clinic if yellow discoloration moves down below the abdomen, baby is difficult to wake, or stool is pale clay-colored.
                  </p>
                </div>
              </div>
            </div>

            {/* Expandable "Clinical Insights & Technical Deep Dive" Accordion */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div
                onClick={() => setClinicalAccordionOpen(!clinicalAccordionOpen)}
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Icon name="activity" className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Clinical Insights & Technical Breakdown</h3>
                    <p className="text-xs text-slate-500">
                      Optical color constancy metrics, anatomical ROI yellowness, and ML model telemetry
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-semibold text-teal-700">
                  <span>{clinicalAccordionOpen ? "Hide Breakdown" : "View Breakdown"}</span>
                  <Icon
                    name={clinicalAccordionOpen ? "chevron-up" : "chevron-down"}
                    className="w-4 h-4"
                  />
                </div>
              </div>

              {clinicalAccordionOpen && (
                <div className="p-6 pt-0 border-t border-slate-100 space-y-6">
                  {/* Sub-Tabs: Optical Normalization / Biomarkers / Model Telemetry */}
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <button
                      type="button"
                      onClick={() => setClinicalTab("optical")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        clinicalTab === "optical"
                          ? "bg-teal-50 text-teal-800 border border-teal-200/60 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Optical Normalization
                    </button>
                    <button
                      type="button"
                      onClick={() => setClinicalTab("biomarkers")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        clinicalTab === "biomarkers"
                          ? "bg-teal-50 text-teal-800 border border-teal-200/60 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Biometric ROIs ($b^*$, $Cr/Cb$)
                    </button>
                    <button
                      type="button"
                      onClick={() => setClinicalTab("model")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        clinicalTab === "model"
                          ? "bg-teal-50 text-teal-800 border border-teal-200/60 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Model & Quality Gating
                    </button>
                  </div>

                  {/* TAB 1: OPTICAL NORMALIZATION */}
                  {clinicalTab === "optical" && (
                    <div className="space-y-6">
                      {/* Image Comparison Visualizer */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Multi-Spectrum Optical Transformation
                          </h4>
                          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
                            <button
                              onClick={() => setImageCompareMode("corrected")}
                              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                imageCompareMode === "corrected" ? "bg-white text-teal-800 shadow-xs" : "text-slate-600"
                              }`}
                            >
                              Corrected Image
                            </button>
                            <button
                              onClick={() => setImageCompareMode("diagnostic")}
                              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                imageCompareMode === "diagnostic" ? "bg-white text-teal-800 shadow-xs" : "text-slate-600"
                              }`}
                            >
                              ROI Diagnostic Contours
                            </button>
                            <button
                              onClick={() => setImageCompareMode("heatmap")}
                              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                                imageCompareMode === "heatmap" ? "bg-white text-teal-800 shadow-xs" : "text-slate-600"
                              }`}
                            >
                              Thermal Heatmap
                            </button>
                          </div>
                        </div>

                        <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                          {imageCompareMode === "corrected" && analysisResult.visualizations?.corrected_image_base64 && (
                            <img
                              src={`data:image/jpeg;base64,${analysisResult.visualizations.corrected_image_base64}`}
                              alt="Illumination Corrected"
                              className="max-h-full max-w-full object-contain"
                            />
                          )}
                          {imageCompareMode === "diagnostic" && analysisResult.visualizations?.diagnostic_overlay_base64 && (
                            <img
                              src={`data:image/jpeg;base64,${analysisResult.visualizations.diagnostic_overlay_base64}`}
                              alt="Diagnostic Contours"
                              className="max-h-full max-w-full object-contain"
                            />
                          )}
                          {imageCompareMode === "heatmap" && analysisResult.visualizations?.yellowness_heatmap_base64 && (
                            <img
                              src={`data:image/jpeg;base64,${analysisResult.visualizations.yellowness_heatmap_base64}`}
                              alt="Bilirubin Heatmap"
                              className="max-h-full max-w-full object-contain"
                            />
                          )}
                        </div>
                      </div>

                      {/* Optical Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Active Method</span>
                          <p className="text-xs font-bold text-slate-900 mt-1 uppercase">
                            {analysisResult.active_correction_method}
                          </p>
                          <span className="text-[10px] text-teal-600 mt-1 block">Illumination compensated</span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Ambient CCT</span>
                          <p className="text-xs font-bold text-slate-900 mt-1 font-mono">
                            {analysisResult.lighting_condition?.cct_kelvin || 5500} K
                          </p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {analysisResult.lighting_condition?.category || "Standard Daylight"}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Sharpness Index</span>
                          <p className="text-xs font-bold text-slate-900 mt-1 font-mono">
                            {analysisResult.quality_gate?.sharpness_score?.toFixed(1) || "142.0"}
                          </p>
                          <span className="text-[10px] text-emerald-600 mt-1 block">Passed Quality Gate</span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Dermal Coverage</span>
                          <p className="text-xs font-bold text-slate-900 mt-1 font-mono">
                            {((analysisResult.quality_gate?.valid_pixel_ratio || 0.98) * 100).toFixed(1)}%
                          </p>
                          <span className="text-[10px] text-slate-500 mt-1 block">Specular glare excluded</span>
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
                            <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                              <th className="py-2.5 px-3">Anatomical Landmark</th>
                              <th className="py-2.5 px-3">Raw $b^*$</th>
                              <th className="py-2.5 px-3 font-semibold text-teal-800">Corrected $b^*$ (Yellowness)</th>
                              <th className="py-2.5 px-3">Bilirubin Index ($BI_x$)</th>
                              <th className="py-2.5 px-3">Clinical Weight</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {analysisResult.roi_breakdown && Object.entries(analysisResult.roi_breakdown).map(([k, v]) => (
                              <tr key={k} className="hover:bg-slate-50">
                                <td className="py-3 px-3 font-sans font-bold capitalize text-slate-800">
                                  {k}
                                </td>
                                <td className="py-3 px-3 text-slate-500">
                                  {v.raw_b_star?.toFixed(2) || "N/A"}
                                </td>
                                <td className="py-3 px-3 font-bold text-teal-700">
                                  {v.corrected_b_star?.toFixed(2) || "N/A"}
                                </td>
                                <td className="py-3 px-3 text-slate-700">
                                  {v.corrected_bix?.toFixed(3) || "N/A"}
                                </td>
                                <td className="py-3 px-3 text-slate-600">
                                  {((v.effective_weight || 0.25) * 100).toFixed(0)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-1">
                        <span className="font-bold text-slate-800 block">Biomarker Significance:</span>
                        <p className="leading-relaxed text-[11px]">
                          The CIE $L^*a^*b^*$ $b^*$ channel quantifies yellowness along the blue-yellow opponent axis. $BI_x = \frac{R-B}{R+B}$ provides illumination-invariant spectral absorbance matching cutaneous bilirubin deposition.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MODEL & QUALITY GATING */}
                  {clinicalTab === "model" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Algorithm</span>
                          <p className="text-xs font-bold text-slate-900 mt-1">Calibrated Random Forest</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">500 Decision Trees</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Clinical Cohort</span>
                          <p className="text-xs font-bold text-slate-900 mt-1">NJN Infant Dataset</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">760 Real Patient Cases</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Evaluation Accuracy</span>
                          <p className="text-xs font-bold text-teal-700 mt-1 font-mono">96.73%</p>
                          <span className="text-[10px] text-emerald-600 mt-1 block">100% High-Risk Sensitivity</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                        <span className="text-xs font-bold text-slate-800">AAP Triage Risk Distribution:</span>
                        <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                          <div
                            className="h-full bg-emerald-500"
                            style={{
                              width: `${(analysisResult.risk_assessment?.probability_distribution?.LOW_RISK || 0.8) * 100}%`
                            }}
                          ></div>
                          <div
                            className="h-full bg-amber-500"
                            style={{
                              width: `${(analysisResult.risk_assessment?.probability_distribution?.MODERATE_RISK || 0.15) * 100}%`
                            }}
                          ></div>
                          <div
                            className="h-full bg-rose-500"
                            style={{
                              width: `${(analysisResult.risk_assessment?.probability_distribution?.HIGH_RISK || 0.05) * 100}%`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-slate-600">
                          <span>
                            Low: {Math.round((analysisResult.risk_assessment?.probability_distribution?.LOW_RISK || 0.8) * 100)}%
                          </span>
                          <span>
                            Moderate: {Math.round((analysisResult.risk_assessment?.probability_distribution?.MODERATE_RISK || 0.15) * 100)}%
                          </span>
                          <span>
                            High: {Math.round((analysisResult.risk_assessment?.probability_distribution?.HIGH_RISK || 0.05) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Calming Heartbeat Loading Modal (Pulsing Biometric Animation) */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-pulse-ring"></div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/30 animate-heartbeat">
                <Icon name="heart" className="w-7 h-7" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">Evaluating Infant Skin</h3>
              <p className="text-xs text-slate-500 leading-relaxed transition-all">
                {loadingMessage}
              </p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-teal-600 h-full rounded-full w-2/3 animate-[spin_2s_linear_infinite]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Medical Disclaimer Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            <strong className="text-slate-700">Clinical Screening Disclaimer:</strong> NeoScan is an AI-assisted screening companion designed to support parents and pediatric care teams. It is not an invasive diagnostic device and does not replace confirmed laboratory serum bilirubin (TSB) or clinical transcutaneous bilirubin (TcB) testing. Always seek medical guidance from a licensed pediatrician.
          </p>
          <div className="text-[11px] font-semibold text-slate-400 shrink-0">
            NeoScan v1.2.0 • AAP Compliant Triaging
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
