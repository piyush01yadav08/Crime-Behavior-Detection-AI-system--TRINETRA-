import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import MapViewPage from "./pages/MapViewPage";
import AlertsPage from "./pages/AlertsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SearchPage from "./pages/SearchPage";
import ReportsPage from "./pages/ReportsPage";
import AIInsightsPage from "./pages/AIInsightsPage";
import SettingsPage from "./pages/SettingsPage";
import { wsService } from "./services/websocketService";

function App() {
  // Initialize simulated or real WebSocket connection for real-time telemetry
  useEffect(() => {
    wsService.connect();
    return () => {
      wsService.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Main Dashboard / Live Sphere */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Map View */}
          <Route path="/map" element={<MapViewPage />} />

          {/* Alerts */}
          <Route path="/alerts" element={<AlertsPage />} />

          {/* Analytics */}
          <Route path="/analytics" element={<AnalyticsPage />} />

          {/* Search */}
          <Route path="/search" element={<SearchPage />} />

          {/* Reports */}
          <Route path="/reports" element={<ReportsPage />} />

          {/* AI Insights */}
          <Route path="/ai-insights" element={<AIInsightsPage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
