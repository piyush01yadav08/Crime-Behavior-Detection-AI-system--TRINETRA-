import React, { useState } from "react";
import Tabs from "../components/ui/Tabs";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
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
} from "lucide-react";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const handleSave = (e) => {
    e.preventDefault();
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
