import React from "react";
import { Car, UserCheck, ShieldAlert, AlertTriangle, Users, Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * DetectionsPanel Component
 * Compact, restrained detection telemetry panel.
 */
export function DetectionsPanel({ camera }) {
  const detections = camera?.detections || {
    vehicles: 12,
    pedestrians: 8,
    helmetViolations: 1,
    suspiciousActivity: 0,
    trackedPersons: 6,
    restrictedViolations: 0,
  };

  const items = [
    {
      label: "Vehicles",
      count: detections.vehicles,
      icon: Car,
      iconColor: "text-slate-400",
    },
    {
      label: "Pedestrians",
      count: detections.pedestrians,
      icon: Users,
      iconColor: "text-slate-400",
    },
    {
      label: "Helmet Violations",
      count: detections.helmetViolations,
      icon: ShieldAlert,
      iconColor: detections.helmetViolations > 0 ? "text-amber-400" : "text-slate-500",
    },
    {
      label: "Suspicious Activity",
      count: detections.suspiciousActivity,
      icon: AlertTriangle,
      iconColor: detections.suspiciousActivity > 0 ? "text-orange-400" : "text-slate-500",
    },
    {
      label: "Tracked Persons",
      count: detections.trackedPersons || 6,
      icon: UserCheck,
      iconColor: "text-cyan-400/90",
    },
    {
      label: "Restricted Zone Breaches",
      count: detections.restrictedViolations || 0,
      icon: Lock,
      iconColor: detections.restrictedViolations > 0 ? "text-red-400" : "text-slate-500",
    },
  ];

  return (
    <div className="bg-[#070c18]/80 rounded-xl border border-slate-800/80 p-3.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
          AI Detections <span className="text-slate-400 text-[10px] font-normal lowercase">(live)</span>
        </h3>
        <Link
          to="/analytics"
          className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Detections List */}
      <div className="divide-y divide-slate-800/60">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center justify-between py-1.5 text-xs"
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                <span className="text-slate-300 text-[11.5px] font-normal">
                  {item.label}
                </span>
              </div>
              <span className="font-mono text-xs font-medium text-slate-200">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DetectionsPanel;
