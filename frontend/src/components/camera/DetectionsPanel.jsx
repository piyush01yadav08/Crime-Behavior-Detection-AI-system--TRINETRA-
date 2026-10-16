import React, { useState, useEffect } from "react";
import { Car, UserCheck, ShieldAlert, AlertTriangle, Users, Lock, ArrowRight, Clock, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { streamService } from "../../services/streamService";

/**
 * DetectionsPanel Component
 * Displays live AI detection telemetry for hardware camera CAM-02,
 * or calibrated surveillance statistics for other nodes.
 */
export function DetectionsPanel({ camera }) {
  const [telemetry, setTelemetry] = useState(null);

  const isLiveHardwareCam = camera?.id === "CAM-02";

  useEffect(() => {
    if (!isLiveHardwareCam) {
      setTelemetry(null);
      return;
    }

    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const data = await streamService.getTelemetry();
        if (isMounted && data) {
          setTelemetry(data);
        }
      } catch (e) {
        // fallback
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLiveHardwareCam, camera?.id]);

  const defaultDetections = camera?.detections || {
    vehicles: 12,
    pedestrians: 8,
    helmetViolations: 1,
    suspiciousActivity: 0,
    trackedPersons: 6,
    restrictedViolations: 0,
  };

  const detections = {
    vehicles: isLiveHardwareCam && telemetry ? (telemetry.detectedVehicles ?? 0) : defaultDetections.vehicles,
    pedestrians: isLiveHardwareCam && telemetry ? (telemetry.detectedPersons ?? 0) : defaultDetections.pedestrians,
    helmetViolations: defaultDetections.helmetViolations,
    suspiciousActivity: isLiveHardwareCam && telemetry ? (telemetry.suspiciousActivity ?? 0) : defaultDetections.suspiciousActivity,
    loiteringCount: isLiveHardwareCam && telemetry ? (telemetry.loiteringPersons ?? 0) : (defaultDetections.loiteringCount ?? 1),
    trackedPersons: isLiveHardwareCam && telemetry ? (telemetry.trackedPersons ?? 0) : (defaultDetections.trackedPersons || 6),
    cumulativeTracked: isLiveHardwareCam && telemetry ? (telemetry.cumulativeTrackedPersons ?? 0) : null,
    restrictedViolations: defaultDetections.restrictedViolations || 0,
  };

  const items = [
    {
      label: "Vehicles",
      count: detections.vehicles,
      icon: Car,
      iconColor: isLiveHardwareCam && detections.vehicles > 0 ? "text-cyan-400" : "text-slate-400",
      isLive: isLiveHardwareCam,
    },
    {
      label: "Pedestrians",
      count: detections.pedestrians,
      icon: Users,
      iconColor: isLiveHardwareCam && detections.pedestrians > 0 ? "text-cyan-400" : "text-slate-400",
      isLive: isLiveHardwareCam,
    },
    {
      label: "Tracked Persons",
      count: detections.trackedPersons,
      subInfo: detections.cumulativeTracked !== null ? `${detections.cumulativeTracked} total` : null,
      icon: UserCheck,
      iconColor: isLiveHardwareCam && detections.trackedPersons > 0 ? "text-cyan-400" : "text-cyan-400/90",
      isLive: isLiveHardwareCam,
    },
    {
      label: "Loitering Incidents",
      count: detections.loiteringCount,
      icon: Clock,
      iconColor: detections.loiteringCount > 0 ? "text-amber-400" : "text-slate-500",
      isLive: isLiveHardwareCam,
    },
    {
      label: "Suspicious Activity",
      count: detections.suspiciousActivity,
      icon: AlertTriangle,
      iconColor: detections.suspiciousActivity > 0 ? "text-orange-400" : "text-slate-500",
      isLive: isLiveHardwareCam,
    },
    {
      label: "Helmet Violations",
      count: detections.helmetViolations,
      icon: ShieldAlert,
      iconColor: detections.helmetViolations > 0 ? "text-amber-400" : "text-slate-500",
      isLive: false,
    },
    {
      label: "Restricted Zone Breaches",
      count: detections.restrictedViolations,
      icon: Lock,
      iconColor: detections.restrictedViolations > 0 ? "text-red-400" : "text-slate-500",
      isLive: false,
    },
  ];

  return (
    <div className="bg-[#070c18]/80 rounded-xl border border-slate-800/80 p-3.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
            AI Detections
          </h3>
          {isLiveHardwareCam ? (
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
              <Radio className="w-2 h-2 animate-pulse text-emerald-400" />
              LIVE TELEMETRY
            </span>
          ) : (
            <span className="text-slate-400 text-[10px] font-normal lowercase">(telemetry)</span>
          )}
        </div>
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
                {item.subInfo && (
                  <span className="text-[10px] font-mono text-slate-400">
                    ({item.subInfo})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono text-xs font-medium transition-all ${
                  item.isLive && item.count > 0 ? "text-cyan-300 font-bold" : "text-slate-200"
                }`}>
                  {item.count}
                </span>
                {item.isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-ping inline-block" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DetectionsPanel;
