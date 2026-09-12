import React, { useState, useRef } from "react";
import CameraStreamView from "../camera/CameraStreamView";
import { MousePointer, RotateCcw } from "lucide-react";

/**
 * LiveSphere Component
 * Refined, sophisticated 3D surveillance sphere dome.
 * High information clarity, minimal glow, restrained typography, and responsive drag rotation.
 */
export function LiveSphere({
  cameras,
  selectedCamera,
  onSelectCamera,
}) {
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setRotationY((prev) => prev + deltaX * 0.22);
    setRotationX((prev) => {
      const next = prev - deltaY * 0.12;
      return Math.max(-22, Math.min(22, next));
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetRotation = () => {
    setRotationX(0);
    setRotationY(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-[580px] rounded-2xl bg-[#060a14] border border-slate-800/80 flex items-center justify-center overflow-hidden select-none transition-all duration-200 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* Very faint background celestial grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1a2642_1px,transparent_1px)] [background-size:28px_28px] opacity-15 pointer-events-none" />

      {/* Subtle hairline orbital rings */}
      <div className="absolute w-[530px] h-[530px] rounded-full border border-cyan-500/15 pointer-events-none" />
      <div className="absolute w-[580px] h-[580px] rounded-full border border-slate-700/20 pointer-events-none" />
      <div className="absolute w-[470px] h-[470px] rounded-full border border-slate-700/20 pointer-events-none" />

      {/* Restrained Cardinal Direction Markers */}
      {/* North */}
      <div className="absolute top-4 flex flex-col items-center gap-1 z-20 pointer-events-none">
        <div className="w-6 h-6 rounded-full bg-[#070d1a] border border-slate-700/80 flex items-center justify-center">
          <span className="text-[10px] font-mono font-medium text-cyan-400">N</span>
        </div>
      </div>

      {/* South */}
      <div className="absolute bottom-12 flex flex-col items-center gap-1 z-20 pointer-events-none">
        <div className="w-6 h-6 rounded-full bg-[#070d1a] border border-slate-700/80 flex items-center justify-center">
          <span className="text-[10px] font-mono font-medium text-cyan-400">S</span>
        </div>
      </div>

      {/* West */}
      <div className="absolute left-5 flex items-center gap-1 z-20 pointer-events-none">
        <div className="w-6 h-6 rounded-full bg-[#070d1a] border border-slate-700/80 flex items-center justify-center">
          <span className="text-[10px] font-mono font-medium text-cyan-400">W</span>
        </div>
      </div>

      {/* East */}
      <div className="absolute right-5 flex items-center gap-1 z-20 pointer-events-none">
        <div className="w-6 h-6 rounded-full bg-[#070d1a] border border-slate-700/80 flex items-center justify-center">
          <span className="text-[10px] font-mono font-medium text-cyan-400">E</span>
        </div>
      </div>

      {/* 3D Sphere Canvas Container */}
      <div
        className="relative w-[480px] h-[480px] rounded-full flex items-center justify-center transition-transform duration-75"
        style={{
          transform: `perspective(1000px) rotateX(${rotationX}deg) rotateY(${rotationY * 0.14}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Subtle sphere contour line */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/25 pointer-events-none z-10" />
        <div className="absolute inset-x-6 top-[28%] bottom-[28%] rounded-full border border-slate-700/20 pointer-events-none" />
        <div className="absolute inset-y-6 left-[28%] right-[28%] rounded-full border border-slate-700/20 pointer-events-none" />

        {/* Camera Tiles Layout */}
        <div className="relative w-full h-full p-5 flex flex-col justify-between z-0">
          {/* Top Row: CAM-12, CAM-01, CAM-03 */}
          <div className="flex justify-center items-center gap-2.5">
            {["CAM-12", "CAM-01", "CAM-03"].map((camId) => {
              const cam = cameras.find((c) => c.id === camId) || cameras[0];
              const isSelected = selectedCamera?.id === cam.id;
              return (
                <div
                  key={cam.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCamera(cam);
                  }}
                  className={`w-32 h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 relative ${
                    isSelected
                      ? "ring-1.5 ring-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)] z-20"
                      : "opacity-75 hover:opacity-95 border border-slate-800"
                  }`}
                  style={{
                    transform: `perspective(600px) rotateX(12deg) ${
                      camId === "CAM-12" ? "rotateY(8deg)" : camId === "CAM-03" ? "rotateY(-8deg)" : ""
                    }`,
                  }}
                >
                  <CameraStreamView camera={cam} minimal={true} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 py-1 flex items-center justify-between">
                    <span className="text-[9.5px] font-mono text-slate-200 truncate">
                      {cam.shortName}
                    </span>
                    <span className="text-[8.5px] font-mono text-slate-400">
                      {cam.id.replace("CAM-", "")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Middle Row: CAM-07, CAM-02 (Featured Center), CAM-05 */}
          <div className="flex justify-center items-center gap-3 z-10">
            {/* Left Mid: CAM-07 */}
            {(() => {
              const cam = cameras.find((c) => c.id === "CAM-07") || cameras[0];
              const isSelected = selectedCamera?.id === cam.id;
              return (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCamera(cam);
                  }}
                  className={`w-34 h-24 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 relative ${
                    isSelected
                      ? "ring-1.5 ring-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)] z-20"
                      : "opacity-80 hover:opacity-95 border border-slate-800"
                  }`}
                  style={{ transform: "perspective(600px) rotateY(12deg)" }}
                >
                  <CameraStreamView camera={cam} minimal={true} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 py-1 flex items-center justify-between">
                    <span className="text-[9.5px] font-mono text-slate-200 truncate">
                      {cam.shortName}
                    </span>
                    <span className="text-[8.5px] font-mono text-slate-400">{cam.id.replace("CAM-", "")}</span>
                  </div>
                </div>
              );
            })()}

            {/* Center Featured Camera Tile: Selected Camera */}
            {(() => {
              const cam =
                cameras.find((c) => c.id === (selectedCamera?.id || "CAM-02")) ||
                cameras[0];
              return (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCamera(cam);
                  }}
                  className="w-44 h-32 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.35)] scale-105 z-30 relative"
                >
                  <CameraStreamView camera={cam} minimal={true} isFocused={true} />

                  {/* Clean LIVE pill */}
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded bg-red-600/90 text-white font-mono text-[8.5px] font-semibold flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>

                  {/* Clean Name & Location footer */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2">
                    <span className="text-[11px] font-medium text-white block truncate leading-none">
                      {cam.shortName}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-300/90 mt-0.5 block">
                      {cam.id}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Right Mid: CAM-05 */}
            {(() => {
              const cam = cameras.find((c) => c.id === "CAM-05") || cameras[0];
              const isSelected = selectedCamera?.id === cam.id;
              return (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCamera(cam);
                  }}
                  className={`w-34 h-24 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 relative ${
                    isSelected
                      ? "ring-1.5 ring-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)] z-20"
                      : "opacity-80 hover:opacity-95 border border-slate-800"
                  }`}
                  style={{ transform: "perspective(600px) rotateY(-12deg)" }}
                >
                  <CameraStreamView camera={cam} minimal={true} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 py-1 flex items-center justify-between">
                    <span className="text-[9.5px] font-mono text-slate-200 truncate">
                      {cam.shortName}
                    </span>
                    <span className="text-[8.5px] font-mono text-slate-400">{cam.id.replace("CAM-", "")}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bottom Row: CAM-16, CAM-09, CAM-14 */}
          <div className="flex justify-center items-center gap-2.5">
            {["CAM-16", "CAM-09", "CAM-14"].map((camId) => {
              const cam = cameras.find((c) => c.id === camId) || cameras[0];
              const isSelected = selectedCamera?.id === cam.id;
              return (
                <div
                  key={cam.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCamera(cam);
                  }}
                  className={`w-32 h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 relative ${
                    isSelected
                      ? "ring-1.5 ring-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)] z-20"
                      : "opacity-75 hover:opacity-95 border border-slate-800"
                  }`}
                  style={{
                    transform: `perspective(600px) rotateX(-12deg) ${
                      camId === "CAM-16" ? "rotateY(8deg)" : camId === "CAM-14" ? "rotateY(-8deg)" : ""
                    }`,
                  }}
                >
                  <CameraStreamView camera={cam} minimal={true} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 py-1 flex items-center justify-between">
                    <span className="text-[9.5px] font-mono text-slate-200 truncate">
                      {cam.shortName}
                    </span>
                    <span className="text-[8.5px] font-mono text-slate-400">
                      {cam.id.replace("CAM-", "")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Refined Bottom Guidance Bar */}
      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2.5 pointer-events-auto z-20">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#080d1a]/80 border border-slate-800 backdrop-blur-sm">
          <MousePointer className="w-3 h-3 text-cyan-400/80" />
          <span className="text-[11px] text-slate-400">
            Click and drag to rotate the sphere
          </span>
        </div>

        {(rotationX !== 0 || rotationY !== 0) && (
          <button
            onClick={resetRotation}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#080d1a] border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-mono transition-colors"
            title="Reset Sphere Alignment"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default LiveSphere;
