import React, { useState } from "react";
import { CAMERAS_DATA } from "../data/cameras";
import LiveSphere from "../components/sphere/LiveSphere";
import CameraGrid from "../components/camera/CameraGrid";
import LiveFeedPanel from "../components/camera/LiveFeedPanel";
import DetectionsPanel from "../components/camera/DetectionsPanel";
import QuickActions from "../components/camera/QuickActions";
import RiskSummary from "../components/camera/RiskSummary";
import LiveActivityFeed from "../components/camera/LiveActivityFeed";
import CameraModal from "../components/camera/CameraModal";
import WatchlistModal from "../components/camera/WatchlistModal";
import TrackObjectModal from "../components/camera/TrackObjectModal";
import { Globe, LayoutGrid } from "lucide-react";

export function DashboardPage() {
  const [cameras] = useState(CAMERAS_DATA);
  const [selectedCamera, setSelectedCamera] = useState(CAMERAS_DATA[0]); // CAM-02 featured
  const [viewMode, setViewMode] = useState("sphere"); // "sphere" or "grid"
  
  // Modals state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraModalMode, setCameraModalMode] = useState("fullscreen");
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  const handleOpenFocus = (camera) => {
    setSelectedCamera(camera);
    setCameraModalMode("focus");
    setIsCameraModalOpen(true);
  };

  const handleOpenFullscreen = (camera) => {
    setSelectedCamera(camera);
    setCameraModalMode("fullscreen");
    setIsCameraModalOpen(true);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-800/80">
        <div>
          <h1 className="text-lg font-semibold tracking-wide text-white">
            Surveillance Operations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active multi-stream monitoring • 12 Authorized nodes online
          </p>
        </div>

        {/* View Switcher: 3D Live Sphere vs 2D Surveillance Grid */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#080d1a] border border-slate-800">
          <button
            onClick={() => setViewMode("sphere")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "sphere"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>3D Live Sphere</span>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "grid"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>2D Grid View</span>
          </button>
        </div>
      </div>

      {/* Main Center (Hero) & Right Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left / Center Area: Live Sphere Hero + Supporting Panels */}
        <div className="xl:col-span-8 space-y-4">
          {viewMode === "sphere" ? (
            <LiveSphere
              cameras={cameras}
              selectedCamera={selectedCamera}
              onSelectCamera={(cam) => setSelectedCamera(cam)}
            />
          ) : (
            <CameraGrid
              cameras={cameras}
              selectedCamera={selectedCamera}
              onSelectCamera={(cam) => setSelectedCamera(cam)}
              onOpenFocusModal={(cam) => handleOpenFocus(cam)}
            />
          )}

          {/* Risk Summary */}
          <RiskSummary />

          {/* Live Activity Ticker */}
          <LiveActivityFeed
            onSelectEvent={(event) => {
              const cam = cameras.find((c) => c.id === event.camera);
              if (cam) setSelectedCamera(cam);
            }}
          />
        </div>

        {/* Right Command Panel */}
        <div className="xl:col-span-4 space-y-4">
          {/* Featured Camera Stream */}
          <LiveFeedPanel
            camera={selectedCamera}
            onFullscreen={() => handleOpenFullscreen(selectedCamera)}
            onOpenOptions={() => handleOpenFocus(selectedCamera)}
          />

          {/* Live AI Detections Breakdown */}
          <DetectionsPanel camera={selectedCamera} />

          {/* Quick Action Controls */}
          <QuickActions
            onFocusCamera={() => handleOpenFocus(selectedCamera)}
            onFullScreen={() => handleOpenFullscreen(selectedCamera)}
            onTrackObject={() => setIsTrackModalOpen(true)}
            onAddToWatchlist={() => setIsWatchlistModalOpen(true)}
          />
        </div>
      </div>

      {/* Interactive Modals */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        camera={selectedCamera}
        mode={cameraModalMode}
      />

      <WatchlistModal
        isOpen={isWatchlistModalOpen}
        onClose={() => setIsWatchlistModalOpen(false)}
        defaultCamera={selectedCamera}
      />

      <TrackObjectModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        camera={selectedCamera}
      />
    </div>
  );
}

export default DashboardPage;
