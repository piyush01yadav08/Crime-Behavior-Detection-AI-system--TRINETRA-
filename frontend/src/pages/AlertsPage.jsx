import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ALERTS_DATA } from "../data/alerts";
import { CAMERAS_DATA } from "../data/cameras";
import { alertService } from "../services/alertService";
import { cameraService } from "../services/cameraService";
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
  Radio,
} from "lucide-react";

export function AlertsPage() {
  const [searchParams] = useSearchParams();
  const [alerts, setAlerts] = useState(ALERTS_DATA);
  const [cameras, setCameras] = useState(CAMERAS_DATA);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Filter states
  const [activeSeverity, setActiveSeverity] = useState("ALL");
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [selectedCamera, setSelectedCamera] = useState("ALL");
  const [selectedBehavior, setSelectedBehavior] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "highest-risk"

  // Live Alerts & Camera Ingestion
  useEffect(() => {
    let isMounted = true;
    const fetchLiveAlerts = async () => {
      try {
        const liveAlerts = await alertService.getAlerts();
        if (isMounted && Array.isArray(liveAlerts) && liveAlerts.length > 0) {
          setAlerts(liveAlerts);
          setIsLiveConnected(true);
        }
      } catch (e) {
        if (isMounted) setIsLiveConnected(false);
      }
    };

    fetchLiveAlerts();
    const alertInterval = setInterval(fetchLiveAlerts, 3000);
    const unsubAlerts = alertService.subscribe((updated) => {
      if (isMounted) setAlerts(updated);
    });

    cameraService.getAll().then((cams) => {
      if (isMounted && Array.isArray(cams) && cams.length > 0) setCameras(cams);
    });
    const unsubCams = cameraService.subscribe((cams) => {
      if (isMounted) setCameras(cams);
    });

    return () => {
      isMounted = false;
      clearInterval(alertInterval);
      unsubAlerts();
      unsubCams();
    };
  }, []);

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

  const handleStatusChange = async (alertId, newStatus, notes) => {
    try {
      await alertService.updateAlertStatus(alertId, newStatus, notes);
    } catch (e) {
      // Local fallback
    }
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
            {isLiveConnected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                LIVE STREAM SYNC
              </span>
            )}
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
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
            <span>
              {sortOrder === "newest" ? "Sort: Risk Score" : "Sort: Timestamp"}
            </span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
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
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.id} - {cam.shortName || cam.name}
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
            <option value="NEW">New / Unacknowledged</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="glass-panel rounded-2xl border border-[#14223d] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#091224]/80 text-slate-400 font-semibold border-b border-[#14223d] select-none">
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Camera</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Behavior Event</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14223d]/50">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                    No surveillance alerts match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => {
                      setSelectedAlert(alert);
                      setIsModalOpen(true);
                    }}
                    className="hover:bg-cyan-500/5 transition-colors cursor-pointer group"
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
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          alert.status === "NEW"
                            ? "bg-red-500/10 text-red-400 border border-red-500/30"
                            : alert.status === "ACKNOWLEDGED"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : alert.status === "ESCALATED"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {alert.timeFormatted || alert.timestamp}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {alert.status === "NEW" && (
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() =>
                              handleStatusChange(alert.id, "ACKNOWLEDGED")
                            }
                          >
                            Ack
                          </Button>
                        )}
                        {alert.status !== "RESOLVED" && (
                          <Button
                            variant="success"
                            size="xs"
                            onClick={() =>
                              handleStatusChange(alert.id, "RESOLVED")
                            }
                          >
                            Resolve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setIsModalOpen(true);
                          }}
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail Modal */}
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
