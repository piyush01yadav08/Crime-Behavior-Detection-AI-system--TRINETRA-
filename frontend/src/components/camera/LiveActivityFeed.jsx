import React, { useState, useEffect } from "react";
import { ACTIVITY_FEED } from "../../data/activity";
import { alertService } from "../../services/alertService";
import { streamService } from "../../services/streamService";

export function LiveActivityFeed({ onSelectEvent = null }) {
  const [feedEvents, setFeedEvents] = useState(ACTIVITY_FEED);

  useEffect(() => {
    let isMounted = true;

    const syncFeed = async () => {
      try {
        const liveAlerts = await alertService.getAlerts();
        const telemetry = await streamService.getTelemetry();

        if (!isMounted) return;

        const liveEvents = [];

        // If there's live telemetry with subjects on webcam CAM-02
        if (telemetry && telemetry.loiteringPersons > 0) {
          liveEvents.push({
            id: `telemetry-loiter-${Date.now()}`,
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            camera: "CAM-02",
            cameraName: "Live Webcam",
            eventType: `Loitering In Progress (${telemetry.loiteringPersons} subject)`,
            description: "Active dwell time threshold exceeded in live camera frame.",
            riskLevel: "HIGH",
            riskScore: 85,
            personId: telemetry.subjects?.[0]?.track_id ? `TRK-${telemetry.subjects[0].track_id}` : "ACTIVE",
            isLiveSync: true,
          });
        }

        // Map live alerts to feed events
        if (Array.isArray(liveAlerts)) {
          liveAlerts.forEach((a) => {
            liveEvents.push({
              id: `alert-feed-${a.id}`,
              time: a.timeFormatted || a.timestamp || "Now",
              camera: a.camera || "CAM-02",
              cameraName: a.cameraName || a.camera,
              eventType: a.behavior || "Surveillance Anomaly",
              description: a.description || "",
              riskLevel: a.severity || "MEDIUM",
              riskScore: a.riskScore || 60,
              personId: a.personId || "N/A",
              isLiveSync: true,
            });
          });
        }

        // Merge: live events at top, then unique fallback activity items
        const seenIds = new Set();
        const merged = [];

        for (const item of [...liveEvents, ...ACTIVITY_FEED]) {
          const key = `${item.camera}-${item.eventType}-${item.time}`;
          if (!seenIds.has(key)) {
            seenIds.add(key);
            merged.push(item);
          }
        }

        setFeedEvents(merged.slice(0, 20));
      } catch (e) {
        // Fall back gracefully
      }
    };

    syncFeed();
    const interval = setInterval(syncFeed, 2500);
    const unsubscribe = alertService.subscribe(() => syncFeed());

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

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
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Live Surveillance Events
          </h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 font-medium">
          LIVE FEED
        </span>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {feedEvents.map((event) => (
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
                {event.isLiveSync && (
                  <span className="ml-1.5 text-[9px] font-mono font-bold text-cyan-400 uppercase">
                    • live
                  </span>
                )}
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
