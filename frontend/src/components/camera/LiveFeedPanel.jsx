import React, { useState, useEffect } from "react";
import CameraStreamView from "./CameraStreamView";
import { Maximize2, MoreHorizontal, MapPin, Clock, Video } from "lucide-react";

/**
 * LiveFeedPanel Component
 * Sophisticated, calm right-side active camera monitoring panel.
 */
export function LiveFeedPanel({ camera, onFullscreen, onOpenOptions }) {
  const [liveClock, setLiveClock] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!camera) return null;

  return (
    <div className="bg-[#070c18]/80 rounded-xl border border-slate-800/80 p-3.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
            Live Feed
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onFullscreen && onFullscreen(camera)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Expand to Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onOpenOptions && onOpenOptions(camera)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Camera Stream Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Preview Container */}
      <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 group">
        <CameraStreamView camera={camera} isFocused={false} />

        {/* Quiet overlay banner */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <div className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/10">
            <span className="text-[11px] font-mono text-white">
              {camera.name}
            </span>
          </div>

          <div className="px-1.5 py-0.2 rounded bg-red-600/90 text-white text-[9px] font-mono font-semibold flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        </div>
      </div>

      {/* Camera Telemetry & Location Metadata */}
      <div className="mt-3 space-y-1.5 text-[11px]">
        <div className="flex items-center gap-2 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-300 truncate">{camera.location}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-mono text-slate-400">{liveClock || "10:24:17 PM"}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400 font-mono text-[10.5px]">
          <Video className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex items-center gap-2 text-slate-400">
            <span>{camera.resolution}</span>
            <span className="text-slate-600">•</span>
            <span>{camera.fps} FPS</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">{camera.codec}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveFeedPanel;
