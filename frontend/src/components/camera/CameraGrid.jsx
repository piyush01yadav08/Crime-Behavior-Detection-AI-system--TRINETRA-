import React from "react";
import CameraStreamView from "./CameraStreamView";
import { Maximize2 } from "lucide-react";

/**
 * CameraGrid Component
 * Multi-camera surveillance wall view (alternative to 3D Sphere).
 * Clean, restrained, professional.
 */
export function CameraGrid({
  cameras,
  selectedCamera,
  onSelectCamera,
  onOpenFocusModal,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
      {cameras.map((cam) => {
        const isSelected = selectedCamera?.id === cam.id;
        const isAlert = cam.status === "ALERT";

        return (
          <div
            key={cam.id}
            onClick={() => onSelectCamera(cam)}
            className={`bg-[#070c18] rounded-xl overflow-hidden cursor-pointer transition-all duration-150 relative ${
              isSelected
                ? "ring-1.5 ring-cyan-400"
                : isAlert
                ? "border border-red-500/30"
                : "border border-slate-800"
            }`}
          >
            {/* Stream View */}
            <div className="relative aspect-video">
              <CameraStreamView camera={cam} isFocused={false} minimal={true} />

              {/* Quiet status dot */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-white/10">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    cam.status === "ALERT"
                      ? "bg-red-400 animate-pulse"
                      : cam.status === "WARNING"
                      ? "bg-amber-400"
                      : cam.status === "OFFLINE"
                      ? "bg-slate-500"
                      : "bg-emerald-400"
                  }`}
                />
                <span className="text-[9.5px] font-mono text-slate-300">
                  {cam.status}
                </span>
              </div>
            </div>

            {/* Camera Footer */}
            <div className="p-2.5 bg-[#060a14] flex items-center justify-between border-t border-slate-800/80">
              <div className="truncate">
                <span className="text-xs font-medium text-slate-200 block truncate">
                  {cam.shortName}
                </span>
                <span className="text-[10px] font-mono text-slate-400 block truncate">
                  {cam.id} • {cam.location}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCamera(cam);
                  onOpenFocusModal && onOpenFocusModal(cam);
                }}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Focus Camera"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CameraGrid;
