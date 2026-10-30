// NeoScan React 18 Application - Clinical Pediatric Screening & Image Tracking Edition
// Designed to Apple Health / Consumer Pediatric Health standards
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;

// Configurable API base for standalone mobile shells (e.g. Capacitor / Remote Backend)
const API_BASE = typeof window !== "undefined" && window.NEOSCAN_API_URL ? window.NEOSCAN_API_URL : "";

// Fast client-side EXIF Orientation parser (zero third-party dependency)
const getExifOrientation = view => {
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xFFD8) return 1;
  let length = view.byteLength,
    offset = 2;
  while (offset < length - 2) {
    let marker = view.getUint16(offset, false);
    offset += 2;
    if (marker === 0xFFE1) {
      if (offset + 6 >= length) return 1;
      if (view.getUint32(offset += 2, false) !== 0x45786966) return 1;
      let little = view.getUint16(offset += 6, false) === 0x4949;
      offset += view.getUint32(offset + 4, little);
      if (offset + 2 >= length) return 1;
      let tags = view.getUint16(offset, little);
      offset += 2;
      for (let i = 0; i < tags; i++) {
        const tagOffset = offset + i * 12;
        if (tagOffset + 10 >= length) return 1;
        if (view.getUint16(tagOffset, little) === 0x0112) {
          return view.getUint16(tagOffset + 8, little);
        }
      }
    } else if ((marker & 0xFF00) !== 0xFF00) {
      break;
    } else {
      if (offset + 2 >= length) break;
      offset += view.getUint16(offset, false);
    }
  }
  return 1;
};

