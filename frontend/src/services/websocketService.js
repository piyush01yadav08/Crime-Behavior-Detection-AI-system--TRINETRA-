/**
 * WebSocket Service Abstraction
 * TRINETRA AI Surveillance System
 * 
 * Ready for Django Channels WebSocket integration.
 * In production, connect to ws://localhost:8000/ws/surveillance/
 */

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectInterval = 5000;
    this.isConnected = false;
    this.simulatedTimer = null;
  }

  connect(url = "ws://localhost:8000/ws/surveillance/") {
    // Only attempt real socket connection if explicitly configured
    const enableRealWs = import.meta.env.VITE_ENABLE_WEBSOCKET === "true";

    if (enableRealWs) {
      try {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          console.log("[TRINETRA WebSocket] Connected to Django Channels");
          this.isConnected = true;
          this.emit("status_change", { connected: true });
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type) {
              this.emit(data.type, data.payload || data);
            }
          } catch (err) {
            console.error("[TRINETRA WebSocket] Message parse error:", err);
          }
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          this.emit("status_change", { connected: false });
          setTimeout(() => this.connect(url), this.reconnectInterval);
        };

        this.socket.onerror = (err) => {
          console.warn("[TRINETRA WebSocket] Stream error:", err);
        };
      } catch (err) {
        console.warn("[TRINETRA WebSocket] Could not establish connection, using simulation:", err);
        this.startSimulation();
      }
    } else {
      // In development / demo mode, start gentle real-time simulation
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
        bitrate: (3.8 + Math.random() * 0.5).toFixed(1) + " Mbps"
      });
    }, 4000);
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

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
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("[TRINETRA WebSocket] Cannot send message, socket not open");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
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
