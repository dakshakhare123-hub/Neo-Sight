// NeoScan React 18 Application - Real-Time Optical Screening Edition
const { useState, useEffect, useRef } = React;

// Safe, native React SVG Icons (prevents Lucide DOM mutation crashes)
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
    case "eye":
      return (
        <svg {...iconProps}>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
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
    case "target":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
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
    case "x":
      return (
        <svg {...iconProps}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "download":
      return (
        <svg {...iconProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
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
          <line x1="2" y1="2" x2="22" y2="22" />
          <path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16" />
          <path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        </svg>
      );
    case "video":
      return (
        <svg {...iconProps}>
          <path d="m22 8-6 4 6 4V8Z" />
          <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
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
    case "aperture":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
          <line x1="9.69" y1="8" x2="21.17" y2="8" />
          <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
          <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
          <line x1="14.31" y1="16" x2="2.83" y2="16" />
          <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
        </svg>
      );
    case "flip-horizontal":
      return (
        <svg {...iconProps}>
          <path d="m3 7 5 5-5 5V7" />
          <path d="m21 7-5 5 5 5V7" />
          <path d="M12 20v2" />
          <path d="M12 14v2" />
          <path d="M12 8v2" />
          <path d="M12 2v2" />
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
    case "scan":
      return (
        <svg {...iconProps}>
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        </svg>
      );
    case "sun":
    case "sun-medium":
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
    case "layers":
      return (
        <svg {...iconProps}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "stethoscope":
      return (
        <svg {...iconProps}>
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
          <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
          <circle cx="20" cy="10" r="2" />
        </svg>
      );
    case "scan-face":
      return (
        <svg {...iconProps}>
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
          <path d="M10 14a3.5 3.5 0 0 0 4 0" />
        </svg>
      );
    case "bar-chart-2":
      return (
        <svg {...iconProps}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "activity":
      return (
        <svg {...iconProps}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "play":
      return (
        <svg {...iconProps}>
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      );
    case "zap":
      return (
        <svg {...iconProps}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    default:
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};

// Regulatory Medical Disclaimer
const MedicalDisclaimer = () => (
  <div className="bg-amber-950/70 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200/90 flex items-center justify-between">
    <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
      <Icon name="alert-triangle" className="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        <strong>RESEARCH &amp; SCREENING PROTOTYPE:</strong> Not an approved diagnostic device.
        Screening aid only. Always consult a pediatrician for confirmed laboratory bilirubin testing (TSB) or transcutaneous bilirubinometry (TcB).
      </span>
    </div>
  </div>
);

// Header Bar
const Header = ({ onOpenCardModal }) => (
  <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Icon name="eye" className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent">NeoScan</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">CV / ML v1.0</span>
          </div>
          <p className="text-xs text-slate-400">Lighting-Robust Neonatal Jaundice Screening</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCardModal}
          className="text-xs font-medium px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition shadow-sm"
        >
          <Icon name="qr-code" className="w-3.5 h-3.5 text-sky-400" />
          <span>Calibration Card Target</span>
        </button>
        <a
          href="/docs"
          target="_blank"
          className="text-xs font-medium px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition"
        >
          <Icon name="file-text" className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Swagger Docs</span>
        </a>
      </div>
    </div>
  </header>
);

// Printable Card Modal
const CalibrationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg">
          <Icon name="x" className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Icon name="target" className="w-5 h-5 text-sky-400" />
          Standard Optical Calibration Target (ArUco 4x4 ID:0)
        </h3>
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Print this reference target or display it on a second phone placed beside the infant's collarbone.
          NeoScan automatically unwarps the 6 color patches to solve the Ridge-regularized Color Correction Matrix (CCM).
        </p>

        <div className="bg-white rounded-xl p-3 flex justify-center border border-slate-200 mb-4 overflow-hidden shadow-inner">
          <img src="/static/docs/CALIBRATION_CARD_PRINTABLE.svg" alt="Calibration Card" className="max-h-64 object-contain" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">6 calibrated patches: White, 18% Gray, Yellow, Skin Light, Skin Med, Cyan</span>
          <div className="flex gap-2">
            <a
              href="/static/docs/CALIBRATION_CARD_PRINTABLE.svg"
              download="NeoScan_Calibration_Target.svg"
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Icon name="download" className="w-3.5 h-3.5" />
              Download SVG
            </a>
            <a
              href="/static/docs/CALIBRATION_CARD_PRINTABLE.png"
              download="NeoScan_Calibration_Target.png"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <Icon name="image" className="w-3.5 h-3.5" />
              PNG
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [realtimeScanning, setRealtimeScanning] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);
  const [correctionMethod, setCorrectionMethod] = useState("auto");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedTab, setSelectedTab] = useState("overlay");
  const [demoSamples, setDemoSamples] = useState([]);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [liveFps, setLiveFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastTimeRef = useRef(Date.now());

  // Fetch demo samples on initial load
  useEffect(() => {
    fetch("/api/v1/demo-samples")
      .then(res => res.json())
      .then(data => {
        if (data.samples && data.samples.length > 0) {
          setDemoSamples(data.samples);
          setCapturedImage(data.samples[1].image_base64); // Load warm bulb case by default
          runAnalysis(data.samples[1].image_base64, "auto");
        }
      })
      .catch(err => console.error("Error loading demo samples:", err));
  }, []);

  // Real-time continuous processing loop from live camera
  useEffect(() => {
    let intervalId = null;

    if (cameraActive && realtimeScanning) {
      intervalId = setInterval(() => {
        captureAndAnalyzeLiveFrame();
      }, 650); // Sample every 650ms for smooth real-time updates without request queueing
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cameraActive, realtimeScanning, correctionMethod]);

  // Capture single frame from live video and dispatch to backend
  const captureAndAnalyzeLiveFrame = () => {
    if (isProcessingRef.current || !videoRef.current) return;
    const video = videoRef.current;

    // Verify video stream is actively playing and has dimensions
    if (video.readyState < 2 || video.videoWidth === 0 || video.paused) {
      return;
    }

    const canvas = canvasRef.current || document.createElement("canvas");
    // Scale down frame to 640px wide max for sub-100ms transport and inference
    const maxDimension = 640;
    const scale = Math.min(1.0, maxDimension / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const b64 = canvas.toDataURL("image/jpeg", 0.75);
    setCapturedImage(b64);

    isProcessingRef.current = true;
    const now = Date.now();

    fetch("/api/v1/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_base64: b64,
        correction_method: correctionMethod,
        include_visualizations: true
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnalysisResult(data);
          setFrameCount(c => c + 1);
          // Calculate effective live FPS
          const elapsed = (Date.now() - now) / 1000;
          if (elapsed > 0) {
            setLiveFps(Math.round(1.0 / (elapsed + 0.65) * 10) / 10);
          }
        }
      })
      .catch(err => console.error("Realtime frame error:", err))
      .finally(() => {
        isProcessingRef.current = false;
      });
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.log("Play error:", e));
        };
      }

      setCameraActive(true);
      setRealtimeScanning(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or device not found: " + (err.message || err.name));
      setCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setRealtimeScanning(false);
  };

  // Toggle Camera Facing
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 250);
  };

  // Single Frame Snapshot
  const captureSnapshot = () => {
    captureAndAnalyzeLiveFrame();
    // Temporarily pause continuous scanning so the user can inspect this exact frame
    setRealtimeScanning(false);
  };

  // File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target && event.target.result;
      if (b64) {
        stopCamera();
        setCapturedImage(b64);
        runAnalysis(b64, correctionMethod);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load Demo Case
  const loadDemoSample = (sample) => {
    stopCamera();
    setCapturedImage(sample.image_base64);
    runAnalysis(sample.image_base64, correctionMethod);
  };

  // Run Pipeline Request (Manual / Static)
  const runAnalysis = async (imgB64, method) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/v1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: imgB64,
          correction_method: method,
          include_visualizations: true
        })
      });
      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data);
      } else {
        alert("Pipeline notice: " + (data.detail || "Unable to process image"));
      }
    } catch (err) {
      console.error("Pipeline failure:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMethodChange = (newMethod) => {
    setCorrectionMethod(newMethod);
    if (!cameraActive && capturedImage) {
      runAnalysis(capturedImage, newMethod);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <MedicalDisclaimer />
      <Header onOpenCardModal={() => setIsCardModalOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Real-Time Camera Feed & Guidance (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Camera Viewport Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cameraActive && realtimeScanning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {cameraActive ? (realtimeScanning ? "Real-Time Camera Stream" : "Live Camera (Paused)") : "Camera & Guidance"}
                </span>
                {cameraActive && realtimeScanning && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    LIVE {liveFps > 0 ? `${liveFps} Hz` : "SCANNING"}
                  </span>
                )}
              </div>
              
              {cameraActive && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRealtimeScanning(!realtimeScanning)}
                    className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition flex items-center gap-1 ${
                      realtimeScanning
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    }`}
                    title="Toggle continuous frame scanning"
                  >
                    <Icon name="zap" className="w-3 h-3" />
                    <span>{realtimeScanning ? "Continuous: ON" : "Continuous: PAUSED"}</span>
                  </button>
                  <button
                    onClick={toggleCameraFacing}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold bg-sky-950/60 p-1.5 rounded-lg border border-sky-800/40"
                    title="Flip Camera (Front/Back)"
                  >
                    <Icon name="flip-horizontal" className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Viewport Area */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              
              {/* Always mounted video element (prevents null ref race condition) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
              />

              {/* Real-Time Live HUD Overlay on Video */}
              {cameraActive && (
                <>
                  {/* Framing Guide Oval */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-52 h-64 border-2 border-dashed border-sky-400/80 rounded-[50%] flex items-center justify-center shadow-lg">
                      <div className="w-10 h-0.5 bg-sky-400/50"></div>
                    </div>
                    {/* ArUco Card Guide */}
                    <div className="absolute bottom-4 left-4 w-28 h-20 border border-amber-400/70 rounded-lg bg-amber-500/15 backdrop-blur-sm flex flex-col items-center justify-center text-[10px] text-amber-300 text-center px-1 shadow">
                      <Icon name="scan" className="w-3.5 h-3.5 mb-1 text-amber-400" />
                      <span>Place Card Here (Optional)</span>
                    </div>
                  </div>

                  {/* Top Live Guidance Badge */}
                  <div className="absolute top-3 inset-x-3 pointer-events-none flex justify-center">
                    <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-200 text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                      <Icon name="info" className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>Hold 25-30 cm away. Keep face centered. Frame #{frameCount}</span>
                    </div>
                  </div>

                  {/* Real-time mini HUD stats on video */}
                  {analysisResult && (
                    <div className="absolute top-12 left-3 pointer-events-none flex flex-col gap-1.5">
                      <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-md text-[10px] text-amber-300 font-mono shadow flex items-center gap-1.5">
                        <Icon name="sun" className="w-3 h-3 text-amber-400" />
                        <span>CCT: {analysisResult.lighting_condition.cct_kelvin}K</span>
                      </div>
                      <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-md text-[10px] text-sky-300 font-mono shadow flex items-center gap-1.5">
                        <Icon name="activity" className="w-3 h-3 text-sky-400" />
                        <span>Fused b*: {analysisResult.fused_biomarkers.fused_lab_b_star}</span>
                      </div>
                      <div
                        className="backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold font-mono shadow border uppercase"
                        style={{
                          backgroundColor: `${analysisResult.risk_assessment.color}25`,
                          borderColor: `${analysisResult.risk_assessment.color}60`,
                          color: analysisResult.risk_assessment.color
                        }}
                      >
                        {analysisResult.risk_assessment.risk_category.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Fallback Display when Camera is Off */}
              {!cameraActive && (
                capturedImage ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                    <img src={capturedImage} alt="Active Newborn Portrait" className="w-full h-full object-contain" />
                    <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-700 px-2.5 py-1 rounded-md text-[11px] text-slate-300 shadow">
                      Static Input Frame
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                      <Icon name="camera" className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300 mb-1">Camera Feed Inactive</p>
                    <p className="text-xs text-slate-500 max-w-xs mb-4">
                      Activate live camera stream to start real-time optical screening.
                    </p>
                  </div>
                )
              )}

              {/* Hidden Canvas for Frame Transport */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Actions Bar */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2">
              {cameraActive ? (
                <>
                  <button
                    onClick={captureSnapshot}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition"
                  >
                    <Icon name="aperture" className="w-4 h-4" />
                    <span>Freeze Snapshot</span>
                  </button>
                  <button
                    onClick={() => setRealtimeScanning(!realtimeScanning)}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition ${
                      realtimeScanning
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    }`}
                  >
                    <Icon name="zap" className="w-3.5 h-3.5" />
                    <span>{realtimeScanning ? "Pause Stream" : "Resume Stream"}</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Turn Off Camera"
                  >
                    <Icon name="camera-off" className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startCamera}
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <Icon name="video" className="w-4 h-4" />
                    <span>Start Real-Time Camera</span>
                  </button>
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition">
                    <Icon name="upload" className="w-4 h-4 text-sky-400" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </>
              )}
            </div>

            {cameraError && (
              <div className="px-4 py-2 bg-red-950/40 border-t border-red-800/40 text-xs text-red-300 flex items-center gap-2">
                <Icon name="alert-triangle" className="w-4 h-4 text-red-400 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Color Constancy Strategy Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Icon name="sun-medium" className="w-4 h-4 text-amber-400" />
                Color Constancy Strategy
              </span>
              <span className="text-[10px] text-sky-400 font-mono bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">Live Adaptation</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: "auto", label: "Auto (Smart Hierarchy)", desc: "Card -> Sclera -> Shades-of-Gray" },
                { id: "card_ccm", label: "ArUco Card CCM", desc: "Ridge regularized ground truth" },
                { id: "sclera_wb", label: "Sclera In-Scene WB", desc: "Internal eye-white reference" },
                { id: "shades_of_gray", label: "Shades-of-Gray (p=6)", desc: "Minkowski p-norm constancy" },
                { id: "gray_world", label: "Gray-World Retinex", desc: "Achromatic scene average" },
                { id: "none", label: "Raw (No Correction)", desc: "Demonstrates lighting confound" },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => handleMethodChange(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    correctionMethod === m.id
                      ? 'bg-sky-500/15 border-sky-500/70 text-sky-100 shadow-sm shadow-sky-500/20'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs mb-0.5 text-white">{m.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preloaded Demo Evaluation Cases */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Icon name="layers" className="w-4 h-4 text-indigo-400" />
                Demo Evaluation Cases
              </span>
              <span className="text-[10px] text-slate-400">1-Click Test Suite</span>
            </div>
            <div className="space-y-2">
              {demoSamples.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => loadDemoSample(sample)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img src={sample.image_base64} alt={sample.title} className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0" />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition truncate">
                        {sample.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {sample.lighting}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                    sample.expected_risk === 'HIGH_RISK'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : sample.expected_risk === 'MODERATE_RISK'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {sample.expected_risk.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Real-Time Results & Clinical Dashboard (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {isAnalyzing && !analysisResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[420px] shadow-xl">
              <div className="w-14 h-14 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mb-4"></div>
              <h4 className="text-base font-bold text-white mb-1">Initializing Real-Time Pipeline...</h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Executing Quality Gating &bull; Lighting Detection &bull; Color Constancy &bull; Landmark ROI Isolation &bull; Calibrated Risk Assessment
              </p>
            </div>
          ) : analysisResult ? (
            <>
              {/* Detected Lighting Context Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Icon name="sun" className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                      <span>Ambient Lighting Context</span>
                      {cameraActive && realtimeScanning && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{analysisResult.lighting_condition.label}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                        CCT: {analysisResult.lighting_condition.cct_kelvin}K
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Strategy</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono capitalize">
                    {analysisResult.active_correction_method.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Primary Clinical Risk Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-500"
                  style={{ backgroundColor: analysisResult.risk_assessment.color }}
                ></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-extrabold px-3 py-0.5 rounded-full border uppercase tracking-wider transition-colors duration-300"
                        style={{
                          backgroundColor: `${analysisResult.risk_assessment.color}15`,
                          borderColor: `${analysisResult.risk_assessment.color}40`,
                          color: analysisResult.risk_assessment.color
                        }}
                      >
                        {analysisResult.risk_assessment.badge}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Equiv. TSB: {analysisResult.risk_assessment.equivalent_tsb_range}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-white">
                      {analysisResult.risk_assessment.title}
                    </h2>
                  </div>

                  {/* Confidence Gauge */}
                  <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between">
                    <span className="text-xs text-slate-400">Calibrated Confidence</span>
                    <div className="text-3xl font-black text-white font-mono">
                      {analysisResult.risk_assessment.confidence_percent}%
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden mb-4 border border-slate-700/50">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${analysisResult.risk_assessment.confidence_percent}%`,
                      backgroundColor: analysisResult.risk_assessment.color
                    }}
                  ></div>
                </div>

                {/* Clinical Advisory Box */}
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
                  <Icon name="stethoscope" className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Recommended Clinical Pathway:</strong> {analysisResult.risk_assessment.recommendation}
                  </div>
                </div>
              </div>

              {/* Visual Inspection Views & Heatmap Tabs */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Icon name="scan-face" className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Biometric Verification Views</span>
                  </div>
                  
                  <div className="flex gap-1 bg-slate-800/80 p-1 rounded-xl text-xs overflow-x-auto">
                    {[
                      { id: "overlay", label: "Diagnostic ROIs" },
                      { id: "heatmap", label: "Yellowness Heatmap" },
                      { id: "corrected", label: "Corrected Image" },
                      { id: "raw", label: "Current Input" },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTab(t.id)}
                        className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition ${
                          selectedTab === t.id
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Viewport */}
                <div className="aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-inner">
                  {selectedTab === "overlay" && analysisResult.visualizations && analysisResult.visualizations.diagnostic_overlay_base64 && (
                    <img src={analysisResult.visualizations.diagnostic_overlay_base64} alt="Diagnostic Overlay" className="w-full h-full object-contain" />
                  )}
                  {selectedTab === "heatmap" && analysisResult.visualizations && analysisResult.visualizations.yellowness_heatmap_base64 && (
                    <img src={analysisResult.visualizations.yellowness_heatmap_base64} alt="Bilirubin Heatmap" className="w-full h-full object-contain" />
                  )}
                  {selectedTab === "corrected" && analysisResult.visualizations && analysisResult.visualizations.corrected_image_base64 && (
                    <img src={analysisResult.visualizations.corrected_image_base64} alt="Corrected Image" className="w-full h-full object-contain" />
                  )}
                  {selectedTab === "raw" && capturedImage && (
                    <img src={capturedImage} alt="Raw Frame" className="w-full h-full object-contain" />
                  )}

                  {/* Overlay Legend */}
                  {selectedTab === "overlay" && (
                    <div className="absolute bottom-2.5 inset-x-2.5 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-center gap-4 text-[10px] shadow-lg">
                      <span className="flex items-center gap-1.5 text-cyan-300 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Forehead (w=0.40)</span>
                      <span className="flex items-center gap-1.5 text-emerald-300 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Nose Tip (w=0.25)</span>
                      <span className="flex items-center gap-1.5 text-fuchsia-300 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400"></span> Sclera (w=0.15)</span>
                      <span className="flex items-center gap-1.5 text-amber-300 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Sternum/Chest (w=0.20)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optical Biomarkers & ROI Metrics Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <Icon name="bar-chart-2" className="w-4 h-4 text-emerald-400" />
                  Multi-ROI Dermal Biomarker Summary (Live)
                </h3>

                {/* Fused Biomarkers Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Fused CIE b* (Yellow)</div>
                    <div className="text-xl font-black text-amber-300 font-mono">
                      {analysisResult.fused_biomarkers.fused_lab_b_star}
                    </div>
                    <div className="text-[10px] text-slate-500">Ref: &gt;24.0 elevated</div>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Bilirubin Index (BIx)</div>
                    <div className="text-xl font-black text-sky-400 font-mono">
                      {analysisResult.fused_biomarkers.fused_bilirubin_index}
                    </div>
                    <div className="text-[10px] text-slate-500">(R - B) / (R + B)</div>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Cr / Cb Ratio</div>
                    <div className="text-xl font-black text-indigo-300 font-mono">
                      {analysisResult.fused_biomarkers.fused_cr_cb_ratio}
                    </div>
                    <div className="text-[10px] text-slate-500">Blue suppression metric</div>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Quality Factor</div>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      {analysisResult.fused_biomarkers.total_confidence_weight}
                    </div>
                    <div className="text-[10px] text-slate-500">Sharpness &amp; purity</div>
                  </div>
                </div>

                {/* Per-ROI Breakdown */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-bold">
                        <th className="py-2 px-2 font-bold">Anatomical ROI</th>
                        <th className="py-2 px-2 font-bold">Raw b*</th>
                        <th className="py-2 px-2 font-bold">Corrected b*</th>
                        <th className="py-2 px-2 font-bold">BIx</th>
                        <th className="py-2 px-2 font-bold">Quality (Q_r)</th>
                        <th className="py-2 px-2 font-bold">Eff. Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {Object.entries(analysisResult.roi_breakdown).map(([roiName, r]) => (
                        <tr key={roiName} className="hover:bg-slate-800/30">
                          <td className="py-2 px-2 font-sans font-bold capitalize text-slate-200">
                            {roiName}
                          </td>
                          <td className="py-2 px-2 text-slate-400">{r.raw_b_star}</td>
                          <td className="py-2 px-2 font-bold text-amber-300">{r.corrected_b_star}</td>
                          <td className="py-2 px-2 text-sky-400">{r.corrected_bix}</td>
                          <td className="py-2 px-2 text-slate-300">{r.quality_score}</td>
                          <td className="py-2 px-2 text-emerald-400 font-bold">{r.effective_weight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          ) : null}

        </div>

      </main>

      <CalibrationModal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} />

      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>NeoScan Optical Pipeline &bull; National Hackathon Prototype</div>
          <div className="flex gap-4">
            <a href="/static/docs/BENCHMARK_REPORT.md" target="_blank" className="hover:text-slate-300 transition">Benchmark Report</a>
            <a href="/static/docs/ARCHITECTURE.md" target="_blank" className="hover:text-slate-300 transition">Architecture Design</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Render into DOM
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App, null));
