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
from django.conf import settings

# Enforce an isolated test database to protect development/production databases
isolated_test_db = os.path.join(backend_dir, "test_isolated.db")
settings.DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": isolated_test_db,
    }
}
settings.ACTIVE_DB_DIALECT = "sqlite"

django.setup()

from django.core.management import call_command
try:
    call_command("migrate", interactive=False, verbosity=0)
except Exception:
    pass

from django.test import TestCase, Client
from cameras.models import Camera, TrackedPerson
from alerts.models import Alert, ActivityLog, SystemSetting
from channels.testing import WebsocketCommunicator
from trinetra_backend.asgi import application


class DjangoBackendIntegrationTest(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        call_command("seed_db")

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        if os.path.exists(isolated_test_db):
            try:
                os.remove(isolated_test_db)
            except Exception:
                pass

    def setUp(self):
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
            "location": "West Gate",
            "ip_address": "192.168.1.150",
            "status": "ONLINE",
            "resolution": "1080p",
            "fps": 30,
            "stream_url": "http://localhost:8000/api/v1/stream/feed/CAM-50"
        }
        create_res = self.client.post(
            "/api/v1/cameras/",
            data=json.dumps(new_cam_data),
            content_type="application/json"
        )
        self.assertIn(create_res.status_code, [200, 201])

        # PATCH camera status
        patch_res = self.client.patch(
            "/api/v1/cameras/CAM-50/",
            data=json.dumps({"status": "ALERT"}),
            content_type="application/json"
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()["status"], "ALERT")

    def test_03_alerts_filtering_and_patch(self):
        # GET all alerts
        res = self.client.get("/api/v1/alerts/")
        self.assertEqual(res.status_code, 200)
        alerts = res.json()
        self.assertGreaterEqual(len(alerts), 5)
        first_id = alerts[0]["id"]

        # Filter by severity
        crit_res = self.client.get("/api/v1/alerts/?severity=CRITICAL")
        self.assertEqual(crit_res.status_code, 200)
        for a in crit_res.json():
            self.assertEqual(a["severity"], "CRITICAL")

        # PATCH status transition (ACKNOWLEDGED -> RESOLVED)
        patch_res = self.client.patch(
            f"/api/v1/alerts/{first_id}/",
            data=json.dumps({"status": "RESOLVED"}),
            content_type="application/json"
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()["status"], "RESOLVED")

    def test_04_system_settings_read_write(self):
        res = self.client.get("/api/v1/settings/")
        self.assertEqual(res.status_code, 200)
        settings_dict = res.json()
        self.assertTrue(
            "systemSettings" in settings_dict or "cameraSettings" in settings_dict or "aiThresholds" in settings_dict
        )

        # Update setting key
        upd_res = self.client.put(
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

    def test_06_stream_mode_api(self):
        # Test rejection of invalid mode
        bad_res = self.client.post(
            "/api/v1/stream/mode",
            data=json.dumps({"mode": "invalid_mode_xyz"}),
            content_type="application/json",
        )
        self.assertEqual(bad_res.status_code, 400)
        self.assertIn("error", bad_res.json())

        # Test valid mode switch to simulated
        sim_res = self.client.post(
            "/api/v1/stream/mode",
            data=json.dumps({"mode": "simulated"}),
            content_type="application/json",
        )
        self.assertEqual(sim_res.status_code, 200)
        sim_data = sim_res.json()
        self.assertEqual(sim_data["mode"], "simulated")
        self.assertEqual(sim_data["status"], "success")
        self.assertIn("camera", sim_data)

        # Verify GET returns current mode
        get_res = self.client.get("/api/v1/stream/mode")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["mode"], "simulated")

        # Test mode switch back to webcam
        cam_res = self.client.post(
            "/api/v1/stream/mode",
            data=json.dumps({"mode": "webcam"}),
            content_type="application/json",
        )
        self.assertEqual(cam_res.status_code, 200)
        self.assertEqual(cam_res.json()["mode"], "webcam")

    def test_07_live_stream_endpoint(self):
        # 1. Mode switch to simulated for deterministic test pipeline
        self.client.post(
            "/api/v1/stream/mode",
            data=json.dumps({"mode": "simulated"}),
            content_type="application/json",
        )
        # 2. Verify live feed endpoint returns 200 with multipart/x-mixed-replace
        res = self.client.get("/api/v1/stream/feed/CAM-02")
        self.assertEqual(res.status_code, 200)
        self.assertIn("multipart/x-mixed-replace", res["Content-Type"])

        # 3. Verify synchronous iterator yields valid MJPEG chunks without hanging
        stream_iter = iter(res)
        first_chunk = next(stream_iter)
        self.assertIn(b"--frame", first_chunk)
        self.assertIn(b"Content-Type: image/jpeg", first_chunk)
        self.assertGreater(len(first_chunk), 500)


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
