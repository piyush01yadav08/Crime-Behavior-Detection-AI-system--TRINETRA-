import os
import sys
import json
import unittest

# Ensure backend root and project root are in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
project_root = os.path.abspath(os.path.join(backend_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "trinetra_backend.settings")
import django
django.setup()

from django.test import TestCase, Client
from django.core.management import call_command
from cameras.models import Camera, TrackedPerson
from alerts.models import Alert, ActivityLog, SystemSetting
from channels.testing import WebsocketCommunicator
from trinetra_backend.asgi import application

class DjangoBackendIntegrationTest(TestCase):
    def setUp(self):
        call_command("seed_db")
        self.client = Client()


    def test_01_health_and_db_status(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("Django", data["service"])
        self.assertTrue(data["database"]["connected"])
        self.assertGreaterEqual(data["database"]["tables"]["cameras"], 12)

        db_res = self.client.get("/api/v1/db/status")
        self.assertEqual(db_res.status_code, 200)
        db_data = db_res.json()
        self.assertEqual(db_data["status"], "ONLINE")

    def test_02_cameras_crud_and_patch(self):
        # GET all cameras
        res = self.client.get("/api/v1/cameras/")
        self.assertEqual(res.status_code, 200)
        cams = res.json()
        self.assertGreaterEqual(len(cams), 12)

        # POST new camera
        new_cam_data = {
            "id": "CAM-50",
            "name": "Cam 50 - West Gate",
            "shortName": "West Gate",
            "location": "West Gate Entrance",
            "zone": "Outer Perimeter",
            "type": "CCTV IP Fixed",
        }
        post_res = self.client.post("/api/v1/cameras/", data=json.dumps(new_cam_data), content_type="application/json")
        self.assertEqual(post_res.status_code, 201)
        created = post_res.json()
        self.assertEqual(created["id"], "CAM-50")

        # GET detail
        get_res = self.client.get("/api/v1/cameras/CAM-50/")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["shortName"], "West Gate")

        # PATCH status
        patch_res = self.client.patch(
            "/api/v1/cameras/CAM-50/",
            data=json.dumps({"status": "ALERT", "loiteringEnabled": False}),
            content_type="application/json"
        )
        self.assertEqual(patch_res.status_code, 200)
        patched = patch_res.json()
        self.assertEqual(patched["status"], "ALERT")
        self.assertFalse(patched["loiteringEnabled"])

    def test_03_alerts_lifecycle_and_activity(self):
        # GET alerts
        res = self.client.get("/api/v1/alerts/")
        self.assertEqual(res.status_code, 200)
        alerts = res.json()
        self.assertGreaterEqual(len(alerts), 8)

        # POST new alert
        new_alert_data = {
            "camera": "CAM-02",
            "behavior": "Aggressive Interaction",
            "severity": "CRITICAL",
            "riskScore": 95,
            "personId": "TRK-104",
            "description": "Django DRF integrated alert",
        }
        post_res = self.client.post("/api/v1/alerts/", data=json.dumps(new_alert_data), content_type="application/json")
        self.assertEqual(post_res.status_code, 201)
        created = post_res.json()
        alert_id = created["id"]

        # PATCH alert status
        patch_res = self.client.patch(
            f"/api/v1/alerts/{alert_id}/",
            data=json.dumps({"status": "ACKNOWLEDGED", "operatorNotes": "Acknowledged in test"}),
            content_type="application/json"
        )
        self.assertEqual(patch_res.status_code, 200)
        updated = patch_res.json()
        self.assertEqual(updated["status"], "ACKNOWLEDGED")
        self.assertEqual(updated["operatorNotes"], "Acknowledged in test")

        # Check ActivityLog
        act_res = self.client.get("/api/v1/activity/")
        self.assertEqual(act_res.status_code, 200)
        activities = act_res.json()
        self.assertTrue(any(alert_id in a["description"] for a in activities))

    def test_04_tracked_persons_and_settings(self):
        # Persons
        p_res = self.client.get("/api/v1/persons/?search=TRK-104")
        self.assertEqual(p_res.status_code, 200)
        persons = p_res.json()
        self.assertGreaterEqual(len(persons), 1)
        self.assertEqual(persons[0]["trackingId"], "TRK-104")

        # Settings
        s_res = self.client.get("/api/v1/settings/")
        self.assertEqual(s_res.status_code, 200)
        settings = s_res.json()
        self.assertIn("profile", settings)

        upd_res = self.client.post(
            "/api/v1/settings/testGroup/",
            data=json.dumps({"enabled": True, "value": 99}),
            content_type="application/json"
        )
        self.assertEqual(upd_res.status_code, 200)
        self.assertEqual(upd_res.json()["value"]["value"], 99)

    def test_05_analytics_endpoints(self):
        for ep in [
            "/api/v1/analytics/summary/",
            "/api/v1/analytics/alerts-over-time/",
            "/api/v1/analytics/behaviors/",
            "/api/v1/analytics/risk-levels/",
            "/api/v1/analytics/camera-incidents/",
            "/api/v1/analytics/locations/",
        ]:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 200, f"Endpoint {ep} failed")


class WebSocketSurveillanceTest(unittest.IsolatedAsyncioTestCase):
    async def test_websocket_surveillance_connection(self):
        communicator = WebsocketCommunicator(application, "/ws/surveillance/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected, "WebSocket failed to connect")

        # Expect connection established message
        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "connection_established")

        # Send ping
        await communicator.send_json_to({"type": "ping"})
        reply = await communicator.receive_json_from()
        self.assertEqual(reply["type"], "pong")

        await communicator.disconnect()


if __name__ == "__main__":
    unittest.main()

