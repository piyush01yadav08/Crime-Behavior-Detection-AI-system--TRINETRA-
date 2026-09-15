import React, { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge, { RiskScoreBadge } from "../ui/Badge";
import CameraStreamView from "../camera/CameraStreamView";
import { CAMERAS_DATA } from "../../data/cameras";
import {
  ShieldAlert,
  Clock,
  MapPin,
  Camera,
  CheckCircle,
  AlertTriangle,
  Send,
  FileCheck,
  UserCheck,
} from "lucide-react";

export function AlertDetailModal({
  isOpen,
  onClose,
  alert,
  onStatusChange,
}) {
  const [operatorNotes, setOperatorNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!alert) return null;

  const cameraObj = CAMERAS_DATA.find((c) => c.id === alert.camera) || CAMERAS_DATA[0];

  const handleAction = (newStatus) => {
    setIsSubmitting(true);
    setTimeout(() => {
      onStatusChange(alert.id, newStatus, operatorNotes);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Alert Dossier: ${alert.id}`}
      subtitle={`${alert.behavior} • Logged at ${alert.timeFormatted}`}
      maxWidth="max-w-4xl"
      footer={
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Status:</span>
            <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {alert.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {alert.status !== "ACKNOWLEDGED" && alert.status !== "RESOLVED" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAction("ACKNOWLEDGED")}
                disabled={isSubmitting}
              >
                Acknowledge
              </Button>
            )}

            {alert.status !== "ESCALATED" && alert.status !== "RESOLVED" && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleAction("ESCALATED")}
                disabled={isSubmitting}
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
              >
                Escalate to Security
              </Button>
            )}

            {alert.status !== "RESOLVED" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAction("RESOLVED")}
                disabled={isSubmitting}
                icon={<CheckCircle className="w-3.5 h-3.5" />}
              >
                Resolve Incident
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Ethical AI Disclaimer Banner */}
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">TRINETRA Ethical AI Notice</p>
            <p className="text-[11px] text-cyan-200/80 mt-0.5 leading-relaxed">
              TRINETRA identifies abnormal human behavior patterns and kinetic anomalies. The system does <strong>NOT</strong> make legal determinations or assess criminal guilt. All alerts require human operator evaluation.
            </p>
          </div>
        </div>

        {/* Top Grid: Snapshot & Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left: CCTV Snapshot Preview */}
          <div className="md:col-span-7 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Forensic Incident Stream Snapshot
            </span>
            <div className="aspect-video rounded-xl overflow-hidden border border-cyan-500/40 relative shadow-lg">
              <CameraStreamView camera={cameraObj} isFocused={true} />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-cyan-300 border border-white/10">
                FRAME CAPTURE @ {alert.timeFormatted}
              </div>
            </div>
          </div>

          {/* Right: Risk Matrix & Event Metadata */}
          <div className="md:col-span-5 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assessment Matrix
            </span>

            <div className="p-4 rounded-xl bg-[#091122] border border-[#16274a] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Severity Level:</span>
                <Badge
                  variant={
                    alert.severity === "CRITICAL"
                      ? "critical"
                      : alert.severity === "HIGH"
                      ? "high"
                      : alert.severity === "MEDIUM"
                      ? "medium"
                      : "low"
                  }
                  size="sm"
                >
                  {alert.severity}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Calculated Risk Score:</span>
                <span className="text-xl font-bold font-mono text-orange-400">
                  {alert.riskScore} / 100
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Camera Source:</span>
                <span className="text-xs font-mono font-semibold text-white">
                  {alert.camera} ({alert.cameraName})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Location:</span>
                <span className="text-xs text-slate-200 text-right truncate max-w-[150px]">
                  {alert.location}
                </span>
              </div>

              {alert.personId && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">DeepSORT ID:</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {alert.personId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Incident Narrative & Trajectory Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#091122] border border-[#16274a] space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              AI Incident Narrative
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {alert.description}
            </p>
            {alert.tags && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {alert.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#101e3b] text-cyan-300 border border-cyan-500/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#091122] border border-[#16274a] space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Recommended Operator SOP Action
            </h4>
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-200 leading-relaxed">
              {alert.recommendedAction}
            </div>
          </div>
        </div>

        {/* Behavioral Trajectory Timeline */}
        {alert.trajectory && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Chronological Movement Trajectory
            </h4>
            <div className="space-y-1.5">
              {alert.trajectory.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 rounded-lg bg-[#070d1a] border border-[#132039] text-xs"
                >
                  <span className="font-mono text-cyan-400 font-semibold shrink-0">
                    {step.time}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span className="text-slate-300">{step.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operator Resolution Notes Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400">
            Operator Action Log & Resolution Notes
          </label>
          <textarea
            rows="2"
            value={operatorNotes}
            onChange={(e) => setOperatorNotes(e.target.value)}
            placeholder="Document operator actions taken, verified false alarm reason, or security team dispatch confirmation..."
            className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#17274a] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>
    </Modal>
  );
}

export default AlertDetailModal;
