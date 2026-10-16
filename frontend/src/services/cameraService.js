/**
 * Camera Service
 * TRINETRA AI Surveillance System
 * 
 * Manages camera streams, statuses, and metadata.
 * Remote-first with dynamic local cache fallback.
 */

import { CAMERAS_DATA } from "../data/cameras.js";
import { api } from "./api.js";

// In-memory cameras copy for live state updates
let camerasCache = CAMERAS_DATA.map((c) => ({ ...c }));

class CameraService {
  async getAll(forceRemote = true) {
    if (forceRemote) {
      try {
        const remote = await api.get("/cameras/");
        if (Array.isArray(remote) && remote.length > 0) {
          camerasCache = remote;
          return remote;
        }
      } catch (e) {
        // Fall back gracefully to cache
      }
    }
    return Promise.resolve([...camerasCache]);
  }

  async getAllCameras(forceRemote = true) {
    return this.getAll(forceRemote);
  }

  async getById(id, forceRemote = false) {
    if (forceRemote) {
      try {
        const remote = await api.get(`/cameras/${id}/`);
        if (remote && remote.id) {
          return remote;
        }
      } catch (e) {
        // Fall back to cache
      }
    }
    const camera = camerasCache.find((c) => c.id === id);
    return Promise.resolve(camera ? { ...camera } : undefined);
  }

  async getCameraById(id) {
    return this.getById(id);
  }

  async updateCameraStatus(id, newStatus) {
    try {
      await api.patch(`/cameras/${id}/`, { status: newStatus });
    } catch (e) {
      // offline / mock fallback
    }
    const camera = camerasCache.find((c) => c.id === id);
    if (camera) {
      camera.status = newStatus;
      this._notifyListeners();
    }
    return Promise.resolve(camera);
  }

  async addCamera(cameraData) {
    let newCam = null;
    try {
      const created = await api.post("/cameras/", cameraData);
      if (created && created.id) {
        newCam = created;
      }
    } catch (e) {
      // Local fallback
    }

    if (!newCam) {
      newCam = {
        ...cameraData,
        id: cameraData.id || `CAM-${String(camerasCache.length + 1).padStart(2, "0")}`,
        status: cameraData.status || "NORMAL",
        isLive: true,
        fps: cameraData.fps || 30,
        resolution: cameraData.resolution || "1920 x 1080",
        uptime: "100%",
        detections: {
          vehicles: 0,
          pedestrians: 0,
          helmetViolations: 0,
          suspiciousActivity: 0,
          trackedPersons: 0,
          restrictedViolations: 0,
        },
      };
    }

    // Insert or update in cache
    const existingIdx = camerasCache.findIndex((c) => c.id === newCam.id);
    if (existingIdx >= 0) {
      camerasCache[existingIdx] = newCam;
    } else {
      camerasCache.unshift(newCam);
    }

    this._notifyListeners();
    return Promise.resolve(newCam);
  }

  _listeners = new Set();

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notifyListeners() {
    this._listeners.forEach((fn) => fn([...camerasCache]));
  }
}

export const cameraService = new CameraService();
export default cameraService;
