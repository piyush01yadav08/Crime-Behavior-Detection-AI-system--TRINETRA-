/**
 * Real-Time Activity Event Stream Mock Data
 * TRINETRA AI Surveillance System
 */

export const ACTIVITY_FEED = [
  {
    id: "act-1",
    time: "10:24:15 PM",
    camera: "CAM-02",
    cameraName: "City Road",
    eventType: "Aggressive Interaction Detected",
    description: "Rapid approach acceleration and hostile vectors flagged between 2 subjects.",
    riskLevel: "HIGH",
    riskScore: 87,
    personId: "TRK-104",
    iconType: "flame"
  },
  {
    id: "act-2",
    time: "10:22:05 PM",
    camera: "CAM-14",
    cameraName: "East Warehouse",
    eventType: "Restricted Area Breach",
    description: "Unregistered subject crossed virtual security line into Bay 3.",
    riskLevel: "CRITICAL",
    riskScore: 92,
    personId: "TRK-215",
    iconType: "shield-alert"
  },
  {
    id: "act-3",
    time: "10:19:40 PM",
    camera: "CAM-02",
    cameraName: "City Road",
    eventType: "Helmet Safety Violation",
    description: "Two-wheeler operator detected traveling without certified protective headgear.",
    riskLevel: "MEDIUM",
    riskScore: 54,
    personId: "TRK-108",
    iconType: "alert-triangle"
  },
  {
    id: "act-4",
    time: "10:18:12 PM",
    camera: "CAM-07",
    cameraName: "Corridor",
    eventType: "Loitering Pattern Confirmed",
    description: "Subject stationary near office 204 for exceeding 15 minutes.",
    riskLevel: "MEDIUM",
    riskScore: 58,
    personId: "TRK-087",
    iconType: "clock"
  },
  {
    id: "act-5",
    time: "10:14:33 PM",
    camera: "CAM-09",
    cameraName: "Backyard",
    eventType: "Perimeter Barrier Scaling",
    description: "IR silhouette detected ascending boundary fence at southern corner.",
    riskLevel: "CRITICAL",
    riskScore: 94,
    personId: "TRK-192",
    iconType: "shield-alert"
  },
  {
    id: "act-6",
    time: "10:10:02 PM",
    camera: "CAM-01",
    cameraName: "Main Gate",
    eventType: "Abnormal Vehicle Influx",
    description: "High volume cluster of 6 vehicles detected within 90-second entry window.",
    riskLevel: "LOW",
    riskScore: 32,
    personId: "VEH-POOL",
    iconType: "car"
  },
  {
    id: "act-7",
    time: "10:05:48 PM",
    camera: "CAM-03",
    cameraName: "Reception",
    eventType: "Visitor Badge Verification",
    description: "DeepSORT linked TRK-099 successfully logged with security badge #881.",
    riskLevel: "LOW",
    riskScore: 18,
    personId: "TRK-099",
    iconType: "check"
  },
  {
    id: "act-8",
    time: "09:55:20 PM",
    camera: "CAM-12",
    cameraName: "Parking",
    eventType: "Normal Patrol Scan Completed",
    description: "Autonomous optical sweep verified 24 parked vehicles and clear transit lanes.",
    riskLevel: "LOW",
    riskScore: 12,
    personId: "SYS-AUTO",
    iconType: "check"
  }
];
