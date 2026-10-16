/**
 * Alert Management Service
 * TRINETRA AI Surveillance System
 * 
 * Supports full alert lifecycle (New -> Acknowledged -> Escalated -> Resolved).
 * Remote-first with dynamic local cache fallback and reactive listeners.
 * Listens to real-time WebSocket alert events to update alerts reactively.
 */

import { ALERTS_DATA } from "../data/alerts.js";
import { api } from "./api.js";
import { wsService } from "./websocketService.js";

const USE_MOCK = false;

// In-memory state for local mutability during demo or offline fallback
let alertsCache = [...ALERTS_DATA];

class AlertService {
  _listeners = new Set();

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notifyListeners() {
    this._listeners.forEach((fn) => fn([...alertsCache]));
  }

  async getAll(filters = {}) {
    return this.getAlerts(filters);
  }

  async getAlerts(filters = {}) {
    if (!USE_MOCK) {
      try {
        const remote = await api.get("/alerts/", filters);
        if (Array.isArray(remote)) {
          alertsCache = remote;
          this._notifyListeners();
          return remote;
        }
      } catch (e) {
        // Fall back gracefully to cache
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
        const remote = await api.get(`/alerts/${id}/`);
        if (remote && remote.id) {
          return remote;
        }
      } catch (e) {
        // Fall back to cache
      }
    }
    const alert = alertsCache.find((a) => a.id === id);
    return Promise.resolve(alert ? { ...alert } : null);
  }

  async updateAlertStatus(id, newStatus, operatorNotes = "") {
    let updatedAlert = null;
    if (!USE_MOCK) {
      try {
        updatedAlert = await api.patch(`/alerts/${id}/`, { status: newStatus, operatorNotes });
      } catch (e) {
        // Fall back to local update
      }
    }

    alertsCache = alertsCache.map((alert) => {
      if (alert.id === id) {
        return {
          ...alert,
          ...(updatedAlert || {}),
          status: newStatus,
          lastUpdated: new Date().toISOString(),
          operatorNotes: operatorNotes || alert.operatorNotes,
        };
      }
      return alert;
    });

    const updated = alertsCache.find((a) => a.id === id);
    this._notifyListeners();
    return Promise.resolve(updated || updatedAlert);
  }

  async acknowledgeAlert(id, notes = "") {
    return this.updateAlertStatus(id, "ACKNOWLEDGED", notes);
  }

  async acknowledge(id, notes = "") {
    return this.acknowledgeAlert(id, notes);
  }

  async escalateAlert(id, notes = "") {
    return this.updateAlertStatus(id, "ESCALATED", notes);
  }

  async escalate(id, notes = "") {
    return this.escalateAlert(id, notes);
  }

  async resolveAlert(id, notes = "") {
    return this.updateAlertStatus(id, "RESOLVED", notes);
  }

  async resolve(id, notes = "") {
    return this.resolveAlert(id, notes);
  }
}

export const alertService = new AlertService();

// Connect real-time WebSocket alert events to reactive alerts cache
wsService.subscribe("new_alert", (newAlert) => {
  if (newAlert && newAlert.id) {
    const existingIndex = alertsCache.findIndex((a) => a.id === newAlert.id);
    if (existingIndex >= 0) {
      alertsCache[existingIndex] = { ...alertsCache[existingIndex], ...newAlert };
    } else {
      alertsCache.unshift(newAlert);
    }
    alertService._notifyListeners();
  }
});

wsService.subscribe("alert_update", (updatedAlert) => {
  if (updatedAlert && updatedAlert.id) {
    alertsCache = alertsCache.map((a) => (a.id === updatedAlert.id ? { ...a, ...updatedAlert } : a));
    alertService._notifyListeners();
  }
});

export default alertService;
