import React, { useState } from "react";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  PlusCircle,
  Eye,
  CheckCircle,
  Clock,
  Printer,
  FileSpreadsheet,
} from "lucide-react";

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Initial Reports List
  const [reports, setReports] = useState([
    {
      id: "REP-2026-0826",
      title: "Daily Surveillance & Threat Assessment Summary",
      type: "Daily Summary",
      generatedDate: "2026-08-26 22:30",
      author: "Piyush Yadav (Admin)",
      totalIncidents: 28,
      criticalEvents: 3,
      avgRiskScore: 42,
      summaryText: "Comprehensive 24-hour surveillance audit across all 12 monitored nodes. Peak anomaly density occurred at CAM-02 (City Road) and CAM-14 (East Warehouse perimeter). Zero security breaches penetrated interior vaults.",
      format: "PDF, CSV",
      fileSize: "2.4 MB",
    },
    {
      id: "REP-2026-0825",
      title: "Perimeter Intrusion & Fence Security Audit",
      type: "Incident Reports",
      generatedDate: "2026-08-25 18:00",
      author: "Autonomous AI Engine",
      totalIncidents: 14,
      criticalEvents: 2,
      avgRiskScore: 68,
      summaryText: "Detailed forensic review of tripwire breaches along the southern perimeter garden fence line. Recommended nighttime auxiliary floodlight activation.",
      format: "PDF",
      fileSize: "1.8 MB",
    },
    {
      id: "REP-2026-0824",
      title: "Camera Uptime & Optical Transmission Health Audit",
      type: "Camera Reports",
      generatedDate: "2026-08-24 09:15",
      author: "SysAdmin Bot",
      totalIncidents: 6,
      criticalEvents: 0,
      avgRiskScore: 24,
      summaryText: "Diagnostic evaluation of 12 RTSP video channels. CAM-21 Substation Gate noted for intermittent packet degradation requiring PoE port reboot.",
      format: "CSV, JSON",
      fileSize: "840 KB",
    },
    {
      id: "REP-2026-0822",
      title: "Behavioral Vector Analysis: Confrontation & Loitering",
      type: "Behavior Reports",
      generatedDate: "2026-08-22 23:59",
      author: "Piyush Yadav (Admin)",
      totalIncidents: 42,
      criticalEvents: 5,
      avgRiskScore: 61,
      summaryText: "Bi-weekly comparative evaluation of aggressive human motion trajectories vs baseline pedestrian flow. Identified 3 clusters of prolonged dwell time in Wing C corridor.",
      format: "PDF, CSV",
      fileSize: "4.1 MB",
    },
    {
      id: "REP-2026-0820",
      title: "Quarterly Risk Matrix & Threat Heatmap",
      type: "Risk Reports",
      generatedDate: "2026-08-20 12:00",
      author: "Lead Safety Officer",
      totalIncidents: 194,
      criticalEvents: 18,
      avgRiskScore: 48,
      summaryText: "Strategic executive overview of institutional risk levels across public entrances, restricted zones, and vehicle parking terminals.",
      format: "PDF",
      fileSize: "6.2 MB",
    },
  ]);

  const reportTabs = [
    { id: "all", label: "All Reports", count: reports.length },
    { id: "Daily Summary", label: "Daily Summary" },
    { id: "Incident Reports", label: "Incident Reports" },
    { id: "Camera Reports", label: "Camera Reports" },
    { id: "Behavior Reports", label: "Behavior Reports" },
    { id: "Risk Reports", label: "Risk Reports" },
  ];

  const filteredReports =
    activeTab === "all"
      ? reports
      : reports.filter((r) => r.type === activeTab);

  // Simulated Report Generation
  const [newReportType, setNewReportType] = useState("Incident Reports");
  const [newReportDateRange, setNewReportDateRange] = useState("Last 24 Hours");

  const handleCreateReport = () => {
    const newId = `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRep = {
      id: newId,
      title: `Generated ${newReportType} (${newReportDateRange})`,
      type: newReportType,
      generatedDate: "Just now",
      author: "Piyush Yadav (Current Session)",
      totalIncidents: 18,
      criticalEvents: 2,
      avgRiskScore: 45,
      summaryText: `Automated intelligence compilation for ${newReportDateRange}. Local simulated data snapshot compiled from active camera nodes and event stream.`,
      format: "PDF, CSV",
      fileSize: "1.9 MB",
    };
    setReports([newRep, ...reports]);
    setIsGenerateModalOpen(false);
    setSelectedReport(newRep);
  };

  const handleExportSimulated = (format) => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`[Demo Export] Report ${selectedReport?.id || "REP-2026-0826"} successfully exported as ${format}.`);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#14223d]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wide text-white">
              Surveillance & Incident Reports
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              AUDIT ARCHIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Executive threat digests, daily operational logs, and forensic compliance dossiers
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsGenerateModalOpen(true)}
          icon={<PlusCircle className="w-4 h-4" />}
        >
          Generate New Report
        </Button>
      </div>

      {/* Categories Tabs */}
      <Tabs
        tabs={reportTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="glass-panel p-5 rounded-2xl border border-[#16274a] space-y-4 hover:border-cyan-500/40 transition-all shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {report.id}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0e1933] text-slate-300 border border-[#1a2d52]">
                  {report.type}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">
                {report.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {report.summaryText}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#142340]">
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-lg bg-[#070d1c] border border-[#132039]">
                  <span className="text-[10px] text-slate-500 block">EVENTS</span>
                  <span className="font-bold text-white">{report.totalIncidents}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#070d1c] border border-[#132039]">
                  <span className="text-[10px] text-slate-500 block">CRITICAL</span>
                  <span className="font-bold text-red-400">{report.criticalEvents}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#070d1c] border border-[#132039]">
                  <span className="text-[10px] text-slate-500 block">AVG RISK</span>
                  <span className="font-bold text-amber-400">{report.avgRiskScore}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{report.generatedDate}</span>
                <span className="font-mono">{report.fileSize}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setSelectedReport(report)}
                  icon={<Eye className="w-3.5 h-3.5" />}
                >
                  View Report
                </Button>
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    handleExportSimulated("PDF");
                  }}
                  className="p-2 rounded-lg bg-[#0c162c] text-cyan-400 hover:text-white border border-[#192b4d] hover:border-cyan-400 transition-colors"
                  title="Export PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <Modal
          isOpen={Boolean(selectedReport)}
          onClose={() => setSelectedReport(null)}
          title={selectedReport.title}
          subtitle={`Report ID: ${selectedReport.id} • Generated: ${selectedReport.generatedDate}`}
          maxWidth="max-w-3xl"
          footer={
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Audited by: <strong className="text-white">{selectedReport.author}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExportSimulated("CSV")}
                  icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />}
                >
                  Export CSV
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleExportSimulated("PDF")}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Export PDF
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#091122] border border-[#16274a] space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">
                Executive Overview
              </h4>
              <p className="text-slate-300 leading-relaxed">
                {selectedReport.summaryText}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-[#070d1c] border border-[#142340]">
                <span className="text-[10px] text-slate-400 uppercase">Monitored Influx</span>
                <p className="text-lg font-bold text-white mt-1">1,420 detections</p>
              </div>
              <div className="p-3 rounded-xl bg-[#070d1c] border border-[#142340]">
                <span className="text-[10px] text-slate-400 uppercase">Risk Index</span>
                <p className="text-lg font-bold text-amber-400 mt-1">{selectedReport.avgRiskScore} / 100</p>
              </div>
              <div className="p-3 rounded-xl bg-[#070d1c] border border-[#142340]">
                <span className="text-[10px] text-slate-400 uppercase">Perimeter Status</span>
                <p className="text-lg font-bold text-emerald-400 mt-1">SECURED</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-slate-300 text-[11px] leading-relaxed">
              <strong>Notice:</strong> This report is rendered using the TRINETRA client-side audit generator with local surveillance telemetry. Full automated server-side report compilation will be linked once the Django REST analytics worker is deployed.
            </div>
          </div>
        </Modal>
      )}

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Custom Surveillance Report"
        subtitle="Compile situational logs, risk aggregations, and behavioral alerts"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateReport}>
              Generate Report
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Report Category
            </label>
            <select
              value={newReportType}
              onChange={(e) => setNewReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="Daily Summary">Daily Summary</option>
              <option value="Incident Reports">Incident Reports</option>
              <option value="Camera Reports">Camera Reports</option>
              <option value="Behavior Reports">Behavior Reports</option>
              <option value="Risk Reports">Risk Reports</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Timeframe Window
            </label>
            <select
              value={newReportDateRange}
              onChange={(e) => setNewReportDateRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="Last 24 Hours">Last 24 Hours</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Custom Shift (Night 20:00 - 06:00)">Custom Shift (Night 20:00 - 06:00)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Export Format
            </label>
            <div className="flex items-center gap-3 text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-cyan-400" />
                <span>PDF Document</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-cyan-400" />
                <span>CSV Spreadsheet</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ReportsPage;
