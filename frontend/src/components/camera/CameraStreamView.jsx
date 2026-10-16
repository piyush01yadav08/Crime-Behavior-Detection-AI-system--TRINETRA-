import React, { useState, useEffect, useRef } from "react";
import { streamService } from "../../services/streamService";
import { Video, ShieldAlert, Radio, RefreshCw, AlertTriangle, Camera, Eye } from "lucide-react";

/**
 * CameraStreamView Component
 * Renders:
 * 1. Backend AI MJPEG stream (YOLOv8 + DeepSORT + OpenCV loitering detector)
 * 2. Direct Browser WebRTC Webcam (instant live physical camera access)
 * 3. Autonomous Simulated CCTV scene with moving pedestrians & loitering analysis
 */
export function CameraStreamView({
  camera,
  isLive = true,
  isFocused = false,
  minimal = false,
  className = ""
}) {
  const isPhysicalCam = (camera?.id || "CAM-02") === "CAM-02";

  // Modes: "backend" | "webrtc" | "simulated"
  const [feedMode, setFeedMode] = useState(isPhysicalCam ? "backend" : "simulated");
  const [frameTick, setFrameTick] = useState(0);
  const [streamError, setStreamError] = useState(false);
  const [loiteringAlert, setLoiteringAlert] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [webrtcError, setWebrtcError] = useState(null);
  const [dwellTimer, setDwellTimer] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Sync mode whenever active camera changes (e.g. clicking another camera on the sphere)
  useEffect(() => {
    setFeedMode(isPhysicalCam ? "backend" : "simulated");
    setStreamError(false);
  }, [camera?.id, isPhysicalCam]);

  const streamUrl = streamService.getStreamUrl(camera?.id || "CAM-02");

  // WebRTC Local Camera Handler
  useEffect(() => {
    if (feedMode === "webrtc") {
      setWebrtcError(null);
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn("WebRTC camera access failed:", err);
          setWebrtcError("Webcam permission denied or busy");
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [feedMode]);

  // Periodic Telemetry Fetch from Backend
  useEffect(() => {
    if (feedMode !== "backend" || streamError) return;
    const interval = setInterval(async () => {
      const data = await streamService.getTelemetry();
      if (data) {
        setTelemetry(data);
        if (data.loiteringPersons > 0) {
          const loiterer = data.subjects?.find((s) => s.is_loitering);
          setLoiteringAlert({
            id: loiterer ? `TRK-${loiterer.track_id}` : "TRK-104",
            dwell: loiterer ? loiterer.dwell_time : 12.0,
            time: new Date().toLocaleTimeString(),
          });
        }
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [feedMode, streamError]);

  // Simulated Animation Tick & Dwell Counter
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setFrameTick((prev) => (prev + 1) % 100);
      setDwellTimer((prev) => {
        const next = prev + 0.4;
        if (next > 10.0 && !loiteringAlert) {
          setLoiteringAlert({
            id: "TRK-104",
            dwell: Math.round(next),
            time: new Date().toLocaleTimeString(),
          });
        }
        return next % 25;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [isLive, loiteringAlert]);

  const offset = Math.sin(frameTick * 0.1) * 3;

  const handleTriggerDemoLoitering = async () => {
    setLoiteringAlert({
      id: "TRK-104",
      dwell: 14.5,
      time: new Date().toLocaleTimeString(),
    });
    await streamService.triggerLoiteringDemo();
    setTimeout(() => setLoiteringAlert(null), 8000);
  };

  const renderSimulatedScene = () => {
    const pType = camera?.previewType || "traffic";
    const camName = camera?.shortName || camera?.name || "SURVEILLANCE NODE";

    if (pType === "gate") {
      return (
        <svg viewBox="0 0 640 360" className="w-full h-full object-cover">
          <rect width="640" height="360" fill="#080f1a" />
          <rect x="0" y="220" width="640" height="140" fill="#0f192b" />
          {/* Gate barrier & security checkpoint */}
          <line x1="80" y1="230" x2="560" y2="230" stroke="#334155" strokeWidth="6" />
          <rect x="290" y="160" width="60" height="90" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <text x="300" y="185" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">BOOTH A</text>
          {/* Security Guard */}
          <g transform={`translate(${160 + offset * 0.8}, 210)`}>
            <circle cx="12" cy="8" r="7" fill="#10b981" />
            <rect x="4" y="16" width="16" height="42" fill="#10b981" />
            <rect x="-2" y="12" width="28" height="50" fill="none" stroke="#10b981" strokeWidth="1.5" />
            <text x="-4" y="6" fill="#10b981" fontSize="8" fontFamily="monospace">SECURITY</text>
          </g>
          {/* Entering Vehicle */}
          <g transform={`translate(${410 - offset * 2}, 235)`}>
            <rect x="0" y="0" width="90" height="44" fill="#64748b" />
            <rect x="12" y="8" width="65" height="18" fill="#1e293b" />
            <rect x="-4" y="-4" width="98" height="52" fill="none" stroke="#00e5ff" strokeWidth="1.5" />
            <text x="0" y="-8" fill="#00e5ff" fontSize="8" fontFamily="monospace">VEHICLE #AP-88</text>
          </g>
          <text x="20" y="30" fill="#0284c7" fontSize="11" fontFamily="monospace" fontWeight="bold">
            {camera?.id || "CAM-01"} • MAIN PERIMETER CHECKPOINT [SIMULATED CCTV]
          </text>
        </svg>
      );
    }

    if (pType === "hallway" || pType === "indoor" || pType === "warehouse") {
      return (
        <svg viewBox="0 0 640 360" className="w-full h-full object-cover">
          <rect width="640" height="360" fill="#060b17" />
          {/* Perspective corridor */}
          <polygon points="180,100 460,100 640,360 0,360" fill="#0d1526" />
          <line x1="180" y1="100" x2="0" y2="360" stroke="#1e293b" strokeWidth="2" />
          <line x1="460" y1="100" x2="640" y2="360" stroke="#1e293b" strokeWidth="2" />
          <line x1="320" y1="100" x2="320" y2="360" stroke="#334155" strokeWidth="1" strokeDasharray="8 8" />
          {/* Staff Member */}
          <g transform={`translate(${280 + offset}, 180)`}>
            <circle cx="12" cy="8" r="6" fill="#38bdf8" />
            <rect x="6" y="15" width="12" height="38" fill="#38bdf8" />
            <rect x="0" y="10" width="24" height="46" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="-4" y="4" fill="#38bdf8" fontSize="8" fontFamily="monospace">STAFF-204</text>
          </g>
          <text x="20" y="30" fill="#0284c7" fontSize="11" fontFamily="monospace" fontWeight="bold">
            {camera?.id} • {camName.toUpperCase()} [SIMULATED CCTV]
          </text>
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 640 360" className="w-full h-full object-cover">
        <defs>
          <linearGradient id="roadSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#080e1a" />
            <stop offset="60%" stopColor="#121e33" />
            <stop offset="100%" stopColor="#0b1322" />
          </linearGradient>
          <linearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#141c2b" />
            <stop offset="100%" stopColor="#0d1420" />
          </linearGradient>
        </defs>

        <rect width="640" height="200" fill="url(#roadSky)" />
        <path d="M40 200 L40 130 L90 130 L90 200 M110 200 L110 110 L170 110 L170 200 M210 200 L210 140 L260 140 L260 200 M380 200 L380 120 L440 120 L440 200 M470 200 L470 100 L530 100 L530 200 M560 200 L560 140 L610 140 L610 200" fill="#060a12" opacity="0.6"/>
        <path d="M0 200 Q320 180 640 200 L640 360 L0 360 Z" fill="url(#asphalt)" />
        <polygon points="280,180 360,180 580,360 60,360" fill="#0f1624" />
        <line x1="320" y1="180" x2="320" y2="360" stroke="#d97706" strokeWidth="2.5" strokeDasharray="14 14" opacity="0.5" />

        {/* Loitering Subject TRK-104 */}
        <g transform={`translate(${240 + offset}, 220)`}>
          <circle cx="14" cy="8" r="6" fill="#f87171" />
          <line x1="14" y1="14" x2="14" y2="36" stroke="#f87171" strokeWidth="3" />
          <line x1="14" y1="36" x2="7" y2="56" stroke="#f87171" strokeWidth="2.5" />
          <line x1="14" y1="36" x2="21" y2="56" stroke="#f87171" strokeWidth="2.5" />
          <rect x="-4" y="0" width="36" height="60" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="1.8" />
          <rect x="-4" y="-18" width="88" height="15" fill="#b91c1c" />
          <text x="-1" y="-7" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">
            TRK-104 | LOITERING
          </text>
        </g>

        {/* Moving Subject TRK-102 */}
        <g transform={`translate(${110 - offset * 0.5}, 242)`}>
          <circle cx="10" cy="6" r="4.5" fill="#38bdf8" />
          <line x1="10" y1="11" x2="10" y2="28" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="10" y1="28" x2="5" y2="44" stroke="#38bdf8" strokeWidth="2" />
          <line x1="10" y1="28" x2="15" y2="44" stroke="#38bdf8" strokeWidth="2" />
          <rect x="0" y="-2" width="20" height="48" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.7" />
          <text x="0" y="-6" fill="#38bdf8" fontSize="7" fontFamily="monospace">TRK-102 [MOVING]</text>
        </g>

        {/* Restricted Area Tripwire */}
        <polygon points="200,210 380,210 420,310 160,310" fill="rgba(245, 158, 11, 0.08)" stroke="#f59e0b" strokeWidth="1" strokeDasharray="6 3" />
        <text x="210" y="225" fill="#f59e0b" fontSize="8" fontFamily="monospace">ZONE 4 - DWELL THRESHOLD: 8s</text>
      </svg>
    );
  };

  if (camera?.status === "OFFLINE") {
    return (
      <div className={`relative w-full h-full bg-[#060a12] flex flex-col items-center justify-center text-slate-500 overflow-hidden ${className}`}>
        <span className="w-2.5 h-2.5 rounded-full bg-slate-600 mb-1.5" />
        <p className="text-[10px] font-mono text-slate-400">SIGNAL LOST (OFFLINE)</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[190px] bg-[#050811] overflow-hidden select-none group flex flex-col justify-center items-center ${className}`}>
      {/* 1. Backend AI Stream Mode */}
      {feedMode === "backend" && !streamError && (
        <img
          src={streamUrl}
          alt={`Live Feed ${camera?.id || "CAM-02"}`}
          className="w-full h-full object-cover"
          onError={() => {
            console.warn("Backend stream error, switching to simulation fallback");
            setStreamError(true);
          }}
        />
      )}

      {/* 2. WebRTC Browser Camera Mode */}
      {feedMode === "webrtc" && (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {webrtcError && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-3 text-center">
              <Camera className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-xs text-amber-300 font-mono">{webrtcError}</p>
              <button
                onClick={() => setFeedMode("simulated")}
                className="mt-2 text-[10px] bg-slate-800 text-white px-2 py-1 rounded"
              >
                Use Simulation
              </button>
            </div>
          )}
          {/* WebRTC In-Canvas Loitering Simulation Marker */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-64 border-2 border-emerald-400/80 rounded relative">
              <div className="absolute -top-5 left-0 bg-emerald-500 text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                Subject #TRK-101 (Local Webcam)
              </div>
              <div className="absolute bottom-2 left-2 bg-black/70 text-emerald-300 text-[9px] font-mono px-1 rounded">
                Dwell: {dwellTimer.toFixed(0)}s | YOLO Active
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Fallback / CCTV Simulation Mode */}
      {(feedMode === "simulated" || (feedMode === "backend" && streamError)) && (
        renderSimulatedScene()
      )}

      {/* Loitering Alert Banner */}
      {(loiteringAlert || camera?.status === "ALERT") && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg border border-red-400 animate-pulse">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>LOITERING DETECTED: {loiteringAlert?.id || "TRK-104"} (Dwell Exceeded)</span>
        </div>
      )}

      {/* Overlays (Hidden in minimal mode) */}
      {!minimal && (
        <>
          {/* Top Left: Camera ID & Live Tag */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-200 bg-black/80 px-1.5 py-0.5 rounded border border-white/10 font-bold">
              {camera?.id || "CAM-02"}
            </span>
            <span className="text-[9px] font-mono bg-cyan-950/90 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
              {feedMode === "backend" && !streamError
                ? "AI BACKEND FEED"
                : feedMode === "webrtc"
                ? "WEBRTC WEBCAM"
                : "CCTV SIMULATION"}
            </span>
          </div>

          {/* Top Right: Mode Selection Buttons */}
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            <button
              onClick={() => {
                setStreamError(false);
                setFeedMode("backend");
              }}
              className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-colors ${
                feedMode === "backend" && !streamError
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                  : "bg-black/70 text-slate-400 border-white/10 hover:text-white"
              }`}
              title="Stream from Python Backend AI (OpenCV + YOLO)"
            >
              Backend Stream
            </button>

            <button
              onClick={() => setFeedMode("webrtc")}
              className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                feedMode === "webrtc"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400"
                  : "bg-black/70 text-slate-400 border-white/10 hover:text-white"
              }`}
              title="Activate Browser WebRTC Camera directly"
            >
              <Camera className="w-2.5 h-2.5" />
              Browser Cam
            </button>

            <button
              onClick={() => setFeedMode("simulated")}
              className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-colors ${
                feedMode === "simulated" || streamError
                  ? "bg-amber-500/20 text-amber-300 border-amber-400"
                  : "bg-black/70 text-slate-400 border-white/10 hover:text-white"
              }`}
              title="Use CCTV Simulation"
            >
              Sim CCTV
            </button>
          </div>

          {/* Bottom Bar: Loitering Detection status and test alert button */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono bg-amber-950/80 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                LOITERING ENGINE: ACTIVE
              </span>

              <button
                onClick={handleTriggerDemoLoitering}
                className="bg-red-950/90 hover:bg-red-900 text-[9px] font-mono text-red-200 px-2 py-0.5 rounded border border-red-700/80 transition-colors flex items-center gap-1"
                title="Test Loitering Detection Alert Event"
              >
                <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                Trigger Alert
              </button>
            </div>

            <div className="bg-black/85 px-2 py-0.5 rounded border border-white/10 text-[9px] font-mono text-slate-300">
              {feedMode === "backend" && telemetry
                ? `Tracked: ${telemetry.trackedPersons} | Loitering: ${telemetry.loiteringPersons}`
                : `Dwell Timer: ${dwellTimer.toFixed(1)}s`}
            </div>
          </div>
        </>
      )}

      {/* Focus border accent */}
      {isFocused && (
        <div className="absolute inset-0 pointer-events-none border border-cyan-400/60" />
      )}
    </div>
  );
}

export default CameraStreamView;
