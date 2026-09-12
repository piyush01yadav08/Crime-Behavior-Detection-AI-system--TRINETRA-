import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { UserCheck, Compass, Activity, ArrowUpRight } from "lucide-react";

export function TrackObjectModal({ isOpen, onClose, camera }) {
  if (!camera) return null;

  const targets = [
    {
      id: "TRK-104",
      type: "Pedestrian (Hostile Vector)",
      confidence: "98.1%",
      speed: "2.8 m/s",
      bearing: "142° SE",
      status: "ACTIVE_TRACK",
      risk: "HIGH",
    },
    {
      id: "TRK-102",
      type: "Pedestrian (Converging)",
      confidence: "96.4%",
      speed: "1.4 m/s",
      bearing: "315° NW",
      status: "ACTIVE_TRACK",
      risk: "MEDIUM",
    },
    {
      id: "VEH-012",
      type: "White Sedan",
      confidence: "94.2%",
      speed: "24.5 km/h",
      bearing: "0° N",
      status: "LANE_TRANSIT",
      risk: "LOW",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="DeepSORT Object Tracking Telemetry"
      subtitle={`Active Optical Pipeline on ${camera.name}`}
      maxWidth="max-w-2xl"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Dismiss
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-cyan-300 font-medium">
              Kalman Filter & Feature Extractor Running
            </span>
          </div>
          <span className="font-mono text-slate-300">Latency: 14ms</span>
        </div>

        <div className="space-y-2">
          {targets.map((target) => (
            <div
              key={target.id}
              className="p-3 rounded-xl bg-[#091122] border border-[#16274a] flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {target.id}
                  </span>
                  <span className="text-xs text-slate-400">
                    {target.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-slate-400">
                  <span>Confidence: <span className="text-cyan-300">{target.confidence}</span></span>
                  <span>•</span>
                  <span>Speed: <span className="text-white">{target.speed}</span></span>
                  <span>•</span>
                  <span>Bearing: <span className="text-white">{target.bearing}</span></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={target.risk === "HIGH" ? "high" : target.risk === "MEDIUM" ? "medium" : "low"}
                  size="xs"
                >
                  {target.risk}
                </Badge>
                <button
                  onClick={() => alert(`Tracking locked onto ${target.id}. Cross-camera handoff initialized.`)}
                  className="p-1.5 rounded-lg bg-[#0e1933] border border-[#1d325c] text-cyan-400 hover:text-white hover:border-cyan-400 transition-colors"
                  title="Lock Subject"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default TrackObjectModal;
