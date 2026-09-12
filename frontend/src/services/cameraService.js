/**
 * Camera Service
 * TRINETRA AI Surveillance System
 * 
 * Manages camera streams, statuses, and metadata.
 * Initially powered by high-fidelity mock data; switchable to Django REST API.
 */

import { CAMERAS_DATA } from "../data/cameras";
import { api } from "./api";

// Flag to switch between local mock data and real backend API
const USE_MOCK = true;

class CameraService {
  async getAllCameras() {
    if (!USE_MOCK) {
      try {
        return await api.get("/cameras/");
      } catch (e) {
        console.warn("Falling back to local camera data");
      }
    }
    // Simulate network delay for realistic feel
    return new Promise((resolve) => {
      setTimeout(() => resolve([...CAMERAS_DATA]), 80);
    });
  }

  async getCameraById(id) {
    if (!USE_MOCK) {
      try {
        return await api.get(`/cameras/${id}/`);
      } catch (e) {
        console.warn(`Falling back to mock for camera ${id}`);
      }
    }
    const camera = CAMERAS_DATA.find((c) => c.id === id) || CAMERAS_DATA[0];
    return Promise.resolve({ ...camera });
  }

  async updateCameraStatus(id, newStatus) {
    if (!USE_MOCK) {
      return await api.patch(`/cameras/${id}/`, { status: newStatus });
    }
    const camera = CAMERAS_DATA.find((c) => c.id === id);
    if (camera) {
      camera.status = newStatus;
    }
    return Promise.resolve(camera);
  }
}

export const cameraService = new CameraService();
export default cameraService;