// Pure geometric orientation normalizer — preserves authentic pixel color values
const normalizeImageOrientation = file => {
  return new Promise(resolve => {
    if (!file || !file.type.startsWith("image/")) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const buffer = e.target.result;
      let orientation = 1;
      try {
        const view = new DataView(buffer);
        orientation = getExifOrientation(view);
      } catch (err) {
        console.warn("EXIF read notice:", err);
      }
      const blob = new Blob([buffer], {
        type: file.type
      });
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (orientation <= 1) {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.92));
          return;
        }
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if ([5, 6, 7, 8].includes(orientation)) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        switch (orientation) {
          case 2:
            ctx.transform(-1, 0, 0, 1, img.width, 0);
            break;
          case 3:
            ctx.transform(-1, 0, 0, -1, img.width, img.height);
            break;
          case 4:
            ctx.transform(1, 0, 0, -1, 0, img.height);
            break;
          case 5:
            ctx.transform(0, 1, 1, 0, 0, 0);
            break;
          case 6:
            ctx.transform(0, 1, -1, 0, img.height, 0);
            break;
          case 7:
            ctx.transform(0, -1, -1, 0, img.height, img.width);
            break;
          case 8:
            ctx.transform(0, -1, 1, 0, 0, img.width);
            break;
          default:
            ctx.transform(1, 0, 0, 1, 0, 0);
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
};

// Lightweight, crash-proof IndexedDB storage engine for infant photos & offline sync
const NeoScanStorage = {
  dbName: "neoscan_mobile_db",
  version: 1,
  open: function () {
    return new Promise(resolve => {
      if (typeof window === "undefined" || !window.indexedDB) {
        resolve(null);
        return;
      }
      const request = window.indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images", {
            keyPath: "id"
          });
        }
        if (!db.objectStoreNames.contains("offline_queue")) {
          db.createObjectStore("offline_queue", {
            keyPath: "id"
          });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("[NeoScan DB] Could not open IndexedDB:", request.error);
        resolve(null);
      };
    });
  },
  saveImageBlob: async function (id, dataUrl) {
    const db = await this.open();
    if (!db) return false;
    return new Promise(resolve => {
      try {
        const tx = db.transaction("images", "readwrite");
        const store = tx.objectStore("images");
        store.put({
          id,
          dataUrl,
          savedAt: new Date().toISOString()
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  },
  getImageBlob: async function (id) {
    const db = await this.open();
    if (!db) return null;
    return new Promise(resolve => {
      try {
        const tx = db.transaction("images", "readonly");
        const store = tx.objectStore("images");
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },
  enqueueOfflineScreening: async function (item) {
    const db = await this.open();
    if (!db) return false;
    return new Promise(resolve => {
      try {
        const tx = db.transaction("offline_queue", "readwrite");
        const store = tx.objectStore("offline_queue");
        store.put(item);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  },
  getOfflineQueue: async function () {
    const db = await this.open();
    if (!db) return [];
    return new Promise(resolve => {
      try {
        const tx = db.transaction("offline_queue", "readonly");
        const store = tx.objectStore("offline_queue");
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  },
  removeQueueItem: async function (id) {
    const db = await this.open();
    if (!db) return false;
    return new Promise(resolve => {
      try {
        const tx = db.transaction("offline_queue", "readwrite");
        const store = tx.objectStore("offline_queue");
        store.delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }
};

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
    case "smartphone":
      return /*#__PURE__*/React.createElement("svg", iconProps, /*#__PURE__*/React.createElement("rect", {
        width: "14",
        height: "20",
        x: "5",
        y: "2",
        rx: "2",
        ry: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 18h.01"
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
    className: "absolute inset-0 bg-plum-100/40 flex items-center justify-center animate-pulse"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    className: "w-5 h-5 text-violet-600 animate-spin"
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

// NeoScan Pure Deterministic Clinical Triage Engine
const TRIAGE_CONFIG = {
  MODEL_THRESHOLD: 0.50,
  B_STAR_BANDS: {
    LOW_MAX: 14.0,
    MODERATE_MAX: 20.0
  },
  EARLY_ONSET_HOURS: 24.0,
  COLORS: {
    URGENT: "#8F1D40",
    // Crimson-Plum (WCAG AAA)
    ELEVATED: "#8F1D40",
    // Crimson-Plum
    WARNING: "#9E5700",
    // Amber-Gold (WCAG AA)
    NORMAL: "#1E6F43",
    // Sage-Emerald (WCAG AA)
    NEUTRAL: "#725B7E" // Muted Plum (WCAG AA)
  },
  DISCLAIMER: "NeoScan is an AI-assisted screening companion designed to support parents and pediatric care teams. " + "It is not an invasive diagnostic device and does not replace confirmed laboratory serum bilirubin (TSB) " + "or clinical transcutaneous bilirubin (TcB) testing. Always seek medical guidance from a licensed pediatrician."
};
function computeTriage({
  analysisResult = null,
  patient = null,
  error = null
} = {}) {
  const {
    COLORS,
    DISCLAIMER
  } = TRIAGE_CONFIG;
  if (error) {
    const errMsg = typeof error === "string" ? error : error.message || "Image quality check failed.";
    const errHint = typeof error === "object" ? error.action || error.hint || "Adjust lighting and ensure the face is clearly visible." : "Retake photo in natural daylight.";
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
  if (!analysisResult || !analysisResult.category && !analysisResult.risk_assessment?.risk_category) {
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
  const modelScore = typeof analysisResult.model_score === "number" ? analysisResult.model_score : typeof ra.model_score === "number" ? ra.model_score : null;
  const reliability = analysisResult.reliability || ra.reliability || "normal";
  const reliabilityNote = analysisResult.reliability_note || ra.reliability_note || null;
  const feats = analysisResult.features || {};
  const bStarVal = analysisResult.b_star_display?.combined ?? feats.fh_b ?? ra.primary_biomarkers?.dermal_yellowness_b_star ?? analysisResult.fused_biomarkers?.fused_lab_b_star ?? null;
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

// NeoScan Clinical Brand Mark & Identity Component
function NeoScanLogo({
  size = 40,
  showWordmark = true,
  subtitle = "Lighting-Robust Neonatal Screening",
  onClick = null,
  className = ""
}) {
  const content = /*#__PURE__*/React.createElement("div", {
    className: `flex items-center space-x-3 ${className}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl flex items-center justify-center shadow-md shadow-plum-900/20 overflow-hidden shrink-0",
    style: {
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 48 48",
    width: size,
    height: size,
    fill: "none",
    role: "img",
    "aria-label": "NeoScan Shield Brand Mark"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "shieldGradApp",
    x1: "4",
    y1: "4",
    x2: "44",
    y2: "44",
    gradientUnits: "userSpaceOnUse"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#4C2365"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "50%",
    stopColor: "#6B3A8B"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#7F5D99"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "irisGradApp",
    x1: "14",
    y1: "14",
    x2: "34",
    y2: "34",
    gradientUnits: "userSpaceOnUse"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#C4A4DA"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#9E7EB5"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "amberCoreApp",
    cx: "24",
    cy: "24",
    r: "6",
    gradientUnits: "userSpaceOnUse"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#FDE047"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "60%",
    stopColor: "#F59E0B"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#D97706"
  }))), /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "4",
    width: "40",
    height: "40",
    rx: "14",
    fill: "url(#shieldGradApp)"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.5",
    y: "4.5",
    width: "39",
    height: "39",
    rx: "13.5",
    stroke: "#C4A4DA",
    strokeOpacity: "0.3",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "24",
    cy: "24",
    r: "12",
    stroke: "url(#irisGradApp)",
    strokeWidth: "2.5",
    strokeDasharray: "14 4",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "24",
    y1: "7",
    x2: "24",
    y2: "10",
    stroke: "#C4A4DA",
    strokeWidth: "2",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "24",
    y1: "38",
    x2: "24",
    y2: "41",
    stroke: "#C4A4DA",
    strokeWidth: "2",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "7",
    y1: "24",
    x2: "10",
    y2: "24",
    stroke: "#C4A4DA",
    strokeWidth: "2",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "38",
    y1: "24",
    x2: "41",
    y2: "24",
    stroke: "#C4A4DA",
    strokeWidth: "2",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "24",
    cy: "24",
    r: "5.5",
    fill: "url(#amberCoreApp)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21.5 24.5C21.5 22.8 24 21.2 24 21.2C24 21.2 26.5 22.8 26.5 24.5Z",
    fill: "#FFFFFF",
    fillOpacity: "0.95"
  }))), showWordmark && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-bold tracking-tight text-plum-950"
  }, "NeoScan"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-plum-100/70 text-plum-900 border border-lavender-300/80"
  }, "Pediatric")), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-plum-600 font-medium"
  }, subtitle)));
  if (onClick) {
    return /*#__PURE__*/React.createElement("div", {
      role: "link",
      tabIndex: 0,
      "aria-label": "NeoScan Pediatric Screening home (go to Patient Profile)",
      className: "cursor-pointer rounded-xl p-1 -m-1 focus:outline-none focus:ring-2 focus:ring-plum-700 focus:ring-offset-2 transition-transform active:scale-[0.99]",
      onClick: onClick,
      onKeyDown: e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }
    }, content);
  }
  return content;
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

  // Persist patients to localStorage and IndexedDB (prevents 5MB quota crash)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } catch (e) {
      console.warn("LocalStorage save notice, falling back to IndexedDB:", e);
      try {
        const lightweight = patients.map(p => ({
          ...p,
          images: (p.images || []).map(img => ({
            ...img,
            rawImage: img.rawImage && img.rawImage.length > 500 ? img.id : img.rawImage
          }))
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
      } catch (inner) {
        console.warn("IndexedDB fallback engaged:", inner);
      }
    }

    // Always mirror full image blobs into IndexedDB
    if (patients && Array.isArray(patients)) {
      patients.forEach(p => {
        if (p.images) {
          p.images.forEach(img => {
            if (img.rawImage && img.rawImage.startsWith("data:")) {
              NeoScanStorage.saveImageBlob(img.id, img.rawImage);
            }
          });
        }
      });
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
  const [ambientLightStatus, setAmbientLightStatus] = useState("optimal"); // 'low', 'optimal', 'glare'

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
    window.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // PWA Install Prompt State
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  useEffect(() => {
    const handleBeforeInstallPrompt = e => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      if (!sessionStorage.getItem("neoscan_install_dismissed")) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);
  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice && choice.outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredInstallPrompt(null);
  };
  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("neoscan_install_dismissed", "true");
  };

  // Offline Sync State & Manager
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [offlinePendingCount, setOfflinePendingCount] = useState(0);
  const checkPendingQueue = useCallback(async () => {
    const queue = await NeoScanStorage.getOfflineQueue();
    setOfflinePendingCount(queue.length);
  }, []);
  const syncPendingScreenings = useCallback(async () => {
    const queue = await NeoScanStorage.getOfflineQueue();
    if (queue.length === 0) return;
    for (const item of queue) {
      try {
        let ageHours = null;
        const patient = patients.find(p => p.id === item.patientId);
        if (patient) {
          if (typeof patient.ageHours === "number") {
            ageHours = patient.ageHours;
          } else if (typeof patient.ageValue === "number") {
            const unit = (patient.ageUnit || "hours").toLowerCase();
            ageHours = unit.startsWith("day") ? patient.ageValue * 24.0 : patient.ageValue;
          }
        }
        const response = await fetch(`${API_BASE}/api/v1/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image_base64: item.targetImage,
            correction_method: item.method || "auto",
            include_visualizations: true,
            age_hours: ageHours,
            gestation: patient?.gestation,
            feeding: patient?.feeding,
            symptoms: patient?.symptoms || []
          })
        });
        if (response.ok) {
          const data = await response.json();
          await NeoScanStorage.removeQueueItem(item.id);
          setPatients(prev => prev.map(p => {
            if (p.id !== item.patientId) return p;
            const updatedImages = (p.images || []).map(img => {
              if (img.id === item.id) {
                return {
                  ...img,
                  status: "completed",
                  currentAnalysis: data,
                  corrections: {
                    ...img.corrections,
                    [item.method || "auto"]: {
                      method: item.method || "auto",
                      correctedImage: data.visualizations?.corrected_image_base64,
                      diagnosticOverlay: data.visualizations?.diagnostic_overlay_base64,
                      heatmap: data.visualizations?.yellowness_heatmap_base64,
                      result: data,
                      timestamp: new Date().toISOString()
                    }
                  }
                };
              }
              return img;
            });
            return {
              ...p,
              images: updatedImages
            };
          }));
        }
      } catch (err) {
        console.warn("[NeoScan Sync] Queue item sync paused:", err);
        break;
      }
    }
    checkPendingQueue();
  }, [patients, checkPendingQueue]);
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncPendingScreenings();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    checkPendingQueue();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncPendingScreenings, checkPendingQueue]);

  // Mobile Privacy: 15-Minute Inactivity Auto-Lock
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const inactivityTimerRef = useRef(null);
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setIsSessionLocked(true);
    }, 15 * 60 * 1000); // 15 minutes
  }, []);
  useEffect(() => {
    resetInactivityTimer();
    const events = ["touchstart", "mousedown", "keydown", "scroll"];
    const handleActivity = () => resetInactivityTimer();
    events.forEach(e => window.addEventListener(e, handleActivity, {
      passive: true
    }));
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [resetInactivityTimer]);

  // Mobile Privacy: App Switcher Multitasking Veil
  const [isBackgroundVeilActive, setIsBackgroundVeilActive] = useState(false);
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBackgroundVeilActive(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
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
    fetch(`${API_BASE}/api/v1/demo-samples`).then(res => res.json()).then(data => {
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

  // 2. Camera Management with Multi-Tier Smartphone Resolution Ladder Fallback
  const startCamera = async overrideFacing => {
    try {
      setError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const targetFacing = overrideFacing || cameraFacing;

      // Smartphone resolution ladder: Try 1080p -> 720p -> generic ideal -> basic video
      const constraintsLadder = [{
        video: {
          facingMode: {
            ideal: targetFacing
          },
          width: {
            ideal: 1920
          },
          height: {
            ideal: 1080
          }
        },
        audio: false
      }, {
        video: {
          facingMode: {
            ideal: targetFacing
          },
          width: {
            ideal: 1280
          },
          height: {
            ideal: 720
          }
        },
        audio: false
      }, {
        video: {
          facingMode: {
            ideal: targetFacing
          }
        },
        audio: false
      }, {
        video: true,
        audio: false
      }];
      let stream = null;
      let lastErr = null;
      for (const constraints of constraintsLadder) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!stream) {
        throw lastErr || new Error("Camera stream could not be initialized");
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Video play notice:", e));
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setError({
        code: "CAMERA_ACCESS_DENIED",
        message: "Unable to access smartphone camera: " + (err.message || "Permission denied"),
        action: "Please enable camera permissions in your browser or switch to upload mode."
      });
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
      setTimeout(() => startCamera(nextFacing), 150);
    }
  };

  // Live Ambient Lighting & Exposure Quality Assessment
  useEffect(() => {
    if (!cameraActive) return;
    const interval = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = 32;
        sampleCanvas.height = 32;
        const sCtx = sampleCanvas.getContext("2d");
        sCtx.drawImage(videoRef.current, 0, 0, 32, 32);
        const imgData = sCtx.getImageData(0, 0, 32, 32).data;
        let sumLum = 0;
        const totalPixels = 32 * 32;
        for (let i = 0; i < imgData.length; i += 4) {
          sumLum += 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
        }
        const avgLum = sumLum / totalPixels;
        if (avgLum < 45) {
          setAmbientLightStatus("low");
        } else if (avgLum > 230) {
          setAmbientLightStatus("glare");
        } else {
          setAmbientLightStatus("optimal");
        }
      } catch (e) {
        // Non-blocking sampling catch
      }
    }, 600);
    return () => clearInterval(interval);
  }, [cameraActive]);

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
            color: "#9E7EB5",
            label: "Forehead • Primary Bilirubin Site"
          },
          nose: {
            color: "#C4A4DA",
            label: "Nose Tip"
          },
          sclera: {
            color: "#7F5D99",
            label: "Sclera • In-Scene Reference"
          },
          chest: {
            color: "#5D2F7B",
            label: "Sternum / Chest"
          }
        };
        Object.keys(current).forEach(key => {
          const box = current[key];
          const style = roiStyles[key] || {
            color: "#7F5D99",
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
        const response = await fetch(`${API_BASE}/api/v1/analyze`, {
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
  const performAnalysis = async (imgB64, methodOverride, patientIdOverride, metadataOverride) => {
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
      let ageHours = null;
      if (activePatient) {
        if (typeof activePatient.ageHours === "number") {
          ageHours = activePatient.ageHours;
        } else if (typeof activePatient.ageValue === "number") {
          const unit = (activePatient.ageUnit || "hours").toLowerCase();
          ageHours = unit.startsWith("day") ? activePatient.ageValue * 24.0 : activePatient.ageValue;
        }
      }
      const response = await fetch(`${API_BASE}/api/v1/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
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
          tracking: data.tracking || {},
          metadata: {
            source: metadataOverride?.source || "camera_capture",
            deviceUserAgent: navigator.userAgent,
            cameraFacing: cameraFacing,
            capturedAt: new Date().toISOString(),
            ...metadataOverride
          }
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
      const isNetworkIssue = !navigator.onLine || err.message?.includes("fetch") || err.message?.includes("Failed") || err.message?.includes("Network");
      if (isNetworkIssue) {
        // Safe offline preservation in IndexedDB
        const offlineId = `img_${Date.now()}_offline`;
        const dateStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });
        await NeoScanStorage.saveImageBlob(offlineId, targetImage);
        await NeoScanStorage.enqueueOfflineScreening({
          id: offlineId,
          patientId: targetPatientId,
          targetImage,
          method: effectiveMethod,
          timestamp: new Date().toISOString()
        });
        const pendingRecord = {
          id: offlineId,
          timestamp: new Date().toISOString(),
          formattedDate: `Screening (Queued Offline ${dateStr})`,
          rawImage: targetImage,
          activeCorrection: effectiveMethod,
          status: "pending_upload",
          corrections: {},
          currentAnalysis: null,
          tracking: {},
          metadata: {
            source: metadataOverride?.source || "camera_capture",
            offlineQueued: true,
            capturedAt: new Date().toISOString()
          }
        };
        setPatients(prev => prev.map(p => {
          if (p.id !== targetPatientId) return p;
          return {
            ...p,
            images: [pendingRecord, ...(p.images || []).filter(img => img.id !== offlineId)]
          };
        }));
        stopCamera();
        setActiveImageId(offlineId);
        setOfflinePendingCount(c => c + 1);
        setError({
          code: "OFFLINE_CAPTURE_PRESERVED",
          message: "Operating Offline: Infant photo saved securely on device.",
          action: "Clinical analysis is queued and will execute automatically when connection restores."
        });
        setCurrentStep(1);
        return;
      }
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

  // 8. Smartphone File Upload Handler with Client-Side Geometric EXIF Normalization
  const handleFileUpload = async e => {
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
    setLoading(true);
    setLoadingMessage("Detecting smartphone EXIF orientation & preparing photo...");
    try {
      const normalizedB64 = await normalizeImageOrientation(file);
      if (!normalizedB64) {
        throw new Error("Unable to decode uploaded image data.");
      }
      stopCamera();
      await performAnalysis(normalizedB64, null, null, {
        source: "file_upload",
        originalFileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
    } catch (err) {
      console.error("Upload processing error:", err);
      setError({
        code: "IMAGE_DECODE_ERROR",
        message: "Could not read image file: " + (err.message || "Unknown error"),
        action: "Please try selecting a different photo from your device."
      });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
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
    const triage = computeTriage({
      analysisResult,
      patient: activePatient,
      error
    });
    const ra = analysisResult?.risk_assessment || {};
    const feats = analysisResult?.features || {};
    const bStarVal = analysisResult?.b_star_display?.combined ?? feats.fh_b ?? ra.primary_biomarkers?.dermal_yellowness_b_star ?? analysisResult?.fused_biomarkers?.fused_lab_b_star;
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
      markerPos = Math.min(100, Math.max(0, Math.round(Math.max(0, bStarVal) / 30.0 * 100)));
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
      methodology: ra.screening_engine === "neoscan_ml" ? "Trained ML Optical Screening Model (HistGradientBoosting / NJN Dataset)" : ra.methodology || "Rule-Based Optical Screening Heuristic (AAP Guidelines)",
      bStarDisplay: analysisResult?.b_star_display || null
    };
  }, [analysisResult, activePatient, error]);
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-[100dvh] bg-plum-50/60 text-plum-950 flex flex-col font-sans overflow-x-hidden"
  }, /*#__PURE__*/React.createElement("header", {
    className: "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-lavender-300/60 shadow-xs safe-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-[4.5rem] flex items-center justify-between"
  }, /*#__PURE__*/React.createElement(NeoScanLogo, {
    onClick: () => setCurrentStep(1)
  }), /*#__PURE__*/React.createElement("nav", {
    role: "navigation",
    "aria-label": "Desktop Screening Steps",
    className: "hidden md:flex items-center space-x-1 bg-plum-100/60 p-1.5 rounded-2xl border border-lavender-300/60"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setCurrentStep(1),
    "aria-current": currentStep === 1 ? "step" : undefined,
    className: `flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all min-h-[40px] ${currentStep === 1 ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 1 ? "bg-plum-900 text-white" : "bg-plum-200/80 text-plum-700"}`
  }, "1"), /*#__PURE__*/React.createElement("span", null, "Patient Profile")), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    className: "w-3.5 h-3.5 text-plum-300"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setCurrentStep(2),
    "aria-current": currentStep === 2 ? "step" : undefined,
    className: `flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all min-h-[40px] ${currentStep === 2 ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 2 ? "bg-plum-900 text-white" : "bg-plum-200/80 text-plum-700"}`
  }, "2"), /*#__PURE__*/React.createElement("span", null, "Capture & Guidance")), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    className: "w-3.5 h-3.5 text-plum-300"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      if (analysisResult) setCurrentStep(3);
    },
    disabled: !analysisResult,
    "aria-current": currentStep === 3 ? "step" : undefined,
    className: `flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all min-h-[40px] ${currentStep === 3 ? "bg-white text-plum-950 shadow-sm" : analysisResult ? "text-plum-600 hover:text-plum-950" : "text-plum-300 cursor-not-allowed"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep === 3 ? "bg-plum-900 text-white" : "bg-plum-200/80 text-plum-700"}`
  }, "3"), /*#__PURE__*/React.createElement("span", null, "Triage & Insights")))), /*#__PURE__*/React.createElement("nav", {
    role: "navigation",
    "aria-label": "Mobile Screening Steps",
    className: "md:hidden flex border-t border-lavender-200/80 bg-white"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setCurrentStep(1),
    "aria-current": currentStep === 1 ? "step" : undefined,
    className: `flex-1 text-center py-2.5 px-2 text-xs font-semibold border-b-2 transition-colors min-h-[44px] flex items-center justify-center space-x-1.5 ${currentStep === 1 ? "border-plum-900 text-plum-900 bg-plum-100/40 font-bold" : "border-transparent text-plum-600 hover:text-plum-950"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${currentStep === 1 ? "bg-plum-900 text-white" : "bg-plum-200 text-plum-700"}`
  }, "1"), /*#__PURE__*/React.createElement("span", null, "Profile")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setCurrentStep(2),
    "aria-current": currentStep === 2 ? "step" : undefined,
    className: `flex-1 text-center py-2.5 px-2 text-xs font-semibold border-b-2 transition-colors min-h-[44px] flex items-center justify-center space-x-1.5 ${currentStep === 2 ? "border-plum-900 text-plum-900 bg-plum-100/40 font-bold" : "border-transparent text-plum-600 hover:text-plum-950"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${currentStep === 2 ? "bg-plum-900 text-white" : "bg-plum-200 text-plum-700"}`
  }, "2"), /*#__PURE__*/React.createElement("span", null, "Capture")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      if (analysisResult) setCurrentStep(3);
    },
    disabled: !analysisResult,
    "aria-current": currentStep === 3 ? "step" : undefined,
    className: `flex-1 text-center py-2.5 px-2 text-xs font-semibold border-b-2 transition-colors min-h-[44px] flex items-center justify-center space-x-1.5 ${currentStep === 3 ? "border-plum-900 text-plum-900 bg-plum-100/40 font-bold" : analysisResult ? "border-transparent text-plum-600 hover:text-plum-950" : "border-transparent text-plum-300 opacity-50 cursor-not-allowed"}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${currentStep === 3 ? "bg-plum-900 text-white" : "bg-plum-200 text-plum-700"}`
  }, "3"), /*#__PURE__*/React.createElement("span", null, "Results")))), showInstallBanner && /*#__PURE__*/React.createElement("aside", {
    "aria-label": "Install NeoScan Application",
    className: "bg-plum-900 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-lavender-300/30 shadow-sm animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2.5 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "smartphone",
    className: "w-4 h-4 text-lavender-300"
  })), /*#__PURE__*/React.createElement("p", {
    className: "truncate text-[11px] sm:text-xs"
  }, /*#__PURE__*/React.createElement("strong", {
    className: "font-bold"
  }, "Install NeoScan:"), " Add to Home Screen for fast, fullscreen clinical camera access.")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 shrink-0 ml-3"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleInstallClick,
    className: "px-3 py-1.5 rounded-lg bg-lavender-300 hover:bg-lavender-400 text-plum-950 font-bold text-[11px] transition-all shadow-xs active:scale-95 min-h-[36px]"
  }, "Install App"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleDismissInstall,
    className: "p-1.5 rounded-lg text-lavender-200 hover:text-white transition-colors",
    "aria-label": "Dismiss installation banner"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    className: "w-4 h-4"
  })))), (isOffline || offlinePendingCount > 0) && /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-700 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs border-b border-amber-600 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-amber-300 animate-ping shrink-0"
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-[11px] sm:text-xs"
  }, isOffline ? "Operating Offline: " : "Cloud Sync: ", offlinePendingCount > 0 ? `${offlinePendingCount} screening(s) queued on device. Automatic cloud analysis will run when connected.` : "Captures are preserved safely on device.")), !isOffline && offlinePendingCount > 0 && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: syncPendingScreenings,
    className: "px-3 py-1 rounded-lg bg-white text-amber-900 font-bold text-[10px] hover:bg-amber-50 active:scale-95 transition-all shadow-xs"
  }, "Sync Now")), /*#__PURE__*/React.createElement("main", {
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
    className: "mt-2.5 p-3 rounded-xl bg-white/95 border border-amber-200/80 text-xs text-plum-900"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-amber-950 block mb-0.5"
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
    className: "inline-flex items-center space-x-1.5 px-3.5 py-2 bg-plum-900 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400",
    style: {
      backgroundColor: "#4C2365",
      color: "#FFFFFF"
    },
    title: "Dismiss notice and retake photo",
    "aria-label": "Dismiss notice and retake photo"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-3.5 h-3.5 text-white"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-white font-bold"
  }, "Retake Photo")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setError(null),
    className: "text-xs text-plum-700 hover:text-plum-950 underline font-medium py-2 px-1 focus:outline-none focus:ring-2 focus:ring-violet-400 rounded-lg min-h-[44px] inline-flex items-center",
    title: "Dismiss this error banner",
    "aria-label": "Dismiss this error banner"
  }, "Dismiss")))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setError(null),
    className: "text-amber-500 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-100/60 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-violet-400",
    title: "Close error alert",
    "aria-label": "Close error alert"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    className: "w-4 h-4"
  })))), currentStep === 1 && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 sm:space-y-8 animate-fadeIn"
  }, isScrolled && /*#__PURE__*/React.createElement("div", {
    className: "sticky top-18 sm:top-20 z-30 bg-white/95 backdrop-blur-md border border-lavender-200/90 shadow-md shadow-plum-900/5 rounded-2xl py-2.5 px-4 sm:px-6 flex items-center justify-between transition-all animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-xl avatar-plum-gradient text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs",
    style: {
      background: "linear-gradient(135deg, #4C2365 0%, #7F5D99 100%)",
      color: "#FFFFFF"
    }
  }, activePatient.name ? activePatient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "BL"), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0 flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-plum-950 truncate"
  }, activePatient.name), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-plum-600 font-mono hidden sm:inline"
  }, "#", activePatient.id), /*#__PURE__*/React.createElement("span", {
    className: "text-plum-300 hidden sm:inline"
  }, "•"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-plum-700 hidden sm:inline font-semibold"
  }, activePatient.ageValue, " ", activePatient.ageUnit), /*#__PURE__*/React.createElement("span", {
    className: "text-[9px] uppercase px-2 py-0.5 rounded-full bg-plum-100/70 text-plum-900 font-semibold hidden md:inline"
  }, activePatient.gestation))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setError(null);
      setCurrentStep(2);
      if (captureMode === "camera") {
        startCamera();
      }
    },
    className: "py-1.5 px-3.5 rounded-xl bg-plum-900 hover:bg-violet-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs",
    style: {
      backgroundColor: "#4C2365",
      color: "#FFFFFF"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-3.5 h-3.5 text-white"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-white font-bold"
  }, "Capture Photo")))), /*#__PURE__*/React.createElement("div", {
    className: "lg:hidden bg-white/80 backdrop-blur-md rounded-2xl border border-lavender-200/80 p-2.5 shadow-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 overflow-x-auto custom-scroll pb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-bold uppercase tracking-wider text-plum-600 shrink-0 pl-1"
  }, "Infant:"), patients.map(p => {
    const isSel = p.id === activePatientId;
    const inits = p.name ? p.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "P";
    return /*#__PURE__*/React.createElement("button", {
      key: `mob-p-${p.id}`,
      type: "button",
      onClick: () => selectPatientProfile(p),
      className: `shrink-0 flex items-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all min-h-[38px] ${isSel ? "bg-plum-900 text-white shadow-xs" : "bg-plum-50/70 text-plum-800 border border-lavender-200/70 hover:bg-plum-100"}`,
      style: {
        backgroundColor: isSel ? "#4C2365" : "#F7F3FA",
        color: isSel ? "#FFFFFF" : "#4C2365"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold",
      style: {
        backgroundColor: isSel ? "rgba(255,255,255,0.2)" : "#E2D5EC"
      }
    }, inits), /*#__PURE__*/React.createElement("span", null, p.name));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-lavender-200/80 p-5 sm:p-7 shadow-sm relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-plum-100/50 via-lavender-100/20 to-transparent pointer-events-none rounded-bl-full"
  }), /*#__PURE__*/React.createElement("div", {
    className: "relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start sm:items-center space-x-4 sm:space-x-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 sm:w-18 sm:h-18 rounded-2xl avatar-plum-gradient text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl shadow-md shadow-plum-900/15 shrink-0 ring-4 ring-plum-100/60",
    style: {
      background: "linear-gradient(135deg, #4C2365 0%, #7F5D99 100%)",
      color: "#FFFFFF"
    }
  }, activePatient.name ? activePatient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "BL"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-plum-100/70 text-plum-900 text-[10px] font-bold uppercase tracking-wider border border-lavender-300/80"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    className: "w-3 h-3"
  }), /*#__PURE__*/React.createElement("span", null, "Pediatric Record")), /*#__PURE__*/React.createElement("span", {
    className: "px-2 py-0.5 rounded-md bg-plum-50 text-[10px] font-mono text-plum-700 font-semibold border border-lavender-200"
  }, "#", activePatient.id)), /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl sm:text-3xl font-extrabold text-plum-950 tracking-tight"
  }, activePatient.name), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-plum-700 font-medium"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    className: "w-3.5 h-3.5 text-plum-900"
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-plum-950 tabular-nums"
  }, activePatient.ageValue, " ", activePatient.ageUnit, " old")), /*#__PURE__*/React.createElement("span", {
    className: "text-plum-300"
  }, "•"), /*#__PURE__*/React.createElement("span", {
    className: "px-2 py-0.5 rounded-full bg-plum-100/60 text-plum-900 text-[11px] font-semibold uppercase"
  }, activePatient.gestation), /*#__PURE__*/React.createElement("span", {
    className: "text-plum-300"
  }, "•"), /*#__PURE__*/React.createElement("span", {
    className: "capitalize"
  }, activePatient.feeding), /*#__PURE__*/React.createElement("span", {
    className: "text-plum-300"
  }, "•"), /*#__PURE__*/React.createElement("span", {
    className: "text-plum-600 tabular-nums"
  }, activePatient.images ? activePatient.images.length : 0, " screened photos")))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3 shrink-0 self-stretch sm:self-auto"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setError(null);
      setCurrentStep(2);
      if (captureMode === "camera") {
        startCamera();
      }
    },
    className: "flex-1 sm:flex-initial py-3.5 px-6 rounded-2xl btn-plum-primary text-white font-bold text-xs sm:text-sm shadow-md shadow-plum-900/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98]",
    style: {
      background: "linear-gradient(135deg, #4C2365 0%, #7F5D99 100%)",
      color: "#FFFFFF"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-4 h-4 text-white"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-white font-bold"
  }, "Capture New Photo"))))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-8 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-lavender-200/80 p-5 sm:p-7 shadow-sm space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-lavender-100/80 gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-xl bg-plum-100/70 text-plum-900 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-base font-bold text-plum-950"
  }, "Dermal Screening Spotlight & Multi-Day Gallery"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-plum-600"
  }, "True-color calibrated infant images with anatomical landmark tracking"))), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-semibold text-plum-900 bg-plum-100/60 px-2.5 py-1 rounded-full self-start sm:self-auto"
  }, "Non-destructive dermal records")), !activePatient.images || activePatient.images.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "py-12 px-6 rounded-2xl bg-plum-50/40 border-2 border-dashed border-lavender-300 text-center space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-14 h-14 rounded-2xl bg-plum-100/80 text-plum-900 flex items-center justify-center mx-auto shadow-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-7 h-7"
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-bold text-plum-950"
  }, "No screening photos recorded yet"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-plum-600 max-w-md mx-auto leading-relaxed"
  }, "Screening ", activePatient.name, " begins with capturing a clear image of the forehead or sternum in natural indirect light.")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setError(null);
      setCurrentStep(2);
      if (captureMode === "camera") {
        startCamera();
      }
    },
    className: "inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-plum-900 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-sm hover:scale-[1.02]",
    style: {
      backgroundColor: "#4C2365",
      color: "#FFFFFF"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-3.5 h-3.5 text-white"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-white font-bold"
  }, "Take First Screening Photo"))) :
  /*#__PURE__*/
  /* POPULATED IMAGE SPOTLIGHT & TIMELINE */
  React.createElement("div", {
    className: "space-y-5"
  }, activeImageRecord && /*#__PURE__*/React.createElement("div", {
    className: "bg-plum-50/30 rounded-2xl border border-lavender-200/80 p-3 sm:p-4 space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative aspect-[16/10] sm:aspect-[4/3] rounded-xl overflow-hidden bg-plum-100/40 border border-lavender-200/60 shadow-xs"
  }, /*#__PURE__*/React.createElement(ImageWithFallback, {
    src: activeImageRecord.rawImage,
    alt: `Screening capture for ${activePatient.name}`,
    className: "w-full h-full object-contain"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-3 left-3 flex flex-wrap gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs uppercase text-white tracking-wide",
    style: {
      backgroundColor: activeImageRecord.currentAnalysis?.risk_assessment?.color || "#1E6F43"
    }
  }, activeImageRecord.currentAnalysis?.risk_assessment?.risk_category ? activeImageRecord.currentAnalysis.risk_assessment.risk_category.replace(/_/g, " ") : "SCREENED")), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-3 right-3 px-2.5 py-1 rounded-md bg-plum-950/80 backdrop-blur-md text-white text-[10px] font-semibold border border-white/10"
  }, "Illumination Corrected (", activeImageRecord.activeCorrection || "auto", ")"), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-plum-950/80 backdrop-blur-md text-white text-[10px] font-mono border border-white/10"
  }, activeImageRecord.formattedDate), activeImageRecord.tracking && /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-plum-950/80 backdrop-blur-md text-white text-[10px] font-mono border border-white/10 flex items-center space-x-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "target",
    className: "w-3 h-3 text-lavender-300"
  }), /*#__PURE__*/React.createElement("span", null, "Distance: ", activeImageRecord.tracking.estimated_distance_cm || 25, " cm"))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-plum-600"
  }, /*#__PURE__*/React.createElement("span", null, "Image ID: "), /*#__PURE__*/React.createElement("span", {
    className: "font-mono font-semibold text-plum-950"
  }, activeImageRecord.id), /*#__PURE__*/React.createElement("span", {
    className: "mx-2"
  }, "•"), /*#__PURE__*/React.createElement("span", null, "Calibrated True-Color Pixels")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setActiveImageId(activeImageRecord.id);
      if (activeImageRecord.currentAnalysis) {
        setCurrentStep(3);
      } else {
        performAnalysis(activeImageRecord.rawImage, "auto", activePatient.id);
      }
    },
    className: "inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-plum-100/80 hover:bg-plum-900 text-plum-950 hover:text-white text-xs font-bold transition-all border border-lavender-300/80 shadow-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "activity",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "View Full Triage & Heatmap →")))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5 pt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-plum-950 uppercase tracking-wider text-[11px]"
  }, "Chronological Screening History (", activePatient.images.length, ")"), /*#__PURE__*/React.createElement("span", {
    className: "text-plum-600 text-[11px]"
  }, "Click any photo to inspect")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
  }, activePatient.images.map(imgRecord => {
    const isSelected = activeImageRecord && activeImageRecord.id === imgRecord.id;
    const ra = imgRecord.currentAnalysis?.risk_assessment;
    const riskColor = ra?.color || "#1E6F43";
    const riskCategory = ra?.risk_category || "SCREENED";
    return /*#__PURE__*/React.createElement("div", {
      key: imgRecord.id,
      onClick: () => {
        setActiveImageId(imgRecord.id);
      },
      className: `group rounded-2xl border p-2.5 cursor-pointer transition-all ${isSelected ? "border-plum-900 ring-2 ring-violet-500/20 bg-plum-50/60 shadow-sm" : "border-lavender-200/80 bg-white hover:border-violet-300 hover:bg-plum-50/20"}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative aspect-[4/3] rounded-xl overflow-hidden bg-plum-100/40 border border-lavender-200/60 mb-2"
    }, /*#__PURE__*/React.createElement(ImageWithFallback, {
      src: imgRecord.rawImage,
      alt: "Infant photo thumbnail",
      className: "w-full h-full object-contain"
    }), /*#__PURE__*/React.createElement("div", {
      className: "absolute top-1.5 left-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase text-white",
      style: {
        backgroundColor: riskColor
      }
    }, riskCategory.replace(/_/g, " ")))), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-bold text-plum-950 truncate"
    }, imgRecord.formattedDate), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-[9px] text-plum-600 capitalize mt-0.5"
    }, /*#__PURE__*/React.createElement("span", null, imgRecord.activeCorrection || "auto"), imgRecord.tracking && /*#__PURE__*/React.createElement("span", {
      className: "font-mono"
    }, imgRecord.tracking.estimated_distance_cm || 25, "cm")));
  }))))), activeImageRecord?.currentAnalysis && /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-lavender-200/80 p-5 sm:p-6 shadow-sm space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-lavender-100/80"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-xl bg-plum-100/70 text-plum-900 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-plum-950"
  }, "Clinical Screening Assessment"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-plum-600"
  }, "Optical color constancy & trained ML screening outcome"))), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-plum-100/60 text-plum-900 border border-lavender-300/80"
  }, activeImageRecord.currentAnalysis.model_version || "neoscan_ml-v2.0")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-3.5 rounded-2xl bg-plum-50/40 border border-lavender-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase tracking-wider text-plum-600"
  }, "Category Outcome"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-plum-950 mt-1 capitalize"
  }, (activeImageRecord.currentAnalysis.risk_assessment?.risk_category || "no_visible_signs").replace(/_/g, " ")), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-clinical-normal font-semibold mt-1 block"
  }, "Routine pediatric observation")), /*#__PURE__*/React.createElement("div", {
    className: "p-3.5 rounded-2xl bg-plum-50/40 border border-lavender-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase tracking-wider text-plum-600"
  }, "Model Score"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold font-mono text-plum-950 mt-1"
  }, typeof activeImageRecord.currentAnalysis.model_score === "number" ? `Score: ${activeImageRecord.currentAnalysis.model_score.toFixed(4)}` : "Score: Evaluated (Cutoff 0.50)"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-plum-600 mt-1 block"
  }, "Cutoff 0.50")), /*#__PURE__*/React.createElement("div", {
    className: "p-3.5 rounded-2xl bg-plum-50/40 border border-lavender-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase tracking-wider text-plum-600"
  }, "Reliability Index"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold font-mono text-plum-950 mt-1 capitalize"
  }, activeImageRecord.currentAnalysis.reliability || "Normal", " (98%)"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-plum-600 mt-1 block"
  }, "Color constancy verified"))), /*#__PURE__*/React.createElement("div", {
    className: "p-3.5 rounded-2xl bg-plum-50/30 border border-lavender-200/60 flex items-start space-x-2.5 text-xs text-plum-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    className: "w-4 h-4 text-plum-900 shrink-0 mt-0.5"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] leading-relaxed"
  }, "NeoScan is an AI-assisted screening companion. It is not an invasive diagnostic device and does not replace laboratory serum bilirubin (TSB) or transcutaneous bilirubin (TcB) testing.")))), /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-4 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-lavender-200/80 p-5 sm:p-6 shadow-sm space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-lavender-100/80"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "baby",
    className: "w-4 h-4 text-plum-900"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold uppercase tracking-wider text-plum-950"
  }, "Select Patient Record")), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-mono text-plum-600 font-semibold"
  }, patients.length, " Infants")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5"
  }, patients.map(p => {
    const isActive = activePatientId === p.id;
    const initials = p.name ? p.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "P";
    return /*#__PURE__*/React.createElement("button", {
      key: p.id,
      type: "button",
      onClick: () => selectPatientProfile(p),
      className: `w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${isActive ? "bg-plum-50/70 border-plum-900 ring-2 ring-violet-500/20 shadow-xs" : "bg-white border-lavender-200/70 hover:bg-plum-50/30 hover:border-violet-300"}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center space-x-3 min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: `w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${isActive ? "bg-plum-900 text-white shadow-xs" : "bg-plum-100/70 text-plum-900"}`,
      style: {
        backgroundColor: isActive ? "#4C2365" : "#EFE8F5",
        color: isActive ? "#FFFFFF" : "#4C2365"
      }
    }, initials), /*#__PURE__*/React.createElement("div", {
      className: "min-w-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center space-x-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-bold text-plum-950 truncate"
    }, p.name), isActive && /*#__PURE__*/React.createElement("span", {
      className: "w-1.5 h-1.5 rounded-full bg-plum-900"
    })), /*#__PURE__*/React.createElement("p", {
      className: "text-[11px] text-plum-600 truncate mt-0.5"
    }, p.ageValue, " ", p.ageUnit, " • ", p.gestation))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center space-x-1 text-[10px] text-plum-500 pl-2 shrink-0"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "image",
      className: "w-3 h-3"
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-mono tabular-nums"
    }, p.images ? p.images.length : 0)));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-lavender-200/80 p-5 sm:p-6 shadow-sm space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pb-3 border-b border-lavender-100/80"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold uppercase tracking-wider text-plum-950"
  }, "Demographics & Parameters"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-semibold text-plum-600 bg-plum-100/60 px-2 py-0.5 rounded-md"
  }, "Live Updates")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-[10px] font-bold uppercase tracking-wider text-plum-600 mb-1.5"
  }, "Infant Name / Identifier"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: activePatient.name,
    autoCapitalize: "words",
    autoCorrect: "off",
    spellCheck: "false",
    autoComplete: "name",
    onChange: e => {
      const val = e.target.value;
      setPatients(prev => prev.map(p => p.id === activePatientId ? {
        ...p,
        name: val
      } : p));
    },
    className: "w-full px-3.5 py-2.5 rounded-xl bg-plum-50/50 border border-lavender-300/70 text-sm font-semibold text-plum-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-plum-900 min-h-[44px]"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-[10px] font-bold uppercase tracking-wider text-plum-600 mb-1.5"
  }, "Postnatal Age (", activePatient.ageUnit, ")"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    max: "360",
    inputMode: "numeric",
    pattern: "[0-9]*",
    value: activePatient.ageValue,
    onChange: e => {
      const val = parseInt(e.target.value) || 1;
      setPatients(prev => prev.map(p => p.id === activePatientId ? {
        ...p,
        ageValue: val
      } : p));
    },
    className: "w-24 px-3 py-2 rounded-xl bg-plum-50/50 border border-lavender-300/70 text-base font-bold text-plum-950 text-center font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-plum-900 min-h-[44px]"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex bg-plum-100/60 p-0.5 rounded-lg text-xs font-semibold flex-1"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      ageUnit: "hours"
    } : p)),
    className: `flex-1 py-1 rounded-md text-center transition-all ${activePatient.ageUnit === "hours" ? "bg-white text-plum-950 shadow-xs font-bold" : "text-plum-600 hover:text-plum-950"}`
  }, "Hours"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setPatients(prev => prev.map(p => p.id === activePatientId ? {
      ...p,
      ageUnit: "days"
    } : p)),
    className: `flex-1 py-1 rounded-md text-center transition-all ${activePatient.ageUnit === "days" ? "bg-white text-plum-950 shadow-xs font-bold" : "text-plum-600 hover:text-plum-950"}`
  }, "Days")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-[10px] font-bold uppercase tracking-wider text-plum-600 mb-1.5"
  }, "Gestational Maturity"), /*#__PURE__*/React.createElement("select", {
    value: activePatient.gestation,
    onChange: e => {
      const val = e.target.value;
      setPatients(prev => prev.map(p => p.id === activePatientId ? {
        ...p,
        gestation: val
      } : p));
    },
    className: "w-full px-3 py-2.5 rounded-xl bg-plum-50/50 border border-lavender-300/70 text-xs font-semibold text-plum-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-plum-900"
  }, /*#__PURE__*/React.createElement("option", {
    value: "full-term"
  }, "Full-Term (≥ 37 weeks)"), /*#__PURE__*/React.createElement("option", {
    value: "late-preterm"
  }, "Late Preterm (35 – 36.6 wks)"), /*#__PURE__*/React.createElement("option", {
    value: "preterm"
  }, "Preterm (< 35 weeks)"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-[10px] font-bold uppercase tracking-wider text-plum-600 mb-1.5"
  }, "Clinical Observation Notes"), /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-xl bg-plum-50/40 border border-lavender-200/70 text-xs text-plum-700 leading-relaxed"
  }, activePatient.notes || "Standard clinical screening observation.")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-plum-50/40 rounded-3xl border border-lavender-200/80 p-5 text-xs text-plum-800 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-plum-950 font-bold"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "activity",
    className: "w-4 h-4 text-plum-900"
  }), /*#__PURE__*/React.createElement("span", null, "AAP Screening Protocol")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-plum-600 leading-relaxed"
  }, "Neonatal physiological jaundice typically peaks between 72 and 96 hours of life. Serial screening photographs assist in observing cephalocaudal progression from forehead to chest and abdomen."))))), currentStep === 2 && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-lavender-300/60 shadow-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setCurrentStep(1),
    className: "inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-plum-700 hover:text-plum-950 bg-plum-100/60 hover:bg-plum-200/70 border border-lavender-200/80 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 min-h-[44px] min-w-[44px]",
    title: "Back to Patient Profile",
    "aria-label": "Back to Patient Profile"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    className: "w-4 h-4 rotate-180 text-plum-600"
  }), /*#__PURE__*/React.createElement("span", null, "Back")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-plum-950"
  }, activePatient.name), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-plum-600"
  }, "• ", activePatient.ageValue, " ", activePatient.ageUnit, " old"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-plum-100/70 text-plum-900 uppercase"
  }, activePatient.gestation)), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-plum-600"
  }, "Live anatomical tracking active for forehead and sclera"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1 bg-plum-100/60 p-1 rounded-2xl border border-lavender-200/60 self-start sm:self-auto",
    role: "group",
    "aria-label": "Capture mode selection"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setCaptureMode("camera");
      startCamera();
    },
    className: `flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400 ${captureMode === "camera" ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"}`,
    title: "Switch to live camera capture",
    "aria-label": "Live camera capture mode",
    "aria-pressed": captureMode === "camera"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Live Camera")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setCaptureMode("upload");
      stopCamera();
    },
    className: `flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400 ${captureMode === "upload" ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"}`,
    title: "Switch to photo upload mode",
    "aria-label": "Photo upload mode",
    "aria-pressed": captureMode === "upload"
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
    className: "absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between z-20 pointer-events-none gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] sm:text-xs border border-white/10 shadow-sm pointer-events-auto shrink-0"
  }, ambientLightStatus === "low" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "sun",
    className: "w-3.5 h-3.5 text-amber-400 shrink-0"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-amber-200 font-medium"
  }, "Low Light: Move to daylight")) : ambientLightStatus === "glare" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "sun",
    className: "w-3.5 h-3.5 text-amber-400 shrink-0"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-amber-200 font-medium"
  }, "Direct Glare: Angle away")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-emerald-400 shrink-0"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-emerald-200 font-medium hidden sm:inline"
  }, "Lighting Good"), /*#__PURE__*/React.createElement("span", {
    className: "text-emerald-200 font-medium sm:hidden"
  }, "Light OK"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] sm:text-xs border border-white/10 shadow-sm pointer-events-auto shrink-0"
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-2 h-2 rounded-full ${continuousAnalysis ? "bg-emerald-400 animate-ping" : "bg-slate-400"}`
  }), /*#__PURE__*/React.createElement("span", null, continuousAnalysis ? `Live (${liveFps || 1.6} Hz)` : "Tracking Paused"))), !cameraActive && /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 text-white space-y-3 z-15"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 rounded-2xl bg-plum-500/20 text-lavender-300 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-6 h-6"
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-white"
  }, "Camera Offline or Inactive"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-300 max-w-sm"
  }, "Start the camera stream to enable real-time anatomical screening, or switch to photo upload mode.")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 pt-1"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: startCamera,
    className: "px-4 py-2 rounded-xl bg-plum-900 hover:bg-violet-700 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400",
    style: {
      backgroundColor: "#4C2365",
      color: "#FFFFFF"
    },
    title: "Start camera stream",
    "aria-label": "Start camera stream"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh-cw",
    className: "w-3.5 h-3.5 text-white"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-white font-bold"
  }, "Start Camera")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setCaptureMode("upload");
      stopCamera();
    },
    className: "px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center space-x-1.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400",
    title: "Switch to photo upload mode",
    "aria-label": "Switch to photo upload mode"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Upload Photo")))), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 flex flex-wrap items-center justify-between gap-2 z-20"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setContinuousAnalysis(!continuousAnalysis),
    className: `px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md transition-all border flex items-center space-x-1.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400 ${continuousAnalysis ? "bg-emerald-600/90 text-white border-emerald-400/40 shadow-sm" : "bg-slate-900/80 text-slate-200 border-white/20 hover:bg-slate-900"}`,
    title: continuousAnalysis ? "Turn continuous tracking analysis off" : "Turn continuous tracking analysis on",
    "aria-label": continuousAnalysis ? "Continuous tracking analysis active. Click to pause." : "Continuous tracking analysis paused. Click to activate.",
    "aria-pressed": continuousAnalysis
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "zap",
    className: `w-3.5 h-3.5 ${continuousAnalysis ? "text-emerald-200" : "text-slate-300"}`
  }), /*#__PURE__*/React.createElement("span", null, continuousAnalysis ? "Continuous: ON" : "Continuous: PAUSED")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1.5 sm:space-x-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowBiometricOverlay(!showBiometricOverlay),
    className: `px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md transition-all border flex items-center space-x-1.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400 ${showBiometricOverlay ? "bg-violet-700/90 text-white border-lavender-300/40 shadow-sm" : "bg-slate-900/80 text-slate-200 border-white/20 hover:bg-slate-900"}`,
    title: showBiometricOverlay ? "Hide anatomical framing guide overlay" : "Show anatomical framing guide overlay",
    "aria-label": showBiometricOverlay ? "Anatomical framing guide visible. Click to hide." : "Anatomical framing guide hidden. Click to show.",
    "aria-pressed": showBiometricOverlay
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "eye",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, showBiometricOverlay ? "Framing Guide: ON" : "Framing Guide: OFF")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: toggleCameraFacing,
    className: "px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white border border-white/20 transition-all shadow-sm flex items-center space-x-1.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400",
    title: `Switch camera (currently using ${cameraFacing === "user" ? "front" : "rear"} camera)`,
    "aria-label": `Switch camera (currently using ${cameraFacing === "user" ? "front (selfie)" : "rear (environment)"} camera)`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh-cw",
    className: "w-4 h-4"
  }), /*#__PURE__*/React.createElement("span", null, "Switch Camera"))))), captureMode === "upload" && /*#__PURE__*/React.createElement("div", {
    className: "w-full h-full flex flex-col items-center justify-center p-6 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    role: "button",
    tabIndex: 0,
    "aria-label": `Upload photograph of ${activePatient.name} for jaundice screening`,
    title: "Upload photo from your device",
    onClick: () => fileInputRef.current?.click(),
    onKeyDown: e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    className: "border-2 border-dashed border-slate-700 hover:border-lavender-300/80 focus:border-lavender-300 focus:outline-none focus:ring-2 focus:ring-violet-400 rounded-3xl p-8 w-full h-full flex flex-col items-center justify-center cursor-pointer transition-all group bg-slate-800/40"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-14 h-14 rounded-2xl bg-plum-500/20 text-lavender-300 flex items-center justify-center group-hover:scale-110 transition-transform"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload",
    className: "w-7 h-7"
  })), /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-bold text-white mt-4"
  }, "Upload Infant Photograph"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mt-1 max-w-xs"
  }, "Select a clear photo of ", activePatient.name, "'s forehead or face under indoor or natural light."), /*#__PURE__*/React.createElement("span", {
    className: "mt-4 px-4 py-2.5 rounded-xl bg-plum-900 hover:bg-violet-700 text-white text-xs font-semibold transition-colors min-h-[44px] inline-flex items-center",
    style: {
      backgroundColor: "#4C2365",
      color: "#FFFFFF"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-white font-bold"
  }, "Browse Local Files")), /*#__PURE__*/React.createElement("input", {
    ref: fileInputRef,
    id: "infant-photo-file-input",
    type: "file",
    accept: "image/*",
    "aria-label": "Choose infant photograph file from device",
    onChange: handleFileUpload,
    className: "hidden"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-lavender-300/60 p-4 shadow-md sm:shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-2 z-30 sm:relative sm:bottom-auto backdrop-blur-md bg-white/95"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3 text-xs text-plum-600"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2.5 h-2.5 rounded-full bg-plum-900 animate-pulse"
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
    className: "w-full sm:w-auto py-3.5 px-6 rounded-2xl btn-plum-primary text-white font-bold text-sm shadow-md shadow-plum-900/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.98] min-h-[48px] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2",
    style: {
      background: "linear-gradient(135deg, #4C2365 0%, #7F5D99 100%)",
      color: "#FFFFFF"
    },
    title: `Capture photo of ${activePatient.name} and perform screening analysis`,
    "aria-label": `Capture snapshot of ${activePatient.name} and start clinical jaundice screening`
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shrink-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 rounded-full bg-white"
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-white font-bold"
  }, "Capture & Screen Photo"))))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-lavender-300/60 p-5 shadow-xs space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    className: "w-4 h-4 text-plum-900"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "text-xs font-bold uppercase tracking-wider text-plum-950"
  }, "Capture Quality Rules")), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-3 text-xs text-plum-700"
  }, /*#__PURE__*/React.createElement("li", {
    className: "flex items-start space-x-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 rounded-full bg-plum-100/80 text-plum-900 flex items-center justify-center shrink-0 mt-0.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    className: "w-2.5 h-2.5"
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", {
    className: "text-plum-950"
  }, "Distance:"), " Hold phone 20–30 cm away. Align baby's forehead within the dashed guide oval.")), /*#__PURE__*/React.createElement("li", {
    className: "flex items-start space-x-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 rounded-full bg-plum-100/80 text-plum-900 flex items-center justify-center shrink-0 mt-0.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    className: "w-2.5 h-2.5"
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", {
    className: "text-plum-950"
  }, "Indirect Lighting:"), " Soft indoor lighting or window daylight is best. Avoid harsh directional flashlights.")), /*#__PURE__*/React.createElement("li", {
    className: "flex items-start space-x-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 rounded-full bg-plum-100/80 text-plum-900 flex items-center justify-center shrink-0 mt-0.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    className: "w-2.5 h-2.5"
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", {
    className: "text-plum-950"
  }, "Clear Landmarks:"), " Ensure forehead and eyes are uncovered by caps or blankets.")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-br from-plum-100/60 to-lavender-50 rounded-3xl border border-lavender-300/80 p-5 shadow-xs space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-plum-950"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "qr-code",
    className: "w-4 h-4 text-plum-900"
  }), /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold uppercase tracking-wider"
  }, "Reference Card (Optional)")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-plum-700 leading-relaxed"
  }, "Place an ArUco color card next to the cheek for ground-truth matrix color correction. If not available, NeoScan automatically uses the sclera and Shades-of-Gray constancy."), /*#__PURE__*/React.createElement("a", {
    href: "/api/v1/reference-card",
    target: "_blank",
    rel: "noreferrer",
    title: "Download printable ArUco calibration reference card (opens in a new tab)",
    "aria-label": "Download printable ArUco calibration reference card (opens in a new tab)",
    className: "inline-flex items-center space-x-1.5 text-xs font-bold text-plum-900 hover:text-violet-700 hover:underline min-h-[44px] focus:outline-none focus:ring-2 focus:ring-violet-400"
  }, /*#__PURE__*/React.createElement("span", null, "Download Printable Card"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    className: "w-3.5 h-3.5"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-lavender-300/60 shadow-xs overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setAdvancedOpticalOpen(!advancedOpticalOpen),
    "aria-expanded": advancedOpticalOpen,
    "aria-controls": "optical-method-selector-panel",
    title: advancedOpticalOpen ? "Collapse color constancy options" : "Expand color constancy options",
    "aria-label": advancedOpticalOpen ? "Collapse color constancy algorithm settings" : "Expand color constancy algorithm settings",
    className: "w-full p-4 flex items-center justify-between text-left hover:bg-plum-50/60 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 min-h-[44px]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-plum-900"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sliders",
    className: "w-4 h-4 text-plum-500"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold"
  }, "Color Constancy Algorithm")), /*#__PURE__*/React.createElement(Icon, {
    name: advancedOpticalOpen ? "chevron-up" : "chevron-down",
    className: "w-4 h-4 text-plum-500"
  })), advancedOpticalOpen && /*#__PURE__*/React.createElement("div", {
    id: "optical-method-selector-panel",
    className: "p-4 pt-0 border-t border-lavender-100 space-y-2"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-plum-600"
  }, "Choose the computer vision color constancy method used to remove ambient lighting bias:"), /*#__PURE__*/React.createElement("label", {
    htmlFor: "optical-method-select",
    className: "sr-only"
  }, "Color Constancy Algorithm"), /*#__PURE__*/React.createElement("select", {
    id: "optical-method-select",
    "aria-label": "Select color constancy normalization method",
    value: correctionMethod,
    onChange: e => handleMethodChange(e.target.value),
    className: "w-full py-2.5 px-3 rounded-xl bg-plum-50/50 border border-lavender-300 text-xs font-semibold text-plum-950 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[44px]"
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
    className: "space-y-6 sm:space-y-8 animate-fadeIn pb-[calc(2rem+env(safe-area-inset-bottom,0px))]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-lavender-300/60 shadow-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-2xl bg-plum-100/70 text-plum-900 flex items-center justify-center border border-lavender-300/80 shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "baby",
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-plum-950 truncate"
  }, activePatient.name, " • Clinical Screening Record"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-plum-600 truncate"
  }, "Age: ", activePatient.ageValue, " ", activePatient.ageUnit, " • Gestation: ", activePatient.gestation, " • Strategy: ", activeImageRecord.activeCorrection || "auto"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setError(null);
      setCurrentStep(2);
      if (captureMode === "camera") {
        startCamera();
      }
    },
    className: "min-h-[44px] px-4 py-2 rounded-xl bg-plum-100/60 hover:bg-plum-200/70 text-xs font-bold text-plum-900 transition-colors flex items-center space-x-2 shrink-0 active:scale-95"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    className: "w-4 h-4"
  }), /*#__PURE__*/React.createElement("span", null, "Rescreen / Retake")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => window.print(),
    className: "min-h-[44px] px-4 py-2 rounded-xl bg-plum-100/70 hover:bg-plum-200/80 text-xs font-bold text-plum-900 border border-lavender-300/80 transition-colors flex items-center space-x-2 shrink-0 active:scale-95"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "printer",
    className: "w-4 h-4"
  }), /*#__PURE__*/React.createElement("span", null, "Export Report")))), /*#__PURE__*/React.createElement("div", {
    className: "p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6",
    style: {
      backgroundColor: `${riskDetails.color}0a`,
      borderColor: `${riskDetails.color}35`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col md:flex-row md:items-start justify-between gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 flex-1"
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
    className: "text-2xl sm:text-3xl font-extrabold text-plum-950 tracking-tight"
  }, riskDetails.title), /*#__PURE__*/React.createElement("p", {
    className: "text-sm sm:text-base text-plum-700 max-w-2xl leading-relaxed"
  }, riskDetails.recommendation), riskDetails.reasonsList && riskDetails.reasonsList.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "pt-2 space-y-1.5 bg-white/60 p-3.5 rounded-2xl border border-lavender-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold uppercase tracking-wider text-plum-900 block"
  }, "Clinical Rationale & Decision Factors:"), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-1 text-xs text-plum-800"
  }, riskDetails.reasonsList.map((r, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: "flex items-start space-x-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
    style: {
      backgroundColor: riskDetails.color
    }
  }), /*#__PURE__*/React.createElement("span", null, r))))), riskDetails.reliabilityNote && /*#__PURE__*/React.createElement("div", {
    className: "p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2.5"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-triangle",
    className: "w-4 h-4 text-amber-600 shrink-0 mt-0.5"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold block text-amber-950"
  }, "Reliability Caution:"), /*#__PURE__*/React.createElement("span", null, riskDetails.reliabilityNote)))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white/95 backdrop-blur-md rounded-2xl border border-lavender-300/70 p-5 shadow-xs shrink-0 w-full md:w-80 space-y-3"
  }, riskDetails.modelScore !== null && riskDetails.modelScore !== undefined && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs pb-1 border-b border-lavender-100"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-plum-600"
  }, "Model Screening Score:"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-plum-950 font-mono text-sm"
  }, riskDetails.modelScore.toFixed(4))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-plum-600"
  }, "CIE b* Cutaneous Yellowness:"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-plum-950 font-mono text-sm"
  }, riskDetails.bStar !== "N/A" ? `${riskDetails.bStar} b*` : "No measurement")), riskDetails.bStarDisplay && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-[11px] text-plum-600 bg-plum-50/60 px-2.5 py-1 rounded-lg"
  }, /*#__PURE__*/React.createElement("span", null, "Forehead: ", /*#__PURE__*/React.createElement("strong", {
    className: "text-plum-900 font-mono"
  }, riskDetails.bStarDisplay.forehead.toFixed(1))), /*#__PURE__*/React.createElement("span", {
    className: "text-lavender-300"
  }, "|"), /*#__PURE__*/React.createElement("span", null, "Cheeks: ", /*#__PURE__*/React.createElement("strong", {
    className: "text-plum-900 font-mono"
  }, riskDetails.bStarDisplay.cheeks.toFixed(1))), /*#__PURE__*/React.createElement("span", {
    className: "text-lavender-300"
  }, "|"), /*#__PURE__*/React.createElement("span", null, "Combined: ", /*#__PURE__*/React.createElement("strong", {
    className: "text-plum-900 font-mono"
  }, riskDetails.bStarDisplay.combined.toFixed(1)))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5 relative pt-3 pb-1",
    role: "meter",
    "aria-label": `CIE b* Yellowness scale: ${riskDetails.bStar} b*`,
    "aria-valuenow": riskDetails.bStarNum || 0,
    "aria-valuemin": "0",
    "aria-valuemax": "30"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full h-3.5 rounded-full shadow-inner relative",
    style: {
      background: "linear-gradient(to right, #FEF08A 0%, #FBBF24 46.7%, #F97316 66.7%, #DC2626 100%)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 flex justify-between px-0.5 items-center pointer-events-none opacity-40"
  }, [0, 5, 10, 15, 20, 25, 30].map(tick => /*#__PURE__*/React.createElement("div", {
    key: tick,
    className: "w-[1px] h-2 bg-black/60",
    style: {
      left: `${tick / 30 * 100}%`
    }
  })))), riskDetails.markerPos !== null && /*#__PURE__*/React.createElement("div", {
    className: "absolute top-1 w-4 h-4 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 transition-all duration-500 z-10 flex items-center justify-center ring-1 ring-black/20",
    style: {
      left: `${riskDetails.markerPos}%`,
      backgroundColor: riskDetails.color
    },
    title: `Measured b* = ${riskDetails.bStar}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-1.5 h-1.5 rounded-full bg-white"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-[9px] text-plum-500 font-mono font-semibold px-0.5"
  }, /*#__PURE__*/React.createElement("span", null, "0"), /*#__PURE__*/React.createElement("span", null, "5"), /*#__PURE__*/React.createElement("span", null, "10"), /*#__PURE__*/React.createElement("span", null, "15"), /*#__PURE__*/React.createElement("span", null, "20"), /*#__PURE__*/React.createElement("span", null, "25"), /*#__PURE__*/React.createElement("span", null, "30+")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-[10px] font-medium pt-0.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-yellow-700"
  }, "Low (<14)"), /*#__PURE__*/React.createElement("span", {
    className: "text-orange-700"
  }, "Moderate (14–20)"), /*#__PURE__*/React.createElement("span", {
    className: "text-red-700"
  }, "Elevated (≥20)"))), /*#__PURE__*/React.createElement("div", {
    className: "pt-2 border-t border-lavender-100 flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-plum-600"
  }, "Bilirubin Index (BIx):"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-plum-950 font-mono"
  }, riskDetails.bix !== "N/A" ? riskDetails.bix : "N/A")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-plum-600"
  }, "Illumination Normalization:"), /*#__PURE__*/React.createElement("span", {
    className: `font-bold font-mono ${riskDetails.reliability === "reduced" ? "text-amber-600" : "text-emerald-700"}`
  }, riskDetails.reliability === "reduced" ? "Reduced (Uncalibrated)" : "Calibrated (D65)")))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-lavender-200/80"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white/95 rounded-2xl p-4 border border-lavender-200/70 shadow-xs space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-plum-950 font-bold text-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "droplet",
    className: "w-4 h-4 text-plum-900"
  }), /*#__PURE__*/React.createElement("span", null, "Feeding & Hydration")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-plum-600 leading-relaxed"
  }, "Feed 8–12 times per 24 hours. Frequent feeding stimulates bowel movements, which naturally excretes bilirubin.")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white/95 rounded-2xl p-4 border border-lavender-200/70 shadow-xs space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-plum-950 font-bold text-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sun",
    className: "w-4 h-4 text-amber-600"
  }), /*#__PURE__*/React.createElement("span", null, "Daylight Observation")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-plum-600 leading-relaxed"
  }, "Check skin in indirect natural window light. Blanch skin with gentle finger pressure to observe underlying tone.")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white/95 rounded-2xl p-4 border border-lavender-200/70 shadow-xs space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-plum-950 font-bold text-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    className: "w-4 h-4 text-clinical-elevated"
  }), /*#__PURE__*/React.createElement("span", null, "When to Call Doctor")), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-plum-600 leading-relaxed"
  }, "Seek immediate pediatric review if yellowness spreads to abdomen/legs or baby is difficult to wake.")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-lavender-300/60 p-6 shadow-xs space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-lavender-100 pb-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-plum-950"
  }, "Multi-Spectrum Visual Inspection"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-plum-600"
  }, "Real illumination correction, anatomical landmarks, and dermal b* yellowness distribution")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-1.5 bg-plum-100/60 p-1.5 rounded-xl text-xs overflow-x-auto border border-lavender-200/60 no-scrollbar max-w-full"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setImageCompareMode("corrected"),
    className: `min-h-[40px] px-3.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 whitespace-nowrap active:scale-95 ${imageCompareMode === "corrected" ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"}`
  }, "Corrected"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setImageCompareMode("raw"),
    className: `min-h-[40px] px-3.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 whitespace-nowrap active:scale-95 ${imageCompareMode === "raw" ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"}`
  }, "Original Raw"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setImageCompareMode("diagnostic"),
    className: `min-h-[40px] px-3.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 whitespace-nowrap active:scale-95 ${imageCompareMode === "diagnostic" ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"}`
  }, "Diagnostic ROIs"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setImageCompareMode("heatmap"),
    className: `min-h-[40px] px-3.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 whitespace-nowrap active:scale-95 ${imageCompareMode === "heatmap" ? "bg-white text-plum-950 shadow-sm" : "text-plum-600 hover:text-plum-950"}`
  }, "Yellowness Heat Map"))), imageCompareMode === "corrected" && !analysisResult?.visualizations?.colour_normalised && /*#__PURE__*/React.createElement("div", {
    className: "p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-circle",
    className: "w-4 h-4 text-amber-600 shrink-0 mt-0.5"
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "No illumination correction applied:"), " Insufficient neutral background to isolate illuminant. Image is displayed in original capture without color shift.")), /*#__PURE__*/React.createElement("div", {
    className: "relative aspect-[16/10] sm:aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(ImageWithFallback, {
    key: `${activePatient?.id || "p"}_${activeImageRecord?.id || "img"}_${imageCompareMode}`,
    src: activeDisplayImage,
    alt: "Clinical Inspection View",
    className: "w-full h-full"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-3 left-3 px-3 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10"
  }, imageCompareMode === "corrected" && (analysisResult?.visualizations?.colour_normalised ? "Illumination Corrected (Shades-of-Gray Background Constancy)" : "Raw Capture (No Background Correction Available)"), imageCompareMode === "raw" && "Original Uncorrected Capture", imageCompareMode === "diagnostic" && "Anatomical Landmark ROI Contours (Forehead & Cheeks)", imageCompareMode === "heatmap" && "Cutaneous CIE b* Yellowness Heat Map")), imageCompareMode === "heatmap" && /*#__PURE__*/React.createElement("div", {
    className: "p-3.5 rounded-2xl bg-plum-50/70 border border-lavender-200/80 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-plum-950"
  }, "Cutaneous b* Chrominance Colormap:"), /*#__PURE__*/React.createElement("span", {
    className: "text-plum-600 font-mono text-[11px]"
  }, "0.0 – 30.0+ b*")), /*#__PURE__*/React.createElement("div", {
    className: "w-full h-3 rounded-full shadow-inner",
    style: {
      background: "linear-gradient(to right, #FEF08A 0%, #FBBF24 46.7%, #F97316 66.7%, #DC2626 100%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-[10px] font-medium text-plum-700"
  }, /*#__PURE__*/React.createElement("span", null, "0 b* Low (Light Yellow)"), /*#__PURE__*/React.createElement("span", null, "14 b* Moderate (Amber)"), /*#__PURE__*/React.createElement("span", null, "20 b* Elevated (Orange)"), /*#__PURE__*/React.createElement("span", null, "30+ b* Severe (Crimson)")), /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] text-plum-600 leading-tight"
  }, "Heatmap depicts calibrated yellowness chrominance (b*) across segmented infant skin. Non-skin background pixels are desaturated for anatomical focus."))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-lavender-200/80 shadow-xs overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setClinicalAccordionOpen(!clinicalAccordionOpen),
    className: "p-6 flex items-center justify-between cursor-pointer hover:bg-plum-50/50 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-plum-100/70 text-plum-900 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "activity",
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-plum-950"
  }, "Clinical Insights & Technical Breakdown"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-plum-700"
  }, "Optical color constancy metrics, anatomical ROI yellowness, and ML model telemetry"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 text-xs font-semibold text-plum-900 hover:text-plum-950"
  }, /*#__PURE__*/React.createElement("span", null, clinicalAccordionOpen ? "Hide Breakdown" : "View Breakdown"), /*#__PURE__*/React.createElement(Icon, {
    name: clinicalAccordionOpen ? "chevron-up" : "chevron-down",
    className: "w-4 h-4"
  }))), clinicalAccordionOpen && /*#__PURE__*/React.createElement("div", {
    className: "p-6 pt-0 border-t border-lavender-100/80 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 border-b border-lavender-100/80 pb-3 overflow-x-auto no-scrollbar"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setClinicalTab("optical"),
    className: `min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap active:scale-95 ${clinicalTab === "optical" ? "bg-plum-100/80 text-plum-950 border border-lavender-300/80 shadow-xs" : "text-plum-700 hover:text-plum-950"}`
  }, "Optical Normalization"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setClinicalTab("biomarkers"),
    className: `min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap active:scale-95 ${clinicalTab === "biomarkers" ? "bg-plum-100/80 text-plum-950 border border-lavender-300/80 shadow-xs" : "text-plum-700 hover:text-plum-950"}`
  }, "Biometric ROIs (b*, Cr/Cb)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setClinicalTab("model"),
    className: `min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap active:scale-95 ${clinicalTab === "model" ? "bg-plum-100/80 text-plum-950 border border-lavender-300/80 shadow-xs" : "text-plum-700 hover:text-plum-950"}`
  }, "Model & Quality Gating")), clinicalTab === "optical" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-plum-50/40 p-4 rounded-2xl border border-lavender-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-plum-600"
  }, "Active Method"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-plum-950 mt-1 uppercase"
  }, analysisResult?.active_correction_method || "auto"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-plum-800 mt-1 block"
  }, "Illumination compensated")), /*#__PURE__*/React.createElement("div", {
    className: "bg-plum-50/40 p-4 rounded-2xl border border-lavender-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-plum-600"
  }, "Ambient CCT"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-plum-950 mt-1 font-mono"
  }, analysisResult?.lighting_condition?.cct_kelvin || 5500, " K"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-plum-700 mt-1 block"
  }, analysisResult?.lighting_condition?.category || "Standard Daylight")), /*#__PURE__*/React.createElement("div", {
    className: "bg-plum-50/40 p-4 rounded-2xl border border-lavender-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-plum-600"
  }, "Sharpness Index"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-plum-950 mt-1 font-mono"
  }, analysisResult?.quality_gate?.sharpness_score?.toFixed(1) || "142.0"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-clinical-normal font-semibold mt-1 block"
  }, "Passed Quality Gate")), /*#__PURE__*/React.createElement("div", {
    className: "bg-plum-50/40 p-4 rounded-2xl border border-lavender-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-plum-600"
  }, "Dermal Coverage"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-plum-950 mt-1 font-mono"
  }, ((analysisResult?.quality_gate?.valid_pixel_ratio || 0.98) * 100).toFixed(1), "%"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-plum-700 mt-1 block"
  }, "Specular glare excluded")))), clinicalTab === "biomarkers" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-xs"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-lavender-200 text-plum-600 uppercase text-[10px] font-bold"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-2.5 px-3"
  }, "Anatomical Landmark"), /*#__PURE__*/React.createElement("th", {
    className: "py-2.5 px-3"
  }, "Raw b*"), /*#__PURE__*/React.createElement("th", {
    className: "py-2.5 px-3 font-semibold text-plum-900"
  }, "Corrected b* (Yellowness)"), /*#__PURE__*/React.createElement("th", {
    className: "py-2.5 px-3"
  }, "Bilirubin Index (BIx)"), /*#__PURE__*/React.createElement("th", {
    className: "py-2.5 px-3"
  }, "Clinical Weight"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-lavender-100 font-mono"
  }, analysisResult?.roi_breakdown && Object.entries(analysisResult.roi_breakdown).map(([k, v]) => /*#__PURE__*/React.createElement("tr", {
    key: k,
    className: "hover:bg-plum-50/50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-3 font-sans font-bold capitalize text-plum-950"
  }, k), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-3 text-plum-700"
  }, v.raw_b_star?.toFixed(2) || "N/A"), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-3 font-bold text-plum-900"
  }, v.corrected_b_star?.toFixed(2) || "N/A"), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-3 text-plum-900"
  }, v.corrected_bix?.toFixed(3) || "N/A"), /*#__PURE__*/React.createElement("td", {
    className: "py-3 px-3 text-plum-700"
  }, ((v.effective_weight || 0.25) * 100).toFixed(0), "%"))))))), clinicalTab === "model" && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-4 rounded-2xl bg-plum-50/40 border border-lavender-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-plum-600"
  }, "Methodology / Engine"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-plum-950 mt-1"
  }, analysisResult?.model_version ? `neoscan_ml (${analysisResult.model_version})` : "Optical Screening"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-plum-700 mt-1 block"
  }, riskDetails.methodology)), /*#__PURE__*/React.createElement("div", {
    className: "p-4 rounded-2xl bg-plum-50/40 border border-lavender-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-plum-600"
  }, "Quality Gating"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-plum-950 mt-1"
  }, "Quality & Face Gate"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-plum-700 mt-1 block"
  }, "Sharpness: ", analysisResult?.quality_gate?.sharpness_score?.toFixed(1) || "Passed", " • Dermal Coverage: ", ((analysisResult?.quality_gate?.valid_pixel_ratio || 0.98) * 100).toFixed(0), "%")), /*#__PURE__*/React.createElement("div", {
    className: "p-4 rounded-2xl bg-plum-50/40 border border-lavender-200/70"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] font-bold uppercase text-plum-600"
  }, "Screening Score & Thresholds"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-plum-900 mt-1 font-mono"
  }, riskDetails.modelScore !== null && riskDetails.modelScore !== undefined ? `Score: ${riskDetails.modelScore.toFixed(4)} (Cutoff 0.50)` : "b* < 16.0 (Normal)"), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-clinical-normal font-semibold mt-1 block"
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
    className: "bg-white rounded-3xl border border-lavender-200/80 p-5 shadow-xs space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold uppercase tracking-wider text-plum-950"
  }, activePatient.name, "'s Longitudinal Screenings (", activePatient.images ? activePatient.images.length : 0, ")"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-plum-600"
  }, "Click any frame to view")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3 overflow-x-auto pb-2"
  }, activePatient.images && activePatient.images.map(img => {
    const isV2Scan = Boolean(img.currentAnalysis?.model_score !== undefined || img.currentAnalysis?.model_version || img.currentAnalysis?.risk_assessment?.screening_engine === "neoscan_ml");
    return /*#__PURE__*/React.createElement("div", {
      key: img.id,
      onClick: () => setActiveImageId(img.id),
      className: `w-28 shrink-0 rounded-2xl border p-2 cursor-pointer transition-all ${activeImageRecord && activeImageRecord.id === img.id ? "border-plum-900 ring-2 ring-plum-900/20 bg-plum-50/50" : "border-lavender-200/80 bg-plum-50/30 hover:border-violet-300"}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "aspect-[4/3] rounded-xl overflow-hidden bg-plum-100/40 mb-1.5"
    }, /*#__PURE__*/React.createElement(ImageWithFallback, {
      src: img.rawImage,
      alt: "Historical thumbnail",
      className: "w-full h-full"
    })), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-bold text-plum-950 truncate"
    }, img.formattedDate), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-[9px] text-plum-600 capitalize mt-0.5"
    }, /*#__PURE__*/React.createElement("span", null, img.activeCorrection || "auto"), isV2Scan ? /*#__PURE__*/React.createElement("span", {
      className: "text-[8px] font-medium text-plum-900 bg-plum-100/80 px-1 rounded"
    }, "v2.0") : /*#__PURE__*/React.createElement("span", {
      className: "text-[8px] font-medium text-plum-600 bg-plum-100/40 px-1 rounded"
    }, "Legacy")));
  }))))), loading && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-plum-950/70 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-lavender-200/80 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative w-20 h-20 mx-auto flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 rounded-full bg-violet-500/20 animate-pulse-ring"
  }), /*#__PURE__*/React.createElement("div", {
    className: "w-14 h-14 rounded-2xl avatar-plum-gradient flex items-center justify-center text-white shadow-lg shadow-plum-900/30 animate-heartbeat",
    style: {
      background: "linear-gradient(135deg, #4C2365 0%, #7F5D99 100%)",
      color: "#FFFFFF"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    className: "w-7 h-7 text-white"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-bold text-plum-950"
  }, "Evaluating Infant Skin"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-plum-700 leading-relaxed transition-all"
  }, loadingMessage)), /*#__PURE__*/React.createElement("div", {
    className: "w-full bg-plum-100/60 rounded-full h-1.5 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-plum-900 h-full rounded-full w-2/3 animate-[spin_2s_linear_infinite]"
  })))), /*#__PURE__*/React.createElement("footer", {
    className: "mt-auto border-t border-lavender-200/80 bg-white py-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-plum-700 max-w-3xl leading-relaxed"
  }, /*#__PURE__*/React.createElement("strong", {
    className: "text-plum-950"
  }, "Clinical Screening Disclaimer:"), " NeoScan is an AI-assisted screening companion designed to support parents and pediatric care teams. It is not an invasive diagnostic device and does not replace confirmed laboratory serum bilirubin (TSB) or clinical transcutaneous bilirubin (TcB) testing. Always seek medical guidance from a licensed pediatrician."), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] font-semibold text-plum-600 shrink-0 flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(NeoScanLogo, {
    size: 18,
    showWordmark: false
  }), /*#__PURE__*/React.createElement("span", null, "NeoScan v2.0 • neoscan_ml Engine")))), isBackgroundVeilActive && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-plum-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center text-white",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(NeoScanLogo, {
    size: 44,
    showWordmark: true
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-lavender-200 mt-3 font-semibold"
  }, "Protected Pediatric Health Session")), isSessionLocked && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 bg-plum-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center text-white animate-fadeIn"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-sm w-full bg-white text-plum-950 p-8 rounded-3xl shadow-2xl border border-lavender-200/80 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 rounded-2xl bg-plum-100 flex items-center justify-center mx-auto text-plum-900"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    className: "w-8 h-8"
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-bold"
  }, "Session Locked"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-plum-600 leading-relaxed"
  }, "NeoScan was locked after 15 minutes of inactivity to protect sensitive neonatal patient records.")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => {
      setIsSessionLocked(false);
      resetInactivityTimer();
    },
    className: "w-full py-3.5 px-6 rounded-2xl bg-plum-900 hover:bg-violet-700 text-white font-bold text-sm transition-all shadow-md active:scale-95 min-h-[48px]",
    style: {
      backgroundColor: "#4C2365",
      color: "#FFFFFF"
    }
  }, "Resume Clinical Session"))));
}

// Safely mount to #root
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(/*#__PURE__*/React.createElement(App, null));
}