/**
 * Alert Management Service
 * TRINETRA AI Surveillance System
 * 
 * Supports full alert lifecycle (New -> Acknowledged -> Escalated -> Resolved).
 */

import { ALERTS_DATA } from "../data/alerts";
import { api } from "./api";

const USE_MOCK = true;

// In-memory state for local mutability during demo
let alertsCache = [...ALERTS_DATA];

class AlertService {
  async getAlerts(filters = {}) {
    if (!USE_MOCK) {
      try {
        return await api.get("/alerts/", filters);
      } catch (e) {
        console.warn("Falling back to local alerts data");
      }
    }

    return new Promise((resolve) => {
      let filtered = [...alertsCache];

      if (filters.severity && filters.severity !== "ALL") {
        filtered = filtered.filter(
          (a) => a.severity.toUpperCase() === filters.severity.toUpperCase()
        );
      }

      if (filters.status && filters.status !== "ALL") {
        filtered = filtered.filter(
          (a) => a.status.toUpperCase() === filters.status.toUpperCase()
        );
      }

      if (filters.camera && filters.camera !== "ALL") {
        filtered = filtered.filter((a) => a.camera === filters.camera);
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.id.toLowerCase().includes(q) ||
            a.behavior.toLowerCase().includes(q) ||
            a.location.toLowerCase().includes(q) ||
            a.camera.toLowerCase().includes(q) ||
            (a.personId && a.personId.toLowerCase().includes(q))
        );
      }

      setTimeout(() => resolve(filtered), 60);
    });
  }

  async getAlertById(id) {
    if (!USE_MOCK) {
      try {
        return await api.get(`/alerts/${id}/`);
      } catch (e) {
        console.warn(`Falling back to local data for alert ${id}`);
      }
    }
    const alert = alertsCache.find((a) => a.id === id);
    return Promise.resolve(alert ? { ...alert } : null);
  }

  async updateAlertStatus(id, newStatus, operatorNotes = "") {
    if (!USE_MOCK) {
      return await api.patch(`/alerts/${id}/`, { status: newStatus, operatorNotes });
    }

    alertsCache = alertsCache.map((alert) => {
      if (alert.id === id) {
        return {
          ...alert,
          status: newStatus,
          lastUpdated: new Date().toISOString(),
          operatorNotes: operatorNotes || alert.operatorNotes
        };
      }
      return alert;
    });

    const updated = alertsCache.find((a) => a.id === id);
    return Promise.resolve(updated);
  }

  async acknowledgeAlert(id) {
    return this.updateAlertStatus(id, "ACKNOWLEDGED");
  }

  async escalateAlert(id) {
    return this.updateAlertStatus(id, "ESCALATED");
  }

  async resolveAlert(id, notes) {
    return this.updateAlertStatus(id, "RESOLVED", notes);
  }
}

export const alertService = new AlertService();
export default alertService;
