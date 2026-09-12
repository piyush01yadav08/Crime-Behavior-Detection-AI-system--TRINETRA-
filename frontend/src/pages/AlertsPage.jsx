import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ALERTS_DATA } from "../data/alerts";
import { CAMERAS_DATA } from "../data/cameras";
import AlertDetailModal from "../components/alerts/AlertDetailModal";
import Badge, { RiskScoreBadge } from "../components/ui/Badge";
import Tabs from "../components/ui/Tabs";
import SearchInput from "../components/ui/SearchInput";
import Button from "../components/ui/Button";
import {
  Bell,
  Filter,
  ShieldAlert,
  ArrowUpDown,
  CheckCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

export function AlertsPage() {
  const [searchParams] = useSearchParams();
  const [alerts, setAlerts] = useState(ALERTS_DATA);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [activeSeverity, setActiveSeverity] = useState("ALL");
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [selectedCamera, setSelectedCamera] = useState("ALL");
  const [selectedBehavior, setSelectedBehavior] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "highest-risk"

  // Open modal if id is passed in searchParams (e.g. from topbar notification)
  useEffect(() => {
    const alertIdParam = searchParams.get("id");
    if (alertIdParam) {
      const found = alerts.find((a) => a.id === alertIdParam);
      if (found) {
        setSelectedAlert(found);
        setIsModalOpen(true);
      }
    }
  }, [searchParams, alerts]);

  // Unique behaviors for filter dropdown
  const behaviors = Array.from(new Set(alerts.map((a) => a.behavior)));

  // Filter and sort alerts
  const filteredAlerts = alerts
    .filter((a) => {
      if (activeSeverity !== "ALL" && a.severity !== activeSeverity) return false;
      if (activeStatus !== "ALL" && a.status !== activeStatus) return false;
      if (selectedCamera !== "ALL" && a.camera !== selectedCamera) return false;
      if (selectedBehavior !== "ALL" && a.behavior !== selectedBehavior) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          a.id.toLowerCase().includes(q) ||
          a.behavior.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          a.camera.toLowerCase().includes(q) ||
          (a.personId && a.personId.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "highest-risk") {
        return b.riskScore - a.riskScore;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

  const handleStatusChange = (alertId, newStatus, notes) => {
    setAlerts((prev) =>
      prev.map((item) =>
        item.id === alertId
          ? {
              ...item,
              status: newStatus,
              operatorNotes: notes || item.operatorNotes,
            }
          : item
      )
    );
  };

  const severityTabs = [
    { id: "ALL", label: "All Alerts", count: alerts.length },
    {
      id: "CRITICAL",
      label: "Critical",
      count: alerts.filter((a) => a.severity === "CRITICAL").length,
    },
    {
      id: "HIGH",
      label: "High",
      count: alerts.filter((a) => a.severity === "HIGH").length,
    },
    {
      id: "MEDIUM",
      label: "Medium",
      count: alerts.filter((a) => a.severity === "MEDIUM").length,
    },
    {
      id: "LOW",
      label: "Low",
      count: alerts.filter((a) => a.severity === "LOW").length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#14223d]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wide text-white">
              Alert Triage & Incident Management
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
              {alerts.filter((a) => a.status === "NEW").length} UNRESOLVED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time behavioral anomalies flagged by YOLOv8 and kinetic movement analyzers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setSortOrder((prev) =>
                prev === "newest" ? "highest-risk" : "newest"
              )
            }
            icon={<ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />}
          >
            Sort: {sortOrder === "newest" ? "Newest First" : "Highest Risk"}
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="space-y-3">
        {/* Severity Tabs */}
        <Tabs
          tabs={severityTabs}
          activeTab={activeSeverity}
          onChange={setActiveSeverity}
        />

        {/* Dropdown filters and search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by ID, camera, location, behavior..."
          />

          {/* Camera Filter */}
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0a1122] border border-[#1b2b4b] text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Cameras</option>
            {CAMERAS_DATA.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.id} - {cam.shortName}
              </option>
            ))}
          </select>

          {/* Behavior Filter */}
          <select
            value={selectedBehavior}
            onChange={(e) => setSelectedBehavior(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0a1122] border border-[#1b2b4b] text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Behavior Categories</option>
            {behaviors.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0a1122] border border-[#1b2b4b] text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Table / List */}
      <div className="glass-panel rounded-2xl border border-[#16274a] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#14223d] bg-[#070d1a] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 font-semibold">Alert ID</th>
                <th className="py-3.5 px-4 font-semibold">Camera / Node</th>
                <th className="py-3.5 px-4 font-semibold">Location</th>
                <th className="py-3.5 px-4 font-semibold">Detected Behavior</th>
                <th className="py-3.5 px-4 font-semibold">Risk Score</th>
                <th className="py-3.5 px-4 font-semibold">Severity</th>
                <th className="py-3.5 px-4 font-semibold">Time</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#121e36] text-xs">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => {
                      setSelectedAlert(alert);
                      setIsModalOpen(true);
                    }}
                    className="hover:bg-[#0d172e] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {alert.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-white">
                      <div className="font-semibold">{alert.camera}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {alert.cameraName}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-[140px] truncate">
                      {alert.location}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {alert.behavior}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-orange-400">
                        {alert.riskScore}
                      </span>
                    </td>
                    <td className="py-3 px-4">
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
                        size="xs"
                      >
                        {alert.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {alert.timeFormatted}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          alert.status === "NEW"
                            ? "bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse"
                            : alert.status === "ACKNOWLEDGED"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : alert.status === "ESCALATED"
                            ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlert(alert);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-[#0f1b34] text-cyan-400 group-hover:text-white group-hover:bg-cyan-500/30 border border-[#1b2f57] transition-all"
                        title="View Dossier"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-500">
                    No surveillance alerts match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Dossier Modal */}
      <AlertDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        alert={selectedAlert}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

export default AlertsPage;
