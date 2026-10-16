/**
 * Analytics Service
 * TRINETRA AI Surveillance System
 * 
 * Remote-first with dynamic local mock fallback.
 */

import {
  ANALYTICS_METRICS,
  ALERTS_OVER_TIME,
  BEHAVIOR_DISTRIBUTION,
  RISK_LEVEL_DISTRIBUTION,
  CAMERA_INCIDENTS,
  LOCATION_DISTRIBUTION
} from "../data/analytics.js";
import { api } from "./api.js";

const USE_MOCK = false;

class AnalyticsService {
  async getSummary(timeframe = "24h") {
    const metrics = await this.getMetrics();
    return {
      totalAlerts: metrics.totalEvents,
      criticalCount: metrics.criticalEvents,
      highCount: metrics.highEvents,
      mediumCount: metrics.mediumEvents,
      lowCount: metrics.lowEvents,
      ...metrics
    };
  }

  async getMetrics() {
    if (!USE_MOCK) {
      try {
        const remote = await api.get("/analytics/summary/");
        if (remote && typeof remote.totalEvents === "number") {
          return remote;
        }
      } catch (e) {
        // Fall back gracefully to local analytics metrics
      }
    }
    return Promise.resolve({ ...ANALYTICS_METRICS });
  }

  async getAlertsOverTime(timeframe = "24h") {
    if (!USE_MOCK) {
      try {
        const remote = await api.get("/analytics/alerts-over-time/", { timeframe });
        if (Array.isArray(remote) && remote.length > 0) {
          return remote;
        }
      } catch (e) {
        // Fall back gracefully
      }
    }
    return Promise.resolve([...ALERTS_OVER_TIME]);
  }

  async getBehaviorDistribution() {
    if (!USE_MOCK) {
      try {
        const remote = await api.get("/analytics/behaviors/");
        if (Array.isArray(remote) && remote.length > 0) {
          return remote;
        }
      } catch (e) {
        // Fall back gracefully
      }
    }
    return Promise.resolve([...BEHAVIOR_DISTRIBUTION]);
  }

  async getRiskDistribution() {
    if (!USE_MOCK) {
      try {
        const remote = await api.get("/analytics/risk-levels/");
        if (Array.isArray(remote) && remote.length > 0) {
          return remote;
        }
      } catch (e) {
        // Fall back gracefully
      }
    }
    return Promise.resolve([...RISK_LEVEL_DISTRIBUTION]);
  }

  async getCameraIncidents() {
    if (!USE_MOCK) {
      try {
        const remote = await api.get("/analytics/camera-incidents/");
        if (Array.isArray(remote) && remote.length > 0) {
          return remote;
        }
      } catch (e) {
        // Fall back gracefully
      }
    }
    return Promise.resolve([...CAMERA_INCIDENTS]);
  }

  async getLocationDistribution() {
    if (!USE_MOCK) {
      try {
        const remote = await api.get("/analytics/locations/");
        if (Array.isArray(remote) && remote.length > 0) {
          return remote;
        }
      } catch (e) {
        // Fall back gracefully
      }
    }
    return Promise.resolve([...LOCATION_DISTRIBUTION]);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
