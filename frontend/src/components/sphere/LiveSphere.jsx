import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MousePointer, RotateCcw, Maximize2 } from "lucide-react";

// 40 Surveillance screens partitioned into 5 latitude rings covering the sphere
// Each ring's theta directly touches adjacent rings (zero vertical gaps)
// Within each ring, phi wraps 360° with matching boundaries (zero horizontal gaps)
const RING_DEFINITIONS = [
  {
    ringIndex: 0,
    thetaStart: (12 * Math.PI) / 180,
    thetaLength: (32 * Math.PI) / 180,
    screens: [
      { id: "CAM-01", name: "Main Gate Alpha", previewType: "gate" },
      { id: "CAM-12", name: "North Parking", previewType: "parking" },
      { id: "CAM-24", name: "Helipad Roof", previewType: "traffic" },
      { id: "CAM-31", name: "North Watchtower", previewType: "warehouse" },
      { id: "CAM-32", name: "North Perimeter", previewType: "backyard" },
      { id: "CAM-33", name: "Skyline Cam 1", previewType: "traffic" },
    ],
  },
  {
    ringIndex: 1,
    thetaStart: (44 * Math.PI) / 180,
    thetaLength: (30 * Math.PI) / 180,
    screens: [
      { id: "CAM-03", name: "Reception Lobby", previewType: "hallway" },
      { id: "CAM-04", name: "East Boulevard", previewType: "traffic" },
      { id: "CAM-05", name: "Central Cafeteria", previewType: "cafeteria" },
      { id: "CAM-06", name: "Science Wing 1F", previewType: "hallway" },
      { id: "CAM-07", name: "Corridor Wing C", previewType: "hallway" },
      { id: "CAM-08", name: "Administration Yard", previewType: "gate" },
      { id: "CAM-10", name: "West Parking B", previewType: "parking" },
      { id: "CAM-11", name: "Main Atrium", previewType: "hallway" },
      { id: "CAM-13", name: "North Checkpoint", previewType: "gate" },
    ],
  },
  {
    ringIndex: 2, // Equator Belt (CAM-02 is center-facing)
    thetaStart: (74 * Math.PI) / 180,
    thetaLength: (32 * Math.PI) / 180,
    screens: [
      { id: "CAM-02", name: "City Road Front", previewType: "traffic" },
      { id: "CAM-14", name: "East Warehouse", previewType: "warehouse" },
      { id: "CAM-15", name: "Transit Terminal", previewType: "traffic" },
      { id: "CAM-17", name: "Cargo Ramp", previewType: "warehouse" },
      { id: "CAM-18", name: "South Loading Bay", previewType: "warehouse" },
      { id: "CAM-19", name: "East Exit 4", previewType: "gate" },
      { id: "CAM-20", name: "South Perimeter Gate", previewType: "backyard" },
      { id: "CAM-21", name: "Substation Vault", previewType: "warehouse" },
      { id: "CAM-22", name: "West Gate Approach", previewType: "traffic" },
      { id: "CAM-23", name: "Commercial Depot", previewType: "warehouse" },
    ],
  },
  {
    ringIndex: 3,
    thetaStart: (106 * Math.PI) / 180,
    thetaLength: (30 * Math.PI) / 180,
    screens: [
      { id: "CAM-09", name: "Backyard Boundary", previewType: "backyard" },
      { id: "CAM-16", name: "Server Room B1", previewType: "hallway" },
      { id: "CAM-25", name: "Utility Subterranean", previewType: "hallway" },
      { id: "CAM-26", name: "HVAC Facility", previewType: "warehouse" },
      { id: "CAM-27", name: "Underground Deck", previewType: "parking" },
      { id: "CAM-28", name: "South Sentry Box", previewType: "gate" },
      { id: "CAM-29", name: "Perimeter Sector 9", previewType: "backyard" },
      { id: "CAM-30", name: "Transformer Yard", previewType: "warehouse" },
      { id: "CAM-34", name: "Service Ramp South", previewType: "gate" },
    ],
  },
  {
    ringIndex: 4,
    thetaStart: (136 * Math.PI) / 180,
    thetaLength: (32 * Math.PI) / 180,
    screens: [
      { id: "CAM-35", name: "Fuel Storage Vault", previewType: "warehouse" },
      { id: "CAM-36", name: "South Trench Line", previewType: "backyard" },
      { id: "CAM-37", name: "Drainage Sump", previewType: "warehouse" },
      { id: "CAM-38", name: "Perimeter Outer Fence", previewType: "backyard" },
      { id: "CAM-39", name: "Auxiliary Generator", previewType: "warehouse" },
      { id: "CAM-40", name: "Substation South", previewType: "warehouse" },
    ],
  },
];

