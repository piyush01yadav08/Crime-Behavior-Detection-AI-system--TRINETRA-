/**
 * WebSocket Service Abstraction
 * TRINETRA AI Surveillance System
 * 
 * Supports real Django Channels WebSocket integration with bounded exponential backoff
 * and graceful fallback to telemetry simulation when running in offline or test mode.
 * Default endpoint: ws://localhost:8000/ws/surveillance/
 */

const DEFAULT_WS_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_WS_URL) ||
  "ws://localhost:8000/ws/surveillance/";

const ENABLE_REAL_WS =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_ENABLE_WEBSOCKET === "true";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.baseReconnectInterval = 1000;
    this.maxReconnectInterval = 30000;
    this.reconnectTimer = null;
    this.isConnected = false;
    this.simulatedTimer = null;
    this.isExplicitlyClosed = false;
  }

  connect(url = DEFAULT_WS_URL) {
    this.isExplicitlyClosed = false;
    const enableRealWs =
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_ENABLE_WEBSOCKET !== undefined
        ? import.meta.env.VITE_ENABLE_WEBSOCKET === "true"
        : ENABLE_REAL_WS;

    if (enableRealWs && typeof WebSocket !== "undefined") {
      try {
        if (
          this.socket &&
          (this.socket.readyState === WebSocket.OPEN ||
            this.socket.readyState === WebSocket.CONNECTING)
        ) {
          return; // Avoid duplicate connections
        }

        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          console.log("[TRINETRA WebSocket] Connected to Django Channels:", url);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
          this.emit("status_change", { connected: true });
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type) {
              this.emit(data.type, data.payload !== undefined ? data.payload : data);
            }
          } catch (err) {
            console.error("[TRINETRA WebSocket] Message parse error:", err);
          }
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          this.emit("status_change", { connected: false });
          if (!this.isExplicitlyClosed) {
            const delay = Math.min(
              this.baseReconnectInterval * Math.pow(1.5, this.reconnectAttempts),
              this.maxReconnectInterval
            );
            this.reconnectAttempts++;
            this.reconnectTimer = setTimeout(() => this.connect(url), delay);
          }
        };

        this.socket.onerror = (err) => {
          console.warn("[TRINETRA WebSocket] Stream error:", err);
        };
      } catch (err) {
        console.warn("[TRINETRA WebSocket] Could not establish connection, using simulation:", err);
        this.startSimulation();
      }
    } else {
      // In development / demo mode or test runner, start gentle real-time simulation
      this.startSimulation();
    }
  }

  startSimulation() {
    if (this.simulatedTimer) return;
    this.isConnected = true;

    // Periodically simulate minor telemetry updates (e.g. slight detection count shifts)
    this.simulatedTimer = setInterval(() => {
      this.emit("telemetry_update", {
        timestamp: new Date().toLocaleTimeString(),
        fps: 29 + Math.floor(Math.random() * 2),
        bitrate: (3.8 + Math.random() * 0.5).toFixed(1) + " Mbps",
      });
    }, 4000);
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const set = this.listeners.get(eventType);
    if (!set.has(callback)) {
      set.add(callback);
    }

    // Return unsubscription function
    return () => this.unsubscribe(eventType, callback);
  }

  unsubscribe(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in WebSocket subscriber for ${eventType}:`, e);
        }
      });
    }
  }

  send(data) {
    if (this.socket && typeof WebSocket !== "undefined" && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("[TRINETRA WebSocket] Cannot send message, socket not open");
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.simulatedTimer) {
      clearInterval(this.simulatedTimer);
      this.simulatedTimer = null;
    }
    this.isConnected = false;
  }
}

export const wsService = new WebSocketService();
export default wsService;
