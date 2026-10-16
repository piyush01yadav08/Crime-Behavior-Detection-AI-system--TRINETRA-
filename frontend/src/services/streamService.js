/**
 * Stream & AI Engine Integration Service
 * TRINETRA AI Surveillance System
 */

import { api } from "./api.js";

const STREAM_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_STREAM_URL) ||
  "http://localhost:8000/api/v1/stream";

class StreamService {
  getStreamUrl(cameraId = "CAM-02") {
    return `${STREAM_URL}/feed/${cameraId}`;
  }

  getLiveStreamUrl() {
    return `${STREAM_URL}/live`;
  }

  getSnapshotUrl() {
    return `${STREAM_URL}/snapshot`;
  }

  async getTelemetry() {
    try {
      return await api.get("/stream/telemetry");
    } catch (e) {
      return null;
    }
  }

  async getAiStatus() {
    try {
      return await api.get("/ai/status");
    } catch (e) {
      return null;
    }
  }

  async setStreamMode(mode) {
    try {
      return await api.post("/stream/mode", { mode });
    } catch (e) {
      console.warn("Could not set stream mode on backend:", e);
      return { mode };
    }
  }

  async updateLoiteringSettings(distanceThreshold, timeThreshold) {
    try {
      return await api.post("/ai/loitering/settings", {
        distanceThreshold,
        timeThreshold,
      });
    } catch (e) {
      console.warn("Could not update loitering settings:", e);
      return null;
    }
  }

  async triggerLoiteringDemo() {
    try {
      return await api.post("/ai/trigger-loitering-demo", {});
    } catch (e) {
      console.warn("Could not trigger demo loitering alert:", e);
      return null;
    }
  }
}

export const streamService = new StreamService();
export default streamService;
