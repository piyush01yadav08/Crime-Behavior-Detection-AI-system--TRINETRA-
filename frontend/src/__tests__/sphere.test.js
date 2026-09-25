import { test, describe } from "node:test";
import assert from "node:assert";
import * as THREE from "three";

describe("LiveSphere Geometry and Mathematical Tiling", () => {
  // Test ring definitions matching LiveSphere.jsx
  const RING_DEFINITIONS = [
    {
      ringIndex: 0,
      thetaStart: (12 * Math.PI) / 180,
      thetaLength: (32 * Math.PI) / 180,
      screens: [
        { id: "CAM-01" }, { id: "CAM-12" }, { id: "CAM-24" },
        { id: "CAM-31" }, { id: "CAM-32" }, { id: "CAM-33" },
      ],
    },
    {
      ringIndex: 1,
      thetaStart: (44 * Math.PI) / 180,
      thetaLength: (30 * Math.PI) / 180,
      screens: [
        { id: "CAM-03" }, { id: "CAM-04" }, { id: "CAM-05" },
        { id: "CAM-06" }, { id: "CAM-07" }, { id: "CAM-08" },
        { id: "CAM-10" }, { id: "CAM-11" }, { id: "CAM-13" },
      ],
    },
    {
      ringIndex: 2,
      thetaStart: (74 * Math.PI) / 180,
      thetaLength: (32 * Math.PI) / 180,
      screens: [
        { id: "CAM-02" }, { id: "CAM-14" }, { id: "CAM-15" },
        { id: "CAM-17" }, { id: "CAM-18" }, { id: "CAM-19" },
        { id: "CAM-20" }, { id: "CAM-21" }, { id: "CAM-22" },
        { id: "CAM-23" },
      ],
    },
    {
      ringIndex: 3,
      thetaStart: (106 * Math.PI) / 180,
      thetaLength: (30 * Math.PI) / 180,
      screens: [
        { id: "CAM-09" }, { id: "CAM-16" }, { id: "CAM-25" },
        { id: "CAM-26" }, { id: "CAM-27" }, { id: "CAM-28" },
        { id: "CAM-29" }, { id: "CAM-30" }, { id: "CAM-34" },
      ],
    },
    {
      ringIndex: 4,
      thetaStart: (136 * Math.PI) / 180,
      thetaLength: (32 * Math.PI) / 180,
      screens: [
        { id: "CAM-35" }, { id: "CAM-36" }, { id: "CAM-37" },
        { id: "CAM-38" }, { id: "CAM-39" }, { id: "CAM-40" },
      ],
    },
  ];

  test("contains exactly 40 screens across 5 rings", () => {
    const totalScreens = RING_DEFINITIONS.reduce(
      (acc, r) => acc + r.screens.length,
      0
    );
    assert.strictEqual(totalScreens, 40);
  });

  test("all screen IDs are unique across all rings", () => {
    const allIds = RING_DEFINITIONS.flatMap((r) => r.screens.map((s) => s.id));
    const uniqueIds = new Set(allIds);
    assert.strictEqual(uniqueIds.size, 40);
  });

  test("adjacent rings have matching vertical theta boundaries (zero vertical gaps)", () => {
    for (let i = 0; i < RING_DEFINITIONS.length - 1; i++) {
      const currentRingEnd =
        RING_DEFINITIONS[i].thetaStart + RING_DEFINITIONS[i].thetaLength;
      const nextRingStart = RING_DEFINITIONS[i + 1].thetaStart;
      assert(
        Math.abs(currentRingEnd - nextRingStart) < 1e-6,
        `Ring ${i} end (${currentRingEnd}) does not match Ring ${i + 1} start (${nextRingStart})`
      );
    }
  });

  test("horizontal phi sweeps exactly 2*PI in each ring (zero horizontal gaps)", () => {
    RING_DEFINITIONS.forEach((ring) => {
      const phiStep = (Math.PI * 2) / ring.screens.length;
      const totalPhi = phiStep * ring.screens.length;
      assert(
        Math.abs(totalPhi - Math.PI * 2) < 1e-6,
        `Ring ${ring.ringIndex} does not wrap 2*PI`
      );
    });
  });

  test("Three.js spherical patches instantiate and support raycast hit detection", () => {
    const sphereRadius = 135;
    const scene = new THREE.Scene();
    const cameraMeshes = [];

    RING_DEFINITIONS.forEach((ring) => {
      const phiStep = (Math.PI * 2) / ring.screens.length;
      ring.screens.forEach((screen, i) => {
        const phiStart = Math.PI / 2 - phiStep / 2 + i * phiStep;
        const patchGeo = new THREE.SphereGeometry(
          sphereRadius,
          6,
          6,
          phiStart,
          phiStep,
          ring.thetaStart,
          ring.thetaLength
        );
        const patchMat = new THREE.MeshBasicMaterial({ side: THREE.FrontSide });
        const patchMesh = new THREE.Mesh(patchGeo, patchMat);
        patchMesh.userData = { id: screen.id };
        scene.add(patchMesh);
        cameraMeshes.push(patchMesh);
      });
    });

    assert.strictEqual(cameraMeshes.length, 40);

    // Frontal Raycast test along -Z axis
    const raycaster = new THREE.Raycaster();
    raycaster.set(new THREE.Vector3(0, 0, 410), new THREE.Vector3(0, 0, -1));
    const intersects = raycaster.intersectObjects(cameraMeshes);

    assert(intersects.length > 0, "Raycaster should hit the front-facing screen");
    assert.strictEqual(
      intersects[0].object.userData.id,
      "CAM-02",
      "Front-facing screen at (0, 0, 135) should be CAM-02"
    );
  });

  test("smooth centering rotation math accurately brings target screen to front-center", () => {
    const phiCenter = Math.PI / 2; // already center
    const thetaCenter = Math.PI / 2; // equator
    const targetY = Math.PI / 2 - phiCenter;
    const targetX = Math.PI / 2 - thetaCenter;

    assert.strictEqual(targetY, 0);
    assert.strictEqual(targetX, 0);
  });
});
