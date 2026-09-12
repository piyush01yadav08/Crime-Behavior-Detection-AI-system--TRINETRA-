/**
 * Analytics Service
 * TRINETRA AI Surveillance System
 */

import {
  ANALYTICS_METRICS,
  ALERTS_OVER_TIME,
  BEHAVIOR_DISTRIBUTION,
  RISK_LEVEL_DISTRIBUTION,
  CAMERA_INCIDENTS,
  LOCATION_DISTRIBUTION
} from "../data/analytics";
import { api } from "./api";

const USE_MOCK = true;

class AnalyticsService {
  async getMetrics() {
    if (!USE_MOCK) {
      try {
        return await api.get("/analytics/summary/");
      } catch (e) {
        console.warn("Falling back to local analytics metrics");
      }
    }
    return Promise.resolve({ ...ANALYTICS_METRICS });
  }

  async getAlertsOverTime(timeframe = "24h") {
    if (!USE_MOCK) {
      return await api.get("/analytics/alerts-over-time/", { timeframe });
    }
    return Promise.resolve([...ALERTS_OVER_TIME]);
  }

  async getBehaviorDistribution() {
    if (!USE_MOCK) {
      return await api.get("/analytics/behaviors/");
    }
    return Promise.resolve([...BEHAVIOR_DISTRIBUTION]);
  }

  async getRiskDistribution() {
    if (!USE_MOCK) {
      return await api.get("/analytics/risk-levels/");
    }
    return Promise.resolve([...RISK_LEVEL_DISTRIBUTION]);
  }

  async getCameraIncidents() {
    if (!USE_MOCK) {
      return await api.get("/analytics/camera-incidents/");
    }
    return Promise.resolve([...CAMERA_INCIDENTS]);
  }

  async getLocationDistribution() {
    if (!USE_MOCK) {
      return await api.get("/analytics/locations/");
    }
    return Promise.resolve([...LOCATION_DISTRIBUTION]);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
