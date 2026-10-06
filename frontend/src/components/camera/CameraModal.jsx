import React, { useState } from "react";
import Modal from "../ui/Modal";
import CameraStreamView from "./CameraStreamView";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { ZoomIn, ZoomOut, Volume2, VolumeX, Camera, ShieldAlert, Cpu, Maximize } from "lucide-react";

export function CameraModal({
  isOpen,
  onClose,
  camera,
  mode = "fullscreen", // "fullscreen" or "focus"
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  if (!camera) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${camera.name} (${camera.id})`}
      subtitle={`${camera.location} • ${camera.resolution} @ ${camera.fps} FPS`}
      maxWidth="max-w-5xl"
      footer={
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Bitrate: {camera.bitrate}</span>
            <span>•</span>
            <span>Uptime: {camera.uptime}</span>
            <span>•</span>
            <span>Codec: {camera.codec}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const popWin = window.open(
                  "",
                  `TRINETRA_${camera.id}`,
                  "width=960,height=600,menubar=no,toolbar=no,location=no,status=no"
                );
                if (popWin) {
                  popWin.document.title = `TRINETRA LIVE POP-OUT - ${camera.name}`;
                  popWin.document.body.style.margin = "0";
                  popWin.document.body.style.background = "#050811";
                  popWin.document.body.style.color = "#ffffff";
                  popWin.document.body.style.fontFamily = "monospace";
                  popWin.document.body.style.display = "flex";
                  popWin.document.body.style.flexDirection = "column";
                  popWin.document.body.style.alignItems = "center";
                  popWin.document.body.style.justifyContent = "center";
                  popWin.document.body.style.height = "100vh";
                  popWin.document.body.innerHTML = `
                    <div style="width:100%;max-width:900px;padding:20px;box-sizing:border-box;">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:8px;">
                        <div>
                          <h2 style="margin:0;font-size:16px;color:#00e5ff;">${camera.name} [${camera.id}]</h2>
                          <p style="margin:4px 0 0 0;font-size:11px;color:#94a3b8;">${camera.location} • ${camera.resolution} @ ${camera.fps} FPS</p>
                        </div>
                        <span style="background:#ef4444;color:white;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold;">● LIVE FEED</span>
                      </div>
                      <div style="background:#020617;border:1px solid #00e5ff50;border-radius:12px;height:480px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;">
                        <div style="font-size:18px;color:#38bdf8;margin-bottom:8px;">SURVEILLANCE STREAM ACTIVE</div>
                        <div style="font-size:12px;color:#64748b;">Bitrate: ${camera.bitrate} • Codec: ${camera.codec} • Uptime: ${camera.uptime}</div>
                        <div style="position:absolute;bottom:12px;left:16px;font-size:11px;color:#00e5ff;">TRINETRA AI SYSTEM // DEEPSORT TRACKING</div>
                      </div>
                    </div>
                  `;
                }
              }}
            >
              Pop-out Window ↗
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Feed
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Stream View Container */}
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-cyan-500/40 bg-black shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <div
            className="w-full h-full transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <CameraStreamView camera={camera} isFocused={true} />
          </div>

          {/* Controls Bar Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-cyan-300 px-1">
                {zoomLevel.toFixed(1)}x
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            {/* Stream Audio Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                title={isMuted ? "Unmute Environmental Mic" : "Mute Mic"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={() => alert(`Snapshot captured for ${camera.id} and saved to operator forensic log.`)}
                className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                title="Capture Forensic Snapshot"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* AI Bounding Box Toggle */}
            <button
              onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                showBoundingBoxes
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              AI HUD: {showBoundingBoxes ? "ENABLED" : "OFF"}
            </button>
          </div>
        </div>

        {/* Camera Details & Active AI Detections Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#0a1224] border border-[#172748]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Tracked Persons
            </span>
            <p className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
              {camera.detections?.trackedPersons || 4}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#0a1224] border border-[#172748]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Vehicle Count
            </span>
            <p className="text-lg font-bold font-mono text-white mt-0.5">
              {camera.detections?.vehicles || 0}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#0a1224] border border-[#172748]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Optical Latency
            </span>
            <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              42 ms
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#0a1224] border border-[#172748]">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              AI Risk Index
            </span>
            <p className="text-lg font-bold font-mono text-orange-400 mt-0.5">
              {camera.activeAlert ? `${camera.activeAlert.riskScore}/100` : "NORMAL"}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default CameraModal;
