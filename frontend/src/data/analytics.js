/**
 * Centralized Analytics Mock Data
 * TRINETRA AI Surveillance System
 */

export const ANALYTICS_METRICS = {
  totalEvents: 1420,
  criticalEvents: 28,
  highEvents: 74,
  mediumEvents: 215,
  lowEvents: 1103,
  activeCameras: 11,
  offlineCameras: 1,
  totalCameras: 12,
  trackedPersonsToday: 384,
  avgRiskScore: 41.8,
  systemUptime: "99.85%",
  avgDetectionLatency: "48 ms"
};

// 24-hour timeline of alerts by severity for Area / Line Chart
export const ALERTS_OVER_TIME = [
  { time: "00:00", critical: 0, high: 2, medium: 5, low: 22, total: 29 },
  { time: "02:00", critical: 1, high: 1, medium: 3, low: 14, total: 19 },
  { time: "04:00", critical: 2, high: 3, medium: 4, low: 11, total: 20 },
  { time: "06:00", critical: 0, high: 2, medium: 8, low: 35, total: 45 },
  { time: "08:00", critical: 3, high: 6, medium: 18, low: 88, total: 115 },
  { time: "10:00", critical: 2, high: 8, medium: 26, low: 124, total: 160 },
  { time: "12:00", critical: 4, high: 11, medium: 31, low: 142, total: 188 },
  { time: "14:00", critical: 3, high: 7, medium: 24, low: 118, total: 152 },
  { time: "16:00", critical: 2, high: 9, medium: 29, low: 135, total: 175 },
  { time: "18:00", critical: 5, high: 12, medium: 34, low: 162, total: 213 },
  { time: "20:00", critical: 4, high: 8, medium: 21, low: 98, total: 131 },
  { time: "22:00", critical: 2, high: 5, medium: 12, low: 54, total: 73 }
];

// Behavior Categories breakdown for Bar Chart
export const BEHAVIOR_DISTRIBUTION = [
  { name: "Aggressive Interaction", count: 46, color: "#ef4444" },
  { name: "Restricted Area Breach", count: 38, color: "#f97316" },
  { name: "Loitering Pattern", count: 112, color: "#f59e0b" },
  { name: "Pursuit / Chasing", count: 19, color: "#38bdf8" },
  { name: "Fall / Collapse", count: 14, color: "#a855f7" },
  { name: "Crowd Panic Pattern", count: 8, color: "#ec4899" },
  { name: "Helmet / PPE Violation", count: 64, color: "#10b981" }
];

// Risk Level Distribution for Donut Chart
export const RISK_LEVEL_DISTRIBUTION = [
  { name: "Low", value: 1103, color: "#10b981" },
  { name: "Medium", value: 215, color: "#f59e0b" },
  { name: "High", value: 74, color: "#f97316" },
  { name: "Critical", value: 28, color: "#ef4444" }
];

// Incidents by Camera ranking
export const CAMERA_INCIDENTS = [
  { camera: "CAM-02 City Road", alerts: 68, critical: 8, riskAvg: 64 },
  { camera: "CAM-14 East Warehouse", alerts: 54, critical: 11, riskAvg: 72 },
  { camera: "CAM-09 Backyard Fence", alerts: 42, critical: 6, riskAvg: 68 },
  { camera: "CAM-07 2F Corridor", alerts: 37, critical: 1, riskAvg: 48 },
  { camera: "CAM-01 Main Gate", alerts: 31, critical: 2, riskAvg: 42 },
  { camera: "CAM-18 Loading Bay", alerts: 26, critical: 0, riskAvg: 38 },
  { camera: "CAM-05 Cafeteria", alerts: 22, critical: 0, riskAvg: 35 },
  { camera: "CAM-12 Parking Lot", alerts: 18, critical: 0, riskAvg: 29 }
];

// Incidents by Location breakdown
export const LOCATION_DISTRIBUTION = [
  { location: "North Corridor & Roads", incidents: 84 },
  { location: "Perimeter & Outer Fences", incidents: 72 },
  { location: "Logistics & Storage Hubs", incidents: 61 },
  { location: "Indoor Corridors & Hallways", incidents: 49 },
  { location: "Central Dining & Public Areas", incidents: 34 },
  { location: "Parking Structures", incidents: 25 }
];
