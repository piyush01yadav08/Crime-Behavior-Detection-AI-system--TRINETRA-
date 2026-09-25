import { test, describe } from "node:test";
import assert from "node:assert";
import { CAMERAS_DATA } from "../data/cameras.js";
import { ALERTS_DATA } from "../data/alerts.js";
import { ANALYTICS_DATA } from "../data/analytics.js";
import { ACTIVITY_STREAM } from "../data/activity.js";
import { PERSONS_DATA } from "../data/persons.js";
import { INSIGHTS_DATA } from "../data/insights.js";

describe("Frontend Mock Data Integrity", () => {
  test("CAMERAS_DATA has valid structures and coordinate bounds", () => {
    assert(Array.isArray(CAMERAS_DATA) && CAMERAS_DATA.length >= 10);
    CAMERAS_DATA.forEach((cam) => {
      assert(cam.id && typeof cam.id === "string");
      assert(cam.name && typeof cam.name === "string");
      assert(cam.lat >= -90 && cam.lat <= 90);
      assert(cam.lng >= -180 && cam.lng <= 180);
      assert(["NORMAL", "WARNING", "ALERT", "OFFLINE"].includes(cam.status));
    });
  });

  test("ALERTS_DATA contains valid severity tiers and timestamps", () => {
    assert(Array.isArray(ALERTS_DATA) && ALERTS_DATA.length > 0);
    const validSeverities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    ALERTS_DATA.forEach((alert) => {
      assert(alert.id && typeof alert.id === "string");
      assert(validSeverities.includes(alert.severity));
      assert(alert.timestamp && typeof alert.timestamp === "string");
      assert(alert.confidence >= 0 && alert.confidence <= 1);
    });
  });

  test("ANALYTICS_DATA contains complete 24h timeline points", () => {
    assert(Array.isArray(ANALYTICS_DATA.hourlyData));
    assert(ANALYTICS_DATA.hourlyData.length >= 12);
    ANALYTICS_DATA.hourlyData.forEach((point) => {
      assert(point.time && typeof point.time === "string");
      assert(typeof point.critical === "number");
      assert(typeof point.high === "number");
      assert(typeof point.medium === "number");
      assert(typeof point.low === "number");
    });
  });

  test("ACTIVITY_STREAM events have required telemetry fields", () => {
    assert(Array.isArray(ACTIVITY_STREAM) && ACTIVITY_STREAM.length > 0);
    ACTIVITY_STREAM.forEach((event) => {
      assert(event.id);
      assert(event.cameraId);
      assert(event.message);
      assert(event.timestamp);
    });
  });

  test("PERSONS_DATA DeepSORT subjects have trajectory history", () => {
    assert(Array.isArray(PERSONS_DATA) && PERSONS_DATA.length > 0);
    PERSONS_DATA.forEach((person) => {
      assert(person.id.startsWith("TRK-"));
      assert(Array.isArray(person.trajectory));
      assert(person.trajectory.length > 0);
    });
  });

  test("INSIGHTS_DATA contains anomaly detections and recommendations", () => {
    assert(Array.isArray(INSIGHTS_DATA.anomalies));
    assert(Array.isArray(INSIGHTS_DATA.recommendations));
    assert(INSIGHTS_DATA.anomalies.length > 0);
    assert(INSIGHTS_DATA.recommendations.length > 0);
  });
});