/**
 * LiveSphere 3D Component
 * A contiguous 360° spherical video wall of 40 CCTV screens.
 * The screens are tightly tiled with zero gaps (borders stick to each other),
 * with an opaque core and no visible structure behind the globe.
 * Clicking any screen pops it out into the full inspection / live stream view.
 */
export function LiveSphere({
  cameras = [],
  selectedCamera,
  onSelectCamera,
  onPopoutCamera,
}) {
  const mountRef = useRef(null);
  const [, setIsDragging] = useState(false);
  const [hoveredCam, setHoveredCam] = useState(null);

  const sphereGroupRef = useRef(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const cameraMeshesRef = useRef([]);
  const canvasTexturesRef = useRef([]);
  const animFrameIdRef = useRef(null);

  const onSelectCameraRef = useRef(onSelectCamera);
  const onPopoutCameraRef = useRef(onPopoutCamera);

  useEffect(() => {
    onSelectCameraRef.current = onSelectCamera;
    onPopoutCameraRef.current = onPopoutCamera;
  }, [onSelectCamera, onPopoutCamera]);

  // Helper: Fast dynamic CCTV feed canvas rendering
  const drawCCTVFeed = (ctx, camInfo, tick, isSelected, isHovered) => {
    const w = 320;
    const h = 200;

    // Dark security background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (camInfo.previewType === "traffic") {
      bgGrad.addColorStop(0, "#08101e");
      bgGrad.addColorStop(0.6, "#111d33");
      bgGrad.addColorStop(1, "#09101f");
    } else if (camInfo.previewType === "warehouse" || camInfo.previewType === "backyard") {
      bgGrad.addColorStop(0, "#050912");
      bgGrad.addColorStop(0.6, "#0c1527");
      bgGrad.addColorStop(1, "#060b17");
    } else {
      bgGrad.addColorStop(0, "#070d1a");
      bgGrad.addColorStop(0.6, "#0f1a30");
      bgGrad.addColorStop(1, "#080e1b");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Dynamic video simulation elements
    if (camInfo.previewType === "traffic") {
      // Perspective Highway Lanes
      ctx.fillStyle = "#0d1524";
      ctx.beginPath();
      ctx.moveTo(125, 80);
      ctx.lineTo(195, 80);
      ctx.lineTo(300, h);
      ctx.lineTo(20, h);
      ctx.closePath();
      ctx.fill();

      // Yellow Center Dash
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(160, 80);
      ctx.lineTo(160, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Vehicle with bounding box
      const carOffset = Math.sin(tick * 0.05 + (camInfo.index || 0)) * 14;
      const carX = 142 + carOffset;
      const carY = 115;
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(carX, carY, 36, 20);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(carX + 5, carY + 4, 26, 8);

      // Cyan AI Detection Box
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(carX - 3, carY - 3, 42, 26);
      ctx.fillStyle = "#00e5ff";
      ctx.font = "bold 9px monospace";
      ctx.fillText("VEHICLE", carX - 2, carY - 6);
    } else {
      // Facility perspectives
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 100);
      ctx.lineTo(w, 100);
      ctx.stroke();

      // Person subject
      const pedX = 145 + Math.sin(tick * 0.04 + (camInfo.index || 0)) * 20;
      const pedY = 95;
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.arc(pedX, pedY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(pedX - 3, pedY + 5, 6, 24);

      // Detection box
      ctx.strokeStyle = isSelected ? "#00e5ff" : "#38bdf8";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(pedX - 8, pedY - 4, 16, 36);
      ctx.fillStyle = isSelected ? "#00e5ff" : "#38bdf8";
      ctx.font = "bold 8.5px monospace";
      ctx.fillText("PERSON", pedX - 8, pedY - 7);
    }

    // Subtle scanline texture
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1.5);
    }

    // Top Header: REC dot, LIVE badge & Camera ID
    ctx.fillStyle = "rgba(3, 7, 18, 0.88)";
    ctx.fillRect(0, 0, w, 26);

    // Blinking REC Indicator
    const isBlink = Math.floor(tick / 16) % 2 === 0;
    ctx.fillStyle = isBlink ? "#ef4444" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(12, 13, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 9px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("REC", 20, 16);

    if (isSelected) {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(48, 5, 34, 15);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.fillText("LIVE", 54, 16);
    }

    // Camera ID
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = isSelected ? "#00e5ff" : "#e2e8f0";
    ctx.textAlign = "right";
    ctx.fillText(camInfo.id, w - 10, 17);

    // Bottom Footer: Location Name
    ctx.fillStyle = "rgba(3, 7, 18, 0.92)";
    ctx.fillRect(0, h - 28, w, 28);

    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = isSelected ? "#00e5ff" : "#f8fafc";
    ctx.textAlign = "left";
    ctx.fillText(camInfo.name, 10, h - 10);

    ctx.font = "bold 9px monospace";
    ctx.fillStyle = isSelected ? "#00e5ff" : "#64748b";
    ctx.textAlign = "right";
    ctx.fillText("CLICK TO EXPAND", w - 10, h - 10);

    // Monitor Bezel Border (directly abutting neighbor screens)
    if (isSelected) {
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, w, h);
    } else if (isHovered) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 4.5;
      ctx.strokeRect(0, 0, w, h);
    } else {
      ctx.strokeStyle = "rgba(30, 41, 59, 0.95)";
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, w, h);
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050811, 0.0008);

    const camera3D = new THREE.PerspectiveCamera(42, width / height, 1, 1000);
    camera3D.position.set(0, 0, 410);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00e5ff, 1.2);
    dirLight.position.set(160, 220, 260);
    scene.add(dirLight);

    // 4. Main 3D Sphere Group
    const sphereGroup = new THREE.Group();
    scene.add(sphereGroup);
    sphereGroupRef.current = sphereGroup;

    // 4A. Solid Opaque Core (prevents any backside structure from ever showing)
    const sphereRadius = 135;
    const coreGeo = new THREE.SphereGeometry(sphereRadius * 0.995, 48, 48);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x030712,
      side: THREE.FrontSide,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    sphereGroup.add(coreMesh);

    // 4B. Polar Caps (closing the top and bottom apex with sleek surveillance dome discs)
    const topCapGeo = new THREE.SphereGeometry(
      sphereRadius,
      36,
      4,
      0,
      Math.PI * 2,
      0,
      (12 * Math.PI) / 180
    );
    const capMat = new THREE.MeshBasicMaterial({
      color: 0x050a16,
      side: THREE.FrontSide,
    });
    const topCapMesh = new THREE.Mesh(topCapGeo, capMat);
    sphereGroup.add(topCapMesh);

    const bottomCapGeo = new THREE.SphereGeometry(
      sphereRadius,
      36,
      4,
      0,
      Math.PI * 2,
      (168 * Math.PI) / 180,
      (12 * Math.PI) / 180
    );
    const bottomCapMesh = new THREE.Mesh(bottomCapGeo, capMat);
    sphereGroup.add(bottomCapMesh);

    // 5. Build 40 Seamlessly Tiled Curved Screens Across the Sphere
    // Each screen is an exact spherical segment whose boundaries connect with zero gap.
    const cameraMeshes = [];
    const canvasTextures = [];
    let globalScreenIdx = 0;

    RING_DEFINITIONS.forEach((ring) => {
      const screenCount = ring.screens.length;
      const phiStep = (Math.PI * 2) / screenCount;

      ring.screens.forEach((screenDef, i) => {
        globalScreenIdx++;

        // Align Equator screen 0 (CAM-02) directly to front-center (phi = Math.PI / 2)
        const phiStart = Math.PI / 2 - phiStep / 2 + i * phiStep;
        const phiCenter = phiStart + phiStep / 2;
        const thetaCenter = ring.thetaStart + ring.thetaLength / 2;

        const matchingCam =
          cameras.find((c) => c.id === screenDef.id) || {
            id: screenDef.id,
            name: screenDef.name,
            shortName: screenDef.name,
            location: `Compound Sector ${globalScreenIdx}`,
            zone: "Perimeter Grid",
            status: "NORMAL",
            isLive: true,
            fps: 30,
            resolution: "1920 x 1080",
            codec: "H.264",
            bitrate: "3.8 Mbps",
            previewType: screenDef.previewType,
            index: globalScreenIdx,
          };

        // Create dynamic 2D canvas for screen
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 200;
        const ctx = canvas.getContext("2d");

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        canvasTextures.push({
          canvas,
          ctx,
          texture,
          camInfo: { ...matchingCam, index: globalScreenIdx },
          id: screenDef.id,
        });

        // Exact Spherical Patch Geometry - perfectly sticks to neighbor screens
        const patchGeo = new THREE.SphereGeometry(
          sphereRadius,
          6,
          6,
          phiStart,
          phiStep,
          ring.thetaStart,
          ring.thetaLength
        );

        // FrontSide ensures back of sphere is 100% culled (no structure bleed-through)
        const patchMat = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.FrontSide,
        });

        const patchMesh = new THREE.Mesh(patchGeo, patchMat);
        patchMesh.userData = {
          camera: matchingCam,
          id: screenDef.id,
          phiCenter,
          thetaCenter,
        };

        sphereGroup.add(patchMesh);
        cameraMeshes.push(patchMesh);
      });
    });

    cameraMeshesRef.current = cameraMeshes;
    canvasTexturesRef.current = canvasTextures;

    // 6. Raycasting for Interaction & Popout
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e) => {
      isDraggingRef.current = true;
      setIsDragging(true);
      hasMovedRef.current = false;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDraggingRef.current) {
        const deltaX = e.clientX - pointerStartRef.current.x;
        const deltaY = e.clientY - pointerStartRef.current.y;

        if (Math.hypot(deltaX, deltaY) > 4) {
          hasMovedRef.current = true;
        }

        targetRotationRef.current.y += deltaX * 0.007;
        targetRotationRef.current.x += deltaY * 0.005;

        // Clamp vertical pitch to keep globe cleanly visible
        targetRotationRef.current.x = Math.max(
          -0.65,
          Math.min(0.65, targetRotationRef.current.x)
        );

        pointerStartRef.current = { x: e.clientX, y: e.clientY };
      } else {
        raycaster.setFromCamera(mouse, camera3D);
        const intersects = raycaster.intersectObjects(cameraMeshesRef.current);
        if (intersects.length > 0) {
          const hovered = intersects[0].object.userData.camera;
          setHoveredCam(hovered);
          container.style.cursor = "pointer";
        } else {
          setHoveredCam(null);
          container.style.cursor = isDraggingRef.current ? "grabbing" : "grab";
        }
      }
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current && !hasMovedRef.current) {
        // Precise click detected on a screen: POP OUT INTO FULL INSPECTION MODAL
        raycaster.setFromCamera(mouse, camera3D);
        const intersects = raycaster.intersectObjects(cameraMeshesRef.current);
        if (intersects.length > 0) {
          const clickedCam = intersects[0].object.userData.camera;
          if (clickedCam) {
            if (onSelectCameraRef.current) {
              onSelectCameraRef.current(clickedCam);
            }
            if (onPopoutCameraRef.current) {
              onPopoutCameraRef.current(clickedCam);
            }
          }
        }
      }

      isDraggingRef.current = false;
      setIsDragging(false);
      container.style.cursor = "grab";
    };

    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    // 7. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera3D.aspect = w / h;
      camera3D.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 8. Animation Loop
    let tick = 0;
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      tick++;

      // Smooth damping interpolation
      currentRotationRef.current.x +=
        (targetRotationRef.current.x - currentRotationRef.current.x) * 0.12;
      currentRotationRef.current.y +=
        (targetRotationRef.current.y - currentRotationRef.current.y) * 0.12;

      sphereGroup.rotation.x = currentRotationRef.current.x;
      sphereGroup.rotation.y = currentRotationRef.current.y;

      // Interleaved texture update: 10 screens per frame for silky 60fps performance
      const batchSize = 10;
      const startIdx = (tick % 4) * batchSize;
      const endIdx = startIdx + batchSize;

      for (
        let i = startIdx;
        i < endIdx && i < canvasTexturesRef.current.length;
        i++
      ) {
        const item = canvasTexturesRef.current[i];
        const isSelected = selectedCamera?.id === item.id;
        const isHovered = hoveredCam?.id === item.id;
        drawCCTVFeed(item.ctx, item.camInfo, tick, isSelected, isHovered);
        item.texture.needsUpdate = true;
      }

      // Always update selected and hovered camera every frame
      if (selectedCamera) {
        const activeItem = canvasTexturesRef.current.find(
          (t) => t.id === selectedCamera.id
        );
        if (activeItem) {
          drawCCTVFeed(
            activeItem.ctx,
            activeItem.camInfo,
            tick,
            true,
            hoveredCam?.id === activeItem.id
          );
          activeItem.texture.needsUpdate = true;
        }
      }

      // Hover / Select screen pop effect
      cameraMeshesRef.current.forEach((mesh) => {
        const isSelected = selectedCamera?.id === mesh.userData.id;
        const isHovered = hoveredCam?.id === mesh.userData.id;
        const targetScale = isSelected ? 1.035 : isHovered ? 1.025 : 1.0;
        mesh.scale.set(targetScale, targetScale, targetScale);
      });

      renderer.render(scene, camera3D);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      renderer.dispose();
      if (container) container.innerHTML = "";
    };
  }, [cameras, selectedCamera, hoveredCam]);

  // Center selected camera smoothly on sphere
  useEffect(() => {
    if (!selectedCamera) return;
    const mesh = cameraMeshesRef.current.find(
      (m) => m.userData.id === selectedCamera.id
    );
    if (
      mesh &&
      mesh.userData.phiCenter !== undefined &&
      mesh.userData.thetaCenter !== undefined
    ) {
      // Calculate rotation required to bring screen to front-center
      const targetY = Math.PI / 2 - mesh.userData.phiCenter;
      const targetX = Math.PI / 2 - mesh.userData.thetaCenter;
      targetRotationRef.current.y = targetY;
      targetRotationRef.current.x = targetX;
    }
  }, [selectedCamera]);

  const handleResetRotation = (e) => {
    e.stopPropagation();
    targetRotationRef.current = { x: 0, y: 0 };
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl bg-[#050811] border border-slate-800/80 flex items-center justify-center overflow-hidden select-none">
      {/* Three.js 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Screen Count Badge */}
      <div className="absolute top-3.5 left-4 flex items-center gap-2 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080d1a]/90 border border-slate-800 text-xs font-mono text-slate-300 backdrop-blur-sm shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-semibold">40 Screens Tiled</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-400">Contiguous Video Sphere</span>
        </div>
      </div>

      {/* Hovered Camera Tooltip */}
      {hoveredCam && (
        <div className="absolute top-3.5 right-4 z-10 pointer-events-none animate-in fade-in">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-xs font-mono text-cyan-200 backdrop-blur-sm shadow-lg">
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Click to pop out: <strong>{hoveredCam.name}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 3D Cardinal Compass Markers */}
      <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#080d1a]/85 border border-slate-800 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="text-[10px] font-mono font-bold text-cyan-300">
            N • 000°
          </span>
        </div>
      </div>

      <div className="absolute bottom-14 inset-x-0 flex justify-center pointer-events-none z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#080d1a]/85 border border-slate-800 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="text-[10px] font-mono font-bold text-cyan-300">
            S • 180°
          </span>
        </div>
      </div>

      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#080d1a]/85 border border-slate-800 backdrop-blur-sm">
          <span className="text-[10px] font-mono font-bold text-cyan-300">
            W
          </span>
        </div>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#080d1a]/85 border border-slate-800 backdrop-blur-sm">
          <span className="text-[10px] font-mono font-bold text-cyan-300">
            E
          </span>
        </div>
      </div>

      {/* Bottom Guidance & Pop-out Indicator */}
      <div className="absolute bottom-3.5 inset-x-0 flex items-center justify-center gap-3 pointer-events-auto z-20">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080d1a]/90 border border-slate-800 backdrop-blur-sm shadow-md">
          <MousePointer className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-xs text-slate-200 font-normal">
            Click any screen to{" "}
            <span className="text-cyan-400 font-semibold">
              pop out into full view
            </span>{" "}
            • Drag to rotate 3D sphere
          </span>
        </div>

        <button
          onClick={handleResetRotation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#080d1a] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors shadow-sm"
          title="Reset 3D Sphere Alignment"
        >
          <RotateCcw className="w-3 h-3 text-cyan-400" />
          <span>Reset View</span>
        </button>
      </div>
    </div>
  );
}

export default LiveSphere;
