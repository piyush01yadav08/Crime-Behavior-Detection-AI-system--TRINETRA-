import React from "react";
import { ACTIVITY_FEED } from "../../data/activity";

export function LiveActivityFeed({ onSelectEvent = null }) {
  const getDotColor = (level) => {
    switch (level) {
      case "CRITICAL":
        return "bg-red-400";
      case "HIGH":
        return "bg-orange-400";
      case "MEDIUM":
        return "bg-amber-400";
      default:
        return "bg-emerald-400";
    }
  };

  return (
    <div className="bg-[#070c18]/80 rounded-xl border border-slate-800/80 p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Recent Surveillance Events
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          EVENT LOG
        </span>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {ACTIVITY_FEED.map((event) => (
          <div
            key={event.id}
            onClick={() => onSelectEvent && onSelectEvent(event)}
            className="flex items-center justify-between gap-3 p-2 rounded-lg bg-[#080d1a] hover:bg-[#0c1428] border border-slate-800/70 hover:border-slate-700 cursor-pointer transition-colors text-xs"
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor(event.riskLevel)}`} />
              <div className="truncate">
                <span className="font-normal text-slate-200">
                  {event.eventType}
                </span>
                <span className="text-[10px] font-mono text-slate-400 ml-1.5">
                  [{event.camera}]
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-slate-400">
                {event.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiveActivityFeed;
