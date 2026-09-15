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
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Feed
          </Button>
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
