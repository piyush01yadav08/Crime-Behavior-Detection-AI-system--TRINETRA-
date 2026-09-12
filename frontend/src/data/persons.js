/**
 * Tracked Persons Surveillance Mock Data
 * TRINETRA AI Surveillance System
 */

export const PERSONS_DATA = [
  {
    trackingId: "TRK-102",
    label: "Person #102",
    lastSeenCamera: "CAM-02",
    lastSeenLocation: "City Road - Crossing North",
    lastSeenTime: "10:24:12 PM",
    status: "TRACKED", // TRACKED, WATCHLIST, LOST, CLEARED
    riskLevel: "MEDIUM",
    riskScore: 55,
    speed: "1.4 m/s",
    heading: "North-West",
    dwellTime: "4m 12s",
    appearance: "Dark hooded jacket, blue jeans, dark backpack",
    associatedAlerts: ["TR-1042"],
    detectionConfidence: "96.4%",
    trajectoryPath: [
      { camera: "CAM-01", time: "10:15 PM", event: "Entered campus pedestrian lane" },
      { camera: "CAM-02", time: "10:20 PM", event: "Crossed City Road intersection" },
      { camera: "CAM-02", time: "10:24 PM", event: "Observed near confrontation zone" }
    ]
  },
  {
    trackingId: "TRK-104",
    label: "Person #104",
    lastSeenCamera: "CAM-02",
    lastSeenLocation: "City Road - Sidewalk",
    lastSeenTime: "10:24:16 PM",
    status: "WATCHLIST",
    riskLevel: "HIGH",
    riskScore: 87,
    speed: "2.8 m/s",
    heading: "South-East",
    dwellTime: "2m 45s",
    appearance: "Red sports windbreaker, white trainers",
    associatedAlerts: ["TR-1042"],
    detectionConfidence: "98.1%",
    trajectoryPath: [
      { camera: "CAM-02", time: "10:21 PM", event: "Rapid acceleration into frame" },
      { camera: "CAM-02", time: "10:24 PM", event: "High velocity physical confrontation vector" }
    ]
  },
  {
    trackingId: "TRK-215",
    label: "Person #215",
    lastSeenCamera: "CAM-14",
    lastSeenLocation: "East Warehouse - Bay 3",
    lastSeenTime: "10:22:05 PM",
    status: "WATCHLIST",
    riskLevel: "CRITICAL",
    riskScore: 92,
    speed: "0.8 m/s (Crouched)",
    heading: "East",
    dwellTime: "6m 30s",
    appearance: "Black tactical sweater, dark cargo pants, cap",
    associatedAlerts: ["TR-1044"],
    detectionConfidence: "94.8%",
    trajectoryPath: [
      { camera: "CAM-09", time: "10:14 PM", event: "Foliage silhouette flagged" },
      { camera: "CAM-14", time: "10:22 PM", event: "Breached Bay 3 virtual security tripwire" }
    ]
  },
  {
    trackingId: "TRK-087",
    label: "Person #087",
    lastSeenCamera: "CAM-07",
    lastSeenLocation: "Corridor - Wing C 2F",
    lastSeenTime: "10:18:12 PM",
    status: "TRACKED",
    riskLevel: "MEDIUM",
    riskScore: 58,
    speed: "0.1 m/s (Stationary)",
    heading: "Facing Office 204",
    dwellTime: "19m 20s",
    appearance: "Grey sweater, glasses, carrying folder",
    associatedAlerts: ["TR-1039"],
    detectionConfidence: "97.5%",
    trajectoryPath: [
      { camera: "CAM-03", time: "09:50 PM", event: "Passed admin lobby" },
      { camera: "CAM-07", time: "09:58 PM", event: "Loitering timer initiated at 2F" }
    ]
  },
  {
    trackingId: "TRK-192",
    label: "Person #192",
    lastSeenCamera: "CAM-09",
    lastSeenLocation: "Backyard - Perimeter Garden",
    lastSeenTime: "10:14:33 PM",
    status: "WATCHLIST",
    riskLevel: "CRITICAL",
    riskScore: 94,
    speed: "1.9 m/s",
    heading: "North-North-West",
    dwellTime: "1m 15s",
    appearance: "Dark outerwear, gloves, face covering",
    associatedAlerts: ["TR-1038"],
    detectionConfidence: "91.2%",
    trajectoryPath: [
      { camera: "CAM-09", time: "10:14 PM", event: "Thermal scaling over perimeter barrier" }
    ]
  },
  {
    trackingId: "TRK-112",
    label: "Person #112",
    lastSeenCamera: "CAM-05",
    lastSeenLocation: "Central Cafeteria",
    lastSeenTime: "09:35:45 PM",
    status: "CLEARED",
    riskLevel: "LOW",
    riskScore: 22,
    speed: "0.9 m/s",
    heading: "Exit West",
    dwellTime: "25m 00s",
    appearance: "Navy polo shirt, beige trousers",
    associatedAlerts: ["TR-1035"],
    detectionConfidence: "99.0%",
    trajectoryPath: [
      { camera: "CAM-05", time: "09:35 PM", event: "Playful sprint with peer; marshal verified" }
    ]
  }
];
