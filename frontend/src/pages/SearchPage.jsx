import React, { useState } from "react";
import { PERSONS_DATA } from "../data/persons";
import { CAMERAS_DATA } from "../data/cameras";
import { ALERTS_DATA } from "../data/alerts";
import SearchInput from "../components/ui/SearchInput";
import Badge, { RiskScoreBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { Link } from "react-router-dom";
import {
  Search,
  User,
  Video,
  ShieldAlert,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  Filter,
} from "lucide-react";

export function SearchPage() {
  const [query, setQuery] = useState("TRK-102");
  const [categoryFilter, setCategoryFilter] = useState("ALL"); // ALL, PERSONS, CAMERAS, ALERTS

  const q = query.trim().toLowerCase();

  // Search across persons
  const matchedPersons = PERSONS_DATA.filter((p) => {
    if (!q) return true;
    return (
      p.trackingId.toLowerCase().includes(q) ||
      p.lastSeenCamera.toLowerCase().includes(q) ||
      p.lastSeenLocation.toLowerCase().includes(q) ||
      p.appearance.toLowerCase().includes(q)
    );
  });

  // Search across cameras
  const matchedCameras = CAMERAS_DATA.filter((c) => {
    if (!q) return true;
    return (
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.zone.toLowerCase().includes(q)
    );
  });

  // Search across alerts
  const matchedAlerts = ALERTS_DATA.filter((a) => {
    if (!q) return true;
    return (
      a.id.toLowerCase().includes(q) ||
      a.behavior.toLowerCase().includes(q) ||
      a.camera.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      (a.personId && a.personId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-[#14223d]">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-wide text-white">
            Global Surveillance Intelligence Search
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            INDEXED DATABASE
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Query tracking IDs (e.g. TRK-102), cameras (CAM-02), incident codes (TR-1042), or locations
        </p>
      </div>

      {/* Search Input Bar with Category Filters */}
      <div className="glass-panel p-5 rounded-2xl border border-[#16274a] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Type person ID (TRK-102), camera (CAM-02), alert ID, or location..."
            className="flex-1"
          />

          <div className="flex items-center gap-1.5 p-1 bg-[#0a1224] rounded-xl border border-[#182a4d]">
            {["ALL", "PERSONS", "CAMERAS", "ALERTS"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter === cat
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Search Tag Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Queries:</span>
          {["TRK-102", "CAM-02", "TR-1042", "East Warehouse", "Aggressive Interaction", "Loitering"].map((term) => (
            <button
              key={term}
              onClick={() => setQuery(term)}
              className="px-2.5 py-1 rounded-lg bg-[#0d172e] border border-[#1b2f57] text-cyan-300 hover:border-cyan-400 text-xs font-mono transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {/* Tracked Persons Dossiers */}
        {(categoryFilter === "ALL" || categoryFilter === "PERSONS") && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Tracked Subject Dossiers ({matchedPersons.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchedPersons.map((person) => (
                <div
                  key={person.trackingId}
                  className="glass-panel p-4 rounded-2xl border border-[#16274a] space-y-3 hover:border-cyan-500/40 transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-mono font-bold text-white">
                          {person.trackingId}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({person.label})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {person.appearance}
                      </p>
                    </div>

                    <Badge
                      variant={
                        person.riskLevel === "CRITICAL"
                          ? "critical"
                          : person.riskLevel === "HIGH"
                          ? "high"
                          : person.riskLevel === "MEDIUM"
                          ? "medium"
                          : "low"
                      }
                      size="sm"
                    >
                      {person.riskLevel}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#070d1c] p-2.5 rounded-xl border border-[#132039]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">LAST SEEN CAMERA:</span>
                      <span className="text-cyan-300 font-bold">{person.lastSeenCamera}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">LAST SEEN TIME:</span>
                      <span className="text-slate-200">{person.lastSeenTime}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[10px]">LOCATION:</span>
                      <span className="text-white truncate block">{person.lastSeenLocation}</span>
                    </div>
                  </div>

                  {/* Trajectory Timeline Preview */}
                  {person.trajectoryPath && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                        Observed Trajectory Path
                      </span>
                      {person.trajectoryPath.map((t, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-[11px] text-slate-300"
                        >
                          <span className="font-mono text-cyan-400 font-semibold">{t.time}</span>
                          <span className="text-slate-600">•</span>
                          <span className="font-mono text-white">{t.camera}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 truncate">{t.event}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-[#142340]">
                    <span className="text-[11px] font-mono text-slate-400">
                      Confidence: {person.detectionConfidence}
                    </span>
                    <Link
                      to="/dashboard"
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                    >
                      <span>Track on Feed</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Camera Feeds Results */}
        {(categoryFilter === "ALL" || categoryFilter === "CAMERAS") && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Surveillance Camera Nodes ({matchedCameras.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {matchedCameras.map((cam) => (
                <div
                  key={cam.id}
                  className="p-3.5 rounded-xl bg-[#091122] border border-[#16274a] flex items-center justify-between hover:border-cyan-500/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">
                        {cam.id}
                      </span>
                      <span className="text-xs text-slate-300">
                        {cam.shortName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
                      {cam.location}
                    </p>
                  </div>

                  <Link
                    to="/dashboard"
                    className="p-2 rounded-lg bg-[#0e1933] border border-[#1c2e55] text-cyan-400 hover:text-white transition-colors"
                    title="View Stream"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Results */}
        {(categoryFilter === "ALL" || categoryFilter === "ALERTS") && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Historical & Active Alerts ({matchedAlerts.length})
              </h3>
            </div>

            <div className="space-y-2">
              {matchedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl bg-[#091122] border border-[#16274a] flex items-center justify-between hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-cyan-400 text-xs">
                      {alert.id}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {alert.behavior}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {alert.camera} • {alert.location} • {alert.timeFormatted}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-orange-400">
                      Risk {alert.riskScore}
                    </span>
                    <Badge variant={alert.severity === "CRITICAL" ? "critical" : alert.severity === "HIGH" ? "high" : "medium"} size="xs">
                      {alert.severity}
                    </Badge>
                    <Link
                      to={`/alerts?id=${alert.id}`}
                      className="text-cyan-400 hover:underline text-xs font-mono"
                    >
                      Dossier &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
