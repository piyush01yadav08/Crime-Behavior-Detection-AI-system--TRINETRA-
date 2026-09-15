import React, { useState } from "react";
import { CAMERAS_DATA } from "../data/cameras";
import SurveillanceMap from "../components/map/SurveillanceMap";
import CameraStreamView from "../components/camera/CameraStreamView";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { Link } from "react-router-dom";
import {
  MapPin,
  Video,
  ShieldAlert,
  Radio,
  CheckCircle,
  AlertTriangle,
  Compass,
  ArrowRight,
  Maximize2
} from "lucide-react";

export function MapViewPage() {
  const [cameras] = useState(CAMERAS_DATA);
  const [selectedCamera, setSelectedCamera] = useState(CAMERAS_DATA[0]);

  const totalCameras = cameras.length;
  const onlineCameras = cameras.filter((c) => c.status !== "OFFLINE").length;
  const offlineCameras = totalCameras - onlineCameras;
  const activeIncidents = cameras.filter((c) => c.status === "ALERT" || c.status === "WARNING").length;

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-[#16274a] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Total Monitored Nodes
            </span>
            <p className="text-2xl font-black font-mono text-white mt-1">
              {totalCameras}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Video className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-[#16274a] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Online Feeds
            </span>
            <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {onlineCameras}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-[#16274a] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Active Incidents
            </span>
            <p className="text-2xl font-black font-mono text-red-400 mt-1">
              {activeIncidents}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-[#16274a] flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Offline Nodes
            </span>
            <p className="text-2xl font-black font-mono text-slate-400 mt-1">
              {offlineCameras}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/30 border border-slate-700/40 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Map & Camera Info Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Geospatial Map Area */}
        <div className="lg:col-span-8 h-[640px]">
          <SurveillanceMap
            cameras={cameras}
            selectedCamera={selectedCamera}
            onSelectCamera={(cam) => setSelectedCamera(cam)}
          />
        </div>

        {/* Selected Camera Drawer */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-2xl border border-[#16274a] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 font-bold tracking-wider">
                  NODE METADATA
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedCamera.name}
                </h3>
              </div>
              <Badge
                variant={
                  selectedCamera.status === "ALERT"
                    ? "critical"
                    : selectedCamera.status === "WARNING"
                    ? "medium"
                    : selectedCamera.status === "OFFLINE"
                    ? "default"
                    : "low"
                }
                size="sm"
              >
                {selectedCamera.status}
              </Badge>
            </div>

            {/* Live Video Preview Box */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-[#1c2e55] shadow-lg">
              <CameraStreamView camera={selectedCamera} isFocused={true} />
            </div>

            {/* Location & GPS Info */}
            <div className="space-y-2 text-xs font-mono bg-[#091122] p-3 rounded-xl border border-[#142340]">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Zone:</span>
                <span className="text-white text-right truncate max-w-[180px]">
                  {selectedCamera.zone}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Coordinates:</span>
                <span className="text-cyan-300">
                  {selectedCamera.coordinates.lat.toFixed(4)}° N, {selectedCamera.coordinates.lng.toFixed(4)}° E
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Heading / FOV:</span>
                <span className="text-white">{selectedCamera.bearing}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Hardware Type:</span>
                <span className="text-slate-200 text-right truncate max-w-[180px]">
                  {selectedCamera.type}
                </span>
              </div>
            </div>

            {/* Active Alert Banner if in alert */}
            {selectedCamera.activeAlert && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-xs space-y-1.5 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-red-400">
                    {selectedCamera.activeAlert.id}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-mono text-[10px] font-bold">
                    RISK {selectedCamera.activeAlert.riskScore}
                  </span>
                </div>
                <p className="font-semibold text-white">
                  {selectedCamera.activeAlert.type}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Logged at {selectedCamera.activeAlert.time}
                  </span>
                  <Link
                    to={`/alerts?id=${selectedCamera.activeAlert.id}`}
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-xs"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Link to Main Dashboard */}
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-md hover:shadow-cyan-500/30 transition-all"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Open in Command Sphere</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapViewPage;
