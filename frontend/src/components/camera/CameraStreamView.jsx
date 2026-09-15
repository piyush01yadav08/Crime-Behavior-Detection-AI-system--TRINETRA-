import React, { useState, useEffect } from "react";

/**
 * CameraStreamView Component
 * Renders an authentic, restrained surveillance video feed with subtle 
 * bounding markers and realistic CCTV aesthetics.
 */
export function CameraStreamView({ camera, isLive = true, isFocused = false, minimal = false, className = "" }) {
  const [frameTick, setFrameTick] = useState(0);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setFrameTick((prev) => (prev + 1) % 100);
    }, 400);
    return () => clearInterval(interval);
  }, [isLive]);

  const offset = Math.sin(frameTick * 0.1) * 3;

  const renderSimulatedScene = () => {
    switch (camera.previewType) {
      case "traffic":
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

            {/* Background Sky & Distant Silhouettes */}
            <rect width="640" height="200" fill="url(#roadSky)" />
            <path d="M40 200 L40 130 L90 130 L90 200 M110 200 L110 110 L170 110 L170 200 M210 200 L210 140 L260 140 L260 200 M380 200 L380 120 L440 120 L440 200 M470 200 L470 100 L530 100 L530 200 M560 200 L560 140 L610 140 L610 200" fill="#060a12" opacity="0.6"/>
            <path d="M0 200 Q320 180 640 200 L640 360 L0 360 Z" fill="url(#asphalt)" />

            {/* Road & Lanes */}
            <polygon points="280,180 360,180 580,360 60,360" fill="#0f1624" />
            <line x1="320" y1="180" x2="320" y2="360" stroke="#d97706" strokeWidth="2.5" strokeDasharray="14 14" opacity="0.5" />
            <line x1="290" y1="180" x2="160" y2="360" stroke="#253248" strokeWidth="1.5" strokeDasharray="10 10" />
            <line x1="350" y1="180" x2="480" y2="360" stroke="#253248" strokeWidth="1.5" strokeDasharray="10 10" />

            {/* Curbs */}
            <polygon points="0,200 120,200 60,360 0,360" fill="#0a1515" opacity="0.5" />
            <polygon points="520,200 640,200 640,360 580,360" fill="#0a1515" opacity="0.5" />

            {/* Vehicles on Road */}
            <g transform={`translate(${295 + offset * 0.5}, 240)`}>
              <rect x="0" y="0" width="55" height="35" rx="5" fill="#94a3b8" opacity="0.9" />
              <rect x="8" y="4" width="39" height="14" rx="2" fill="#0f172a" />
              <circle cx="10" cy="35" r="5" fill="#020617" />
              <circle cx="45" cy="35" r="5" fill="#020617" />
              <circle cx="8" cy="28" r="2.5" fill="#dc2626" />
              <circle cx="47" cy="28" r="2.5" fill="#dc2626" />
              <rect x="-3" y="-3" width="61" height="42" fill="none" stroke="#00e5ff" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
            </g>

            <g transform="translate(190, 220)">
              <rect x="0" y="0" width="48" height="32" rx="4" fill="#334155" />
              <rect x="6" y="3" width="36" height="12" rx="2" fill="#0f172a" />
              <rect x="-2" y="-2" width="52" height="36" fill="none" stroke="#00e5ff" strokeWidth="0.8" opacity="0.6" />
            </g>

            {/* Pedestrians */}
            <g transform={`translate(${140 + offset}, 250)`}>
              <circle cx="12" cy="6" r="4.5" fill="#f87171" />
              <line x1="12" y1="11" x2="12" y2="28" stroke="#f87171" strokeWidth="2.5" />
              <line x1="12" y1="28" x2="6" y2="44" stroke="#f87171" strokeWidth="2" />
              <line x1="12" y1="28" x2="18" y2="44" stroke="#f87171" strokeWidth="2" />
              <rect x="0" y="-2" width="24" height="48" fill="rgba(239, 68, 68, 0.08)" stroke="#ef4444" strokeWidth="1.2" />
              <text x="0" y="-6" fill="#ef4444" fontSize="7" fontFamily="monospace">TRK-104</text>
            </g>

            <g transform={`translate(${110 - offset * 0.5}, 252)`}>
              <circle cx="10" cy="6" r="4.5" fill="#38bdf8" />
              <line x1="10" y1="11" x2="10" y2="28" stroke="#38bdf8" strokeWidth="2.5" />
              <line x1="10" y1="28" x2="5" y2="44" stroke="#38bdf8" strokeWidth="2" />
              <line x1="10" y1="28" x2="15" y2="44" stroke="#38bdf8" strokeWidth="2" />
              <rect x="0" y="-2" width="20" height="48" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.7" />
              <text x="0" y="-6" fill="#38bdf8" fontSize="7" fontFamily="monospace">TRK-102</text>
            </g>
          </svg>
        );

      case "hallway":
      case "indoor":
        return (
          <svg viewBox="0 0 640 360" className="w-full h-full object-cover">
            <rect width="640" height="360" fill="#080d18" />
            <polygon points="0,0 640,0 420,160 220,160" fill="#0a1222" />
            <polygon points="0,360 640,360 420,240 220,240" fill="#101827" />
            <polygon points="0,0 220,160 220,240 0,360" fill="#0d1524" />
            <polygon points="640,0 420,160 420,240 640,360" fill="#0c1422" />
            <rect x="220" y="160" width="200" height="80" fill="#1a2436" />
            {/* Soft corridor lighting */}
            <line x1="280" y1="30" x2="310" y2="130" stroke="#38bdf8" strokeWidth="2" opacity="0.4" />
            <line x1="360" y1="30" x2="330" y2="130" stroke="#38bdf8" strokeWidth="2" opacity="0.4" />
            {/* Person */}
            <g transform={`translate(${270 + offset * 0.3}, 170)`}>
              <circle cx="12" cy="8" r="5" fill="#94a3b8" />
              <line x1="12" y1="14" x2="12" y2="38" stroke="#94a3b8" strokeWidth="3" />
              <line x1="12" y1="38" x2="6" y2="60" stroke="#94a3b8" strokeWidth="2.5" />
              <line x1="12" y1="38" x2="18" y2="60" stroke="#94a3b8" strokeWidth="2.5" />
              <rect x="0" y="0" width="24" height="64" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.8" />
              <text x="0" y="-4" fill="#f59e0b" fontSize="7" fontFamily="monospace">TRK-087</text>
            </g>
          </svg>
        );

      case "warehouse":
      case "backyard":
        return (
          <svg viewBox="0 0 640 360" className="w-full h-full object-cover">
            <rect width="640" height="360" fill="#050912" />
            <rect width="640" height="180" fill="#080f1e" />
            <rect y="180" width="640" height="180" fill="#0b1322" />
            <line x1="0" y1="210" x2="640" y2="210" stroke="#1f293d" strokeWidth="1.5" />
            <line x1="0" y1="230" x2="640" y2="230" stroke="#1f293d" strokeWidth="1.5" />
            {/* Restricted Area Boundary */}
            <polygon points="120,240 520,240 600,340 40,340" fill="rgba(239, 68, 68, 0.08)" stroke="#ef4444" strokeWidth="1" strokeDasharray="5 3" />
            <g transform={`translate(${300 + offset}, 230)`}>
              <circle cx="10" cy="8" r="4.5" fill="#f87171" />
              <line x1="10" y1="13" x2="10" y2="32" stroke="#f87171" strokeWidth="2.5" />
              <line x1="10" y1="32" x2="5" y2="50" stroke="#f87171" strokeWidth="2" />
              <line x1="10" y1="32" x2="15" y2="50" stroke="#f87171" strokeWidth="2" />
              <rect x="-2" y="0" width="24" height="52" fill="none" stroke="#ef4444" strokeWidth="1.2" />
              <text x="-4" y="-4" fill="#ef4444" fontSize="7" fontFamily="monospace">TRK-215</text>
            </g>
          </svg>
        );

      case "parking":
      case "gate":
      case "cafeteria":
      default:
        return (
          <svg viewBox="0 0 640 360" className="w-full h-full object-cover">
            <rect width="640" height="360" fill="#070c18" />
            <polygon points="0,180 640,180 640,360 0,360" fill="#0e1728" />
            <line x1="0" y1="180" x2="640" y2="180" stroke="#172236" strokeWidth="1.5" />
            <rect x="80" y="100" width="160" height="80" fill="#152033" />
            <rect x="400" y="80" width="180" height="100" fill="#152033" />
            <rect x="140" y="240" width="45" height="30" rx="3" fill="#334155" />
            <rect x="230" y="235" width="48" height="32" rx="3" fill="#253248" />
            <rect x="340" y="245" width="50" height="28" rx="3" fill="#334155" />
            <g transform="translate(440, 240)">
              <circle cx="8" cy="6" r="4" fill="#38bdf8" />
              <line x1="8" y1="10" x2="8" y2="26" stroke="#38bdf8" strokeWidth="2" />
              <line x1="8" y1="26" x2="4" y2="40" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="8" y1="26" x2="12" y2="40" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="0" y="0" width="16" height="42" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
            </g>
          </svg>
        );
    }
  };

  if (camera.status === "OFFLINE") {
    return (
      <div className={`relative w-full h-full bg-[#060a12] flex flex-col items-center justify-center text-slate-500 overflow-hidden ${className}`}>
        <span className="w-2.5 h-2.5 rounded-full bg-slate-600 mb-1.5" />
        <p className="text-[10px] font-mono text-slate-400">SIGNAL LOST</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-[#050811] overflow-hidden select-none ${className}`}>
      {renderSimulatedScene()}

      {/* Subtle Scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-25" />

      {/* Overlays only when not minimal */}
      {!minimal && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="text-[9px] font-mono text-slate-300 bg-black/60 px-1 rounded">
            {camera.id}
          </span>
        </div>
      )}

      {/* Focus border accent */}
      {isFocused && (
        <div className="absolute inset-0 pointer-events-none border border-cyan-400/60" />
      )}
    </div>
  );
}

export default CameraStreamView;
