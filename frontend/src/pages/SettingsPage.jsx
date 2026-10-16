import React, { useState, useEffect } from "react";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { cameraService } from "../services/cameraService";
import { api } from "../services/api";
import {
  User,
  Video,
  Bell,
  Sliders,
  Palette,
  Shield,
  Save,
  CheckCircle,
  Cpu,
  RefreshCw,
  PlusCircle,
  Camera,
  MapPin,
  Tag,
  Layers,
  Database,
} from "lucide-react";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cameraAddedSuccess, setCameraAddedSuccess] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);

  // New Camera Form State
  const [newCamera, setNewCamera] = useState({
    name: "",
    camNumber: "",
    location: "",
    type: "cctv", // "cctv", "webcam", "ptz", "thermal", "dome"
    zone: "Default Perimeter",
    previewType: "traffic",
  });

  useEffect(() => {
    cameraService.getAll().then((list) => {
      if (list) setCameraList(list);
    });
    const unsub = cameraService.subscribe((list) => setCameraList(list));

    // Load persisted settings from database
    api.get("/settings/").then((saved) => {
      if (saved && typeof saved === "object") {
        if (saved.profile) setProfile((p) => ({ ...p, ...saved.profile }));
        if (saved.cameraSettings) setCameraSettings((c) => ({ ...c, ...saved.cameraSettings }));
        if (saved.alertPreferences) setAlertPreferences((a) => ({ ...a, ...saved.alertPreferences }));
        if (saved.notifications) setNotifications((n) => ({ ...n, ...saved.notifications }));
        if (saved.systemSettings) setSystemSettings((s) => ({ ...s, ...saved.systemSettings }));
        if (saved.appearance) setAppearance((ap) => ({ ...ap, ...saved.appearance }));
      }
    }).catch(() => {});

    // Fetch database connection health
    api.get("/db/status").then((status) => {
      if (status) setDbStatus(status);
    }).catch(() => {});

    return unsub;
  }, []);


  const handleAddCamera = async (e) => {
    e.preventDefault();
    if (!newCamera.camNumber.trim() && !newCamera.location.trim()) return;

    const formattedCamId = newCamera.camNumber.trim().toUpperCase().startsWith("CAM-")
      ? newCamera.camNumber.trim().toUpperCase()
      : `CAM-${newCamera.camNumber.trim().padStart(2, "0")}`;

    const newCamPayload = {
      id: formattedCamId,
      name: newCamera.name.trim() || `Cam ${newCamera.camNumber.trim()} - ${newCamera.location.trim()}`,
      shortName: newCamera.name.trim() || newCamera.location.trim(),
      location: newCamera.location.trim() || "Perimeter Corridor",
      type: newCamera.type === "webcam" ? "Direct Webcam Input" : newCamera.type === "cctv" ? "High-Speed CCTV Fixed" : newCamera.type.toUpperCase(),
      cameraCategory: newCamera.type, // "cctv", "webcam", etc.
      zone: newCamera.zone || "Perimeter",
      previewType: newCamera.previewType || (newCamera.type === "cctv" ? "gate" : "hallway"),
      status: "NORMAL",
      isLive: true,
      fps: 30,
      resolution: "1920 x 1080",
    };

    await cameraService.addCamera(newCamPayload);
    setCameraAddedSuccess(true);
    setTimeout(() => setCameraAddedSuccess(false), 3000);

    // Reset form
    setNewCamera({
      name: "",
      camNumber: "",
      location: "",
      type: "cctv",
      zone: "Default Perimeter",
      previewType: "traffic",
    });
  };

  // Settings local state
  const [profile, setProfile] = useState({
    name: "Piyush Yadav",
    role: "Administrator",
    email: "piyush01yadav08@trinetra.ai",
    badgeNumber: "ADM-0881",
    department: "AI Surveillance & Threat Intelligence",
  });

  const [cameraSettings, setCameraSettings] = useState({
    defaultResolution: "1080p",
    defaultFps: "30",
    streamProtocol: "RTSP-WebRTC",
    motionSensitivity: 75,
    autoReconnection: true,
  });

  const [alertPreferences, setAlertPreferences] = useState({
    criticalRiskThreshold: 85,
    highRiskThreshold: 70,
    audioAlerts: true,
    autoEscalateCritical: true,
    requireOperatorAck: true,
  });

  const [notifications, setNotifications] = useState({
    desktopPush: true,
    emailDigest: true,
    smsEmergencyAlerts: false,
    soundVolume: 60,
  });

  const [systemSettings, setSystemSettings] = useState({
    yoloModel: "yolov8n.pt",
    trackerBackend: "DeepSORT-Kalman",
    retentionDays: 30,
    inferenceDevice: "CUDA / GPU Acceleration",
    hardwareDecoding: true,
  });

  const [appearance, setAppearance] = useState({
    accentColor: "cyan",
    showHudOverlays: true,
    scanlinesEffect: true,
    highContrastMode: false,
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await Promise.all([
        api.post("/settings/profile", profile),
        api.post("/settings/cameraSettings", cameraSettings),
        api.post("/settings/alertPreferences", alertPreferences),
        api.post("/settings/notifications", notifications),
        api.post("/settings/systemSettings", systemSettings),
        api.post("/settings/appearance", appearance),
      ]);
    } catch (err) {
      console.warn("Failed to persist settings to database:", err);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };


  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="w-3.5 h-3.5" /> },
    { id: "camera", label: "Camera Feeds", icon: <Video className="w-3.5 h-3.5" /> },
    { id: "alerts", label: "Alert Triggers", icon: <Bell className="w-3.5 h-3.5" /> },
    { id: "notifications", label: "Notifications", icon: <Shield className="w-3.5 h-3.5" /> },
    { id: "system", label: "AI Models & System", icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#14223d]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wide text-white">
              System Settings & Preferences
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              OPERATOR CONFIG
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure node optical streams, detection thresholds, credentials, and notification channels
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Preferences Saved Successfully</span>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Main Settings Form Container */}
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-[#16274a] shadow-xl space-y-6">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Operator Identification & Security Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Operator Role</label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-[#142035] text-slate-400 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Email Dispatch Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Security Badge Number</label>
                <input
                  type="text"
                  value={profile.badgeNumber}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-[#142035] text-slate-400 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Camera Feeds Tab */}
        {activeTab === "camera" && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Camera Stream & Video Processing Options
            </h3>

            {/* Existing Camera Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Default Ingestion Resolution</label>
                <select
                  value={cameraSettings.defaultResolution}
                  onChange={(e) => setCameraSettings({ ...cameraSettings, defaultResolution: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="720p">1280 x 720 (HD - High Framerate)</option>
                  <option value="1080p">1920 x 1080 (Full HD - Recommended)</option>
                  <option value="4k">3840 x 2160 (4K Ultra HD)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Default FPS Target</label>
                <select
                  value={cameraSettings.defaultFps}
                  onChange={(e) => setCameraSettings({ ...cameraSettings, defaultFps: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="15">15 FPS (Low Bandwidth)</option>
                  <option value="25">25 FPS (PAL Standard)</option>
                  <option value="30">30 FPS (Fluid Surveillance)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1">
                  Optical Motion Sensitivity: <span className="text-cyan-400 font-mono">{cameraSettings.motionSensitivity}%</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={cameraSettings.motionSensitivity}
                  onChange={(e) => setCameraSettings({ ...cameraSettings, motionSensitivity: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* ADD NEW CAMERA SECTION */}
            <div className="pt-6 border-t border-[#142340] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Add New Surveillance Camera
                  </h4>
                </div>
                {cameraAddedSuccess && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle className="w-3 h-3" />
                    New Camera Added to System
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[#070d1a] border border-cyan-500/20 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-cyan-400" />
                      <span>Camera Number / ID *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15 or CAM-15"
                      value={newCamera.camNumber}
                      onChange={(e) => setNewCamera({ ...newCamera, camNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>Camera Location *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. North Gate Parking"
                      value={newCamera.location}
                      onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-cyan-400" />
                      <span>Camera Type *</span>
                    </label>
                    <select
                      value={newCamera.type}
                      onChange={(e) => setNewCamera({ ...newCamera, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="cctv">CCTV (Fixed IP / RTSP)</option>
                      <option value="webcam">Webcam (USB / DirectShow)</option>
                      <option value="ptz">PTZ High-Speed Optical</option>
                      <option value="thermal">Thermal IR Surveillance</option>
                      <option value="dome">Indoor 360° Dome</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Custom Camera Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Cam 15 - North Parking"
                      value={newCamera.name}
                      onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Zone / Sector</label>
                    <input
                      type="text"
                      placeholder="e.g. Sector 7 Perimeter"
                      value={newCamera.zone}
                      onChange={(e) => setNewCamera({ ...newCamera, zone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <Button
                    type="button"
                    onClick={handleAddCamera}
                    variant="primary"
                    size="sm"
                    icon={<PlusCircle className="w-3.5 h-3.5" />}
                  >
                    Add Camera Feed
                  </Button>
                </div>
              </div>
            </div>

            {/* REGISTERED CAMERAS DIRECTORY */}
            <div className="pt-4 border-t border-[#142340] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">
                  Registered Camera Nodes ({cameraList.length})
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {cameraList.filter((c) => c.status !== "OFFLINE").length} Active Online
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {cameraList.slice(0, 15).map((cam) => (
                  <div
                    key={cam.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#070c18] border border-slate-800/80 text-[11px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cam.status === "ALERT"
                            ? "bg-red-400 animate-pulse"
                            : cam.status === "WARNING"
                            ? "bg-amber-400"
                            : cam.status === "OFFLINE"
                            ? "bg-slate-500"
                            : "bg-emerald-400"
                        }`}
                      />
                      <span className="font-mono font-bold text-white">{cam.id}</span>
                      <span className="text-slate-300">{cam.name || cam.shortName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{cam.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-black/50 text-[10px] font-mono text-cyan-300 border border-white/10">
                        {cam.type || "CCTV"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {cam.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alert Triggers Tab */}
        {activeTab === "alerts" && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              AI Risk Thresholds & Escalation Policies
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Critical Alert Minimum Risk Score: <span className="text-red-400 font-mono font-bold">{alertPreferences.criticalRiskThreshold}</span>
                </label>
                <input
                  type="range"
                  min="75"
                  max="95"
                  value={alertPreferences.criticalRiskThreshold}
                  onChange={(e) => setAlertPreferences({ ...alertPreferences, criticalRiskThreshold: Number(e.target.value) })}
                  className="w-full accent-red-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  High Alert Minimum Risk Score: <span className="text-orange-400 font-mono font-bold">{alertPreferences.highRiskThreshold}</span>
                </label>
                <input
                  type="range"
                  min="55"
                  max="74"
                  value={alertPreferences.highRiskThreshold}
                  onChange={(e) => setAlertPreferences({ ...alertPreferences, highRiskThreshold: Number(e.target.value) })}
                  className="w-full accent-orange-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#142340]">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#091122] border border-[#16274a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertPreferences.audioAlerts}
                  onChange={(e) => setAlertPreferences({ ...alertPreferences, audioAlerts: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded"
                />
                <div>
                  <p className="font-semibold text-white">Audio Alarm on Critical Incident</p>
                  <p className="text-slate-400 text-[11px]">Play siren tone in control room when breach occurs</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#091122] border border-[#16274a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertPreferences.autoEscalateCritical}
                  onChange={(e) => setAlertPreferences({ ...alertPreferences, autoEscalateCritical: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded"
                />
                <div>
                  <p className="font-semibold text-white">Auto-Escalate Unacknowledged Alerts</p>
                  <p className="text-slate-400 text-[11px]">Dispatch alert to supervisor if unacknowledged within 3 minutes</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* System & AI Models Tab */}
        {activeTab === "system" && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Computer Vision Models & Infrastructure
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Active Object Detection Weights</label>
                <select
                  value={systemSettings.yoloModel}
                  onChange={(e) => setSystemSettings({ ...systemSettings, yoloModel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="yolov8n.pt">yolov8n.pt (Nano — High FPS, 6.5 MB)</option>
                  <option value="yolov8s.pt">yolov8s.pt (Small — Higher Accuracy, 22.5 MB)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Tracking Algorithm</label>
                <select
                  value={systemSettings.trackerBackend}
                  onChange={(e) => setSystemSettings({ ...systemSettings, trackerBackend: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="DeepSORT-Kalman">DeepSORT (Kalman Filter + ReID Embeddings)</option>
                  <option value="ByteTrack">ByteTrack (Low Confidence Association)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Forensic Data Retention Period</label>
                <select
                  value={systemSettings.retentionDays}
                  onChange={(e) => setSystemSettings({ ...systemSettings, retentionDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="15">15 Days Rolling Archive</option>
                  <option value="30">30 Days Standard</option>
                  <option value="90">90 Days Statutory Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Inference Processing Target</label>
                <input
                  type="text"
                  value={systemSettings.inferenceDevice}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-[#060a14] border border-[#142035] text-cyan-300 font-mono"
                />
              </div>
            </div>

            {/* Database Connection & Persistence Telemetry */}
            <div className="pt-4 border-t border-[#142340] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Database Persistence & Telemetry Engine
                  </h4>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    dbStatus?.connected
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}
                >
                  {dbStatus?.connected ? `ONLINE (${dbStatus.dialect?.toUpperCase()})` : "CONNECTING..."}
                </span>
              </div>

              {dbStatus && dbStatus.connected && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-xl bg-[#070d1c] border border-[#142546] font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">CAMERAS</span>
                    <span className="text-sm font-bold text-cyan-300">{dbStatus.tables?.cameras ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ALERTS</span>
                    <span className="text-sm font-bold text-orange-400">{dbStatus.tables?.alerts ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">SUBJECTS</span>
                    <span className="text-sm font-bold text-white">{dbStatus.tables?.tracked_persons ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">AUDIT LOGS</span>
                    <span className="text-sm font-bold text-emerald-300">{dbStatus.tables?.activity_logs ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">DB LATENCY</span>
                    <span className="text-sm font-bold text-cyan-400">{dbStatus.latencyMs} ms</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === "appearance" && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Control Room HUD & Aesthetic Tweaks
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#091122] border border-[#16274a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={appearance.showHudOverlays}
                  onChange={(e) => setAppearance({ ...appearance, showHudOverlays: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded"
                />
                <div>
                  <p className="font-semibold text-white">Enable Tactical HUD Overlays</p>
                  <p className="text-slate-400 text-[11px]">Display corner brackets, scanlines, and telemetry watermarks</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#091122] border border-[#16274a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={appearance.scanlinesEffect}
                  onChange={(e) => setAppearance({ ...appearance, scanlinesEffect: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded"
                />
                <div>
                  <p className="font-semibold text-white">CCTV Scanline Shader</p>
                  <p className="text-slate-400 text-[11px]">Simulate CRT surveillance phosphor texture on video channels</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Operator Alert Broadcast Channels
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#091122] border border-[#16274a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.desktopPush}
                  onChange={(e) => setNotifications({ ...notifications, desktopPush: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded"
                />
                <div>
                  <p className="font-semibold text-white">Browser Desktop Notifications</p>
                  <p className="text-slate-400 text-[11px]">Receive push notification on Critical behavior breaches</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#091122] border border-[#16274a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailDigest}
                  onChange={(e) => setNotifications({ ...notifications, emailDigest: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded"
                />
                <div>
                  <p className="font-semibold text-white">Daily Threat Digest Email</p>
                  <p className="text-slate-400 text-[11px]">Automated 06:00 AM summary sent to administrator</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Footer with Save Button */}
        <div className="pt-4 border-t border-[#142340] flex items-center justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Save className="w-4 h-4" />}
          >
            Save All Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
