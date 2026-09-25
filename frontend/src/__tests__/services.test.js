import { test, describe } from "node:test";
import assert from "node:assert";
import { cameraService } from "../services/cameraService.js";
import { alertService } from "../services/alertService.js";
import { analyticsService } from "../services/analyticsService.js";

describe("Frontend Service Layers", () => {
  test("cameraService.getAll returns cameras list", async () => {
    const cameras = await cameraService.getAll();
    assert(Array.isArray(cameras));
    assert(cameras.length >= 10);
  });

  test("cameraService.getById finds specific camera or null", async () => {
    const cam = await cameraService.getById("CAM-02");
    assert(cam !== null);
    assert.strictEqual(cam.id, "CAM-02");

    const nonExistent = await cameraService.getById("NON-EXISTENT");
    assert.strictEqual(nonExistent, undefined);
  });

  test("alertService.getAll returns alerts list", async () => {
    const alerts = await alertService.getAll();
    assert(Array.isArray(alerts));
    assert(alerts.length > 0);
  });

  test("alertService state transitions: acknowledge, escalate, resolve", async () => {
    const alerts = await alertService.getAll();
    const testAlert = alerts[0];
    assert(testAlert);

    const ackResult = await alertService.acknowledge(testAlert.id, "Operator-01");
    assert.strictEqual(ackResult.status, "ACKNOWLEDGED");

    const escResult = await alertService.escalate(testAlert.id, "Critical Threat");
    assert.strictEqual(escResult.status, "ESCALATED");

    const resResult = await alertService.resolve(testAlert.id, "False positive confirmed");
    assert.strictEqual(resResult.status, "RESOLVED");
  });

  test("analyticsService.getSummary returns aggregate KPIs", async () => {
    const summary = await analyticsService.getSummary("24h");
    assert(summary);
    assert(typeof summary.totalAlerts === "number");
    assert(typeof summary.criticalCount === "number");
  });
});
