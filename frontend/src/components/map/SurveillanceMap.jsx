import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * SurveillanceMap Component
 * Interactive geospatial surveillance map using Leaflet with dark cyber tile styling.
 */
export function SurveillanceMap({
  cameras,
  selectedCamera,
  onSelectCamera,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(new Map());

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center map around New Delhi campus coordinates (28.6139, 77.2090)
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.6139, 77.2090],
        zoom: 16,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark CartoDB Tiles for Cyber / Control Room Aesthetic
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add camera markers with custom HTML cyber pins
    cameras.forEach((cam) => {
      if (!cam.coordinates) return;

      const isSelected = selectedCamera?.id === cam.id;
      const isAlert = cam.status === "ALERT";
      const isWarning = cam.status === "WARNING";
      const isOffline = cam.status === "OFFLINE";

      let pinColor = "#00e5ff";
      let pulseColor = "rgba(0, 229, 255, 0.4)";
      if (isAlert) {
        pinColor = "#ef4444";
        pulseColor = "rgba(239, 68, 68, 0.6)";
      } else if (isWarning) {
        pinColor = "#f59e0b";
        pulseColor = "rgba(245, 158, 11, 0.5)";
      } else if (isOffline) {
        pinColor = "#64748b";
        pulseColor = "transparent";
      }

      const customIcon = L.divIcon({
        className: "custom-camera-marker",
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: ${pulseColor};
              animation: ${isAlert ? "ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite" : "none"};
            "></div>
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: #091122;
              border: 2px solid ${pinColor};
              box-shadow: 0 0 12px ${pinColor};
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
              font-family: monospace;
              font-weight: bold;
              z-index: 2;
            ">
              ${cam.id.replace("CAM-", "")}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([cam.coordinates.lat, cam.coordinates.lng], {
        icon: customIcon,
      }).addTo(map);

      marker.on("click", () => {
        onSelectCamera(cam);
      });

      markersRef.current.set(cam.id, marker);
    });

    return () => {
      // Map instance is preserved across quick re-renders
    };
  }, [cameras, selectedCamera, onSelectCamera]);

  // Pan to selected camera when changed
  useEffect(() => {
    if (selectedCamera?.coordinates && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([
        selectedCamera.coordinates.lat,
        selectedCamera.coordinates.lng,
      ], { animate: true, duration: 0.8 });
    }
  }, [selectedCamera]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#16274a] shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full min-h-[560px] bg-[#050914]" />
      
      {/* Map Legend Overlay */}
      <div className="absolute top-4 left-4 z-[400] glass-panel p-3 rounded-xl border border-cyan-500/30 text-xs font-mono space-y-2 pointer-events-auto shadow-xl">
        <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">
          Camera Pin Legend
        </span>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
          <span className="text-slate-200">Normal Active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
          <span className="text-red-300">Active Alert</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-amber-300">Warning / Loiter</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span className="text-slate-400">Offline Feed</span>
        </div>
      </div>
    </div>
  );
}

export default SurveillanceMap;
