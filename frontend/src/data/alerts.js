/**
 * Centralized Alerts Mock Data
 * TRINETRA AI Surveillance System
 * 
 * NOTE: When the Django backend is integrated, this mock data will be replaced by
 * dynamic API responses from Django REST Framework (e.g. GET /api/v1/alerts/)
 * and real-time websocket broadcast events via Django Channels.
 */

export const ALERTS_DATA = [
  {
    id: "TR-1044",
    camera: "CAM-14",
    cameraName: "Cam 14 - East Warehouse",
    location: "Logistics Hub East Gate",
    zone: "High Security Storage",
    behavior: "Restricted Area Violation",
    riskScore: 92,
    severity: "CRITICAL",
    timestamp: "2026-08-26T22:22:15",
    timeFormatted: "10:22 PM",
    status: "NEW", // NEW, ACKNOWLEDGED, ESCALATED, RESOLVED
    personId: "TRK-215",
    description: "Individual bypassed perimeter fence sensor and entered restricted storage bay without authorized RFID badge.",
    trajectory: [
      { time: "22:21:40", note: "Motion detected near East perimeter fence" },
      { time: "22:22:05", note: "Bounding box crossed virtual tripwire #4" },
      { time: "22:22:15", note: "DeepSORT tracking ID TRK-215 assigned; anomaly risk peaked at 92%" }
    ],
    recommendedAction: "Dispatch ground patrol to East Gate perimeter immediately. Lock electronic access to Sector 3 warehouse doors.",
    snapshotUrl: "/camera_snapshots/cam14_incident.jpg",
    tags: ["Perimeter Breach", "Tripwire 4", "Night Alert"]
  },
  {
    id: "TR-1042",
    camera: "CAM-02",
    cameraName: "Cam 02 - City Road",
    location: "New Delhi, India",
    zone: "North Corridor Sector 4",
    behavior: "Aggressive Interaction",
    riskScore: 87,
    severity: "HIGH",
    timestamp: "2026-08-26T22:10:00",
    timeFormatted: "10:10 PM",
    status: "ACKNOWLEDGED",
    personId: "TRK-104",
    description: "Rapid approach acceleration between two pedestrians followed by physical confrontation vectors detected by movement analysis module.",
    trajectory: [
      { time: "22:09:12", note: "Two individuals converged at pedestrian crossing" },
      { time: "22:09:44", note: "High velocity closing speed (>3.2 m/s) flagged by optical flow" },
      { time: "22:10:00", note: "Aggressive body posture and sudden deceleration trigger risk score 87" }
    ],
    recommendedAction: "Alert local patrol unit 04 on City Road. Monitor secondary camera CAM-01 for crowd dispersion.",
    snapshotUrl: "/camera_snapshots/cam02_incident.jpg",
    tags: ["Confrontation", "Public Road", "Rapid Approach"]
  },
  {
    id: "TR-1039",
    camera: "CAM-07",
    cameraName: "Cam 07 - Corridor",
    location: "Academic Block Wing C",
    zone: "Secondary Hallway 2F",
    behavior: "Loitering Detection",
    riskScore: 58,
    severity: "MEDIUM",
    timestamp: "2026-08-26T22:04:30",
    timeFormatted: "10:04 PM",
    status: "NEW",
    personId: "TRK-087",
    description: "Subject stationary outside faculty office entrance for over 18 consecutive minutes outside normal operational hours.",
    trajectory: [
      { time: "21:46:00", note: "Person entered corridor from staircase B" },
      { time: "21:55:00", note: "Loitering timer exceeded 9 minutes threshold" },
      { time: "22:04:30", note: "Stationary dwelling behavior confirmed; Risk score 58" }
    ],
    recommendedAction: "Trigger corridor automated PA announcement: 'Restricted hours in effect. Please proceed to main lobby.'",
    snapshotUrl: "/camera_snapshots/cam07_incident.jpg",
    tags: ["Loitering", "Indoor Corridor", "Dwell Time"]
  },
  {
    id: "TR-1038",
    camera: "CAM-09",
    cameraName: "Cam 09 - Backyard",
    location: "South Perimeter Garden",
    zone: "Outer Fence Boundary",
    behavior: "Restricted Area Violation",
    riskScore: 94,
    severity: "CRITICAL",
    timestamp: "2026-08-26T21:58:10",
    timeFormatted: "9:58 PM",
    status: "ESCALATED",
    personId: "TRK-192",
    description: "Unidentified person scaled southern low-visibility boundary barrier under low-light conditions.",
    trajectory: [
      { time: "21:57:30", note: "IR camera detected thermal silhouette along foliage line" },
      { time: "21:57:55", note: "Elevation change detected indicating fence scaling" },
      { time: "21:58:10", note: "Subject landed inside campus perimeter; Critical alert logged" }
    ],
    recommendedAction: "Immediate dispatch of security K9 team to South Perimeter. Illuminate floodlights in Zone 9.",
    snapshotUrl: "/camera_snapshots/cam09_incident.jpg",
    tags: ["Scaling Barrier", "Perimeter Breach", "Low-Light"]
  },
  {
    id: "TR-1035",
    camera: "CAM-05",
    cameraName: "Cam 05 - Cafeteria",
    location: "Central Dining Hall",
    zone: "Public Area B",
    behavior: "Pursuit / Chase Detection",
    riskScore: 76,
    severity: "HIGH",
    timestamp: "2026-08-26T21:35:45",
    timeFormatted: "9:35 PM",
    status: "RESOLVED",
    personId: "TRK-112",
    description: "Two individuals sprinting through dining tables in high-speed pursuit trajectory.",
    trajectory: [
      { time: "21:35:10", note: "Sudden acceleration from seated area" },
      { time: "21:35:30", note: "Decreasing distance between tracking IDs TRK-112 and TRK-115" },
      { time: "21:35:45", note: "Pursuit velocity pattern confirmed" }
    ],
    recommendedAction: "Cafeteria marshal intervention verified. Event resolved as student horseplay, logged for audit.",
    snapshotUrl: "/camera_snapshots/cam05_incident.jpg",
    tags: ["Chase", "Dining Hall", "Resolved"]
  },
  {
    id: "TR-1031",
    camera: "CAM-01",
    cameraName: "Cam 01 - Main Gate",
    location: "Main Entrance Boulevard",
    zone: "Perimeter Checkpoint Alpha",
    behavior: "Crowd Panic Detection",
    riskScore: 89,
    severity: "CRITICAL",
    timestamp: "2026-08-26T20:50:12",
    timeFormatted: "8:50 PM",
    status: "RESOLVED",
    personId: "MULTIPLE",
    description: "Sudden multi-directional dispersal of 14 people from vehicle drop-off zone.",
    trajectory: [
      { time: "20:49:50", note: "Vehicle sudden backfire caused panic reaction" },
      { time: "20:50:00", note: "Optical flow vector divergence detected across 14 subjects" },
      { time: "20:50:12", note: "Panic alert generated; security checked area and confirmed false alarm." }
    ],
    recommendedAction: "All clear confirmed by Gate Sergeant. Operator marked incident as resolved with audio event note.",
    snapshotUrl: "/camera_snapshots/cam01_incident.jpg",
    tags: ["Crowd Dispersal", "Main Gate", "High Velocity"]
  },
  {
    id: "TR-1028",
    camera: "CAM-18",
    cameraName: "Cam 18 - South Loading Bay",
    location: "Commercial Dispatch Deck",
    zone: "Freight Yard South",
    behavior: "Fall Detection",
    riskScore: 82,
    severity: "HIGH",
    timestamp: "2026-08-26T19:40:00",
    timeFormatted: "7:40 PM",
    status: "RESOLVED",
    personId: "TRK-078",
    description: "Worker slipped while descending truck tailgate ramp; abrupt vertical aspect-ratio collapse detected.",
    trajectory: [
      { time: "19:39:45", note: "Worker carrying cargo container on ramp" },
      { time: "19:39:58", note: "Abrupt vertical bounding box reduction (height-to-width ratio < 0.5)" },
      { time: "19:40:00", note: "Subject remained recumbent for >10 seconds; Fall alert triggered" }
    ],
    recommendedAction: "First aid team dispatched to Bay 18. Worker received treatment for minor ankle sprain.",
    snapshotUrl: "/camera_snapshots/cam18_incident.jpg",
    tags: ["Fall Emergency", "Industrial Safety", "Medical Assist"]
  },
  {
    id: "TR-1025",
    camera: "CAM-12",
    cameraName: "Cam 12 - Parking",
    location: "Multi-level North Garage",
    zone: "Vehicle Terminal 1",
    behavior: "Loitering Detection",
    riskScore: 45,
    severity: "LOW",
    timestamp: "2026-08-26T18:15:30",
    timeFormatted: "6:15 PM",
    status: "RESOLVED",
    personId: "TRK-063",
    description: "Driver standing near parked sedan for 12 minutes while searching for lost keys.",
    trajectory: [
      { time: "18:03:00", note: "Person parked vehicle in slot B-14" },
      { time: "18:15:30", note: "Dwell time flag triggered at low severity threshold" }
    ],
    recommendedAction: "Routine surveillance; no escalation required. Subject departed safely.",
    snapshotUrl: "/camera_snapshots/cam12_incident.jpg",
    tags: ["Parking Garage", "Low Risk", "Informational"]
  }
];

export const SEVERITY_CONFIG = {
  CRITICAL: {
    label: "Critical",
    color: "#ef4444",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    badge: "bg-red-500 text-white",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.5)]"
  },
  HIGH: {
    label: "High",
    color: "#f97316",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    badge: "bg-orange-500 text-white",
    glow: "shadow-[0_0_12px_rgba(249,115,22,0.4)]"
  },
  MEDIUM: {
    label: "Medium",
    color: "#f59e0b",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    badge: "bg-amber-500 text-slate-950",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]"
  },
  LOW: {
    label: "Low",
    color: "#10b981",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    badge: "bg-emerald-500 text-white",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]"
  }
};
