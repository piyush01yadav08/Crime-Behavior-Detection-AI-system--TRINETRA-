import time
from django.core.management.base import BaseCommand
from cameras.models import Camera, TrackedPerson
from alerts.models import Alert, ActivityLog, SystemSetting
from trinetra_backend.seed_data import (
    INITIAL_CAMERAS,
    INITIAL_ALERTS,
    INITIAL_PERSONS,
    INITIAL_ACTIVITY,
    INITIAL_SETTINGS,
)

class Command(BaseCommand):
    help = "Seeds the database with initial cameras, alerts, persons, activity logs, and settings."

    def handle(self, *args, **options):
        # 1. Cameras
        c_count = 0
        for c in INITIAL_CAMERAS:
            coords = c.get("coordinates") if isinstance(c.get("coordinates"), dict) else {}
            lat = float(c.get("lat", coords.get("lat", 28.6139)))
            lng = float(c.get("lng", coords.get("lng", 77.2090)))
            _, created = Camera.objects.update_or_create(
                id=c["id"],
                defaults={
                    "name": c.get("name", c["id"]),
                    "short_name": c.get("shortName", c.get("name", c["id"])),
                    "location": c.get("location", "Monitored Sector"),
                    "zone": c.get("zone", "Default Perimeter"),
                    "status": c.get("status", "NORMAL"),
                    "is_live": bool(c.get("isLive", True)),
                    "fps": int(c.get("fps", 30)),
                    "resolution": c.get("resolution", "1920 x 1080"),
                    "codec": c.get("codec", "H.264"),
                    "bitrate": c.get("bitrate", "3.5 Mbps"),
                    "lat": lat,
                    "lng": lng,
                    "bearing": c.get("bearing", "N 0°"),
                    "type": c.get("type", "Outdoor Bullet Fixed"),
                    "uptime": c.get("uptime", "100%"),
                    "loitering_enabled": bool(c.get("loiteringEnabled", True)),
                    "preview_type": c.get("previewType", "gate"),
                    "featured": bool(c.get("featured", False)),
                    "detections": c.get("detections") or {
                        "vehicles": 0,
                        "pedestrians": 0,
                        "helmetViolations": 0,
                        "suspiciousActivity": 0,
                        "trackedPersons": 0,
                        "restrictedViolations": 0,
                    },
                }
            )
            if created:
                c_count += 1

        # 2. Alerts
        a_count = 0
        for a in INITIAL_ALERTS:
            _, created = Alert.objects.update_or_create(
                id=a["id"],
                defaults={
                    "camera": a.get("camera", "CAM-02"),
                    "camera_name": a.get("cameraName", "Cam 02 - City Road"),
                    "location": a.get("location", "New Delhi, India"),
                    "zone": a.get("zone", "North Corridor Sector 4"),
                    "behavior": a.get("behavior", "Suspicious Activity Detected"),
                    "risk_score": int(a.get("riskScore", 85)),
                    "severity": a.get("severity", "HIGH"),
                    "timestamp": a.get("timestamp", time.strftime("%Y-%m-%dT%H:%M:%S")),
                    "time_formatted": a.get("timeFormatted", time.strftime("%I:%M %p")),
                    "status": a.get("status", "NEW"),
                    "person_id": a.get("personId", "TRK-UNKNOWN"),
                    "description": a.get("description", ""),
                    "trajectory": a.get("trajectory") or [],
                    "recommended_action": a.get("recommendedAction", ""),
                    "snapshot_url": a.get("snapshotUrl", ""),
                    "tags": a.get("tags") or [],
                    "confidence": float(a.get("confidence", 0.90)),
                    "dwell_time": float(a["dwellTime"]) if a.get("dwellTime") is not None else None,
                    "operator_notes": a.get("operatorNotes", ""),
                    "last_updated": a.get("lastUpdated", ""),
                }
            )
            if created:
                a_count += 1

        # 3. Tracked Persons
        p_count = 0
        for p in INITIAL_PERSONS:
            tid = p.get("trackingId") or p.get("id")
            _, created = TrackedPerson.objects.update_or_create(
                tracking_id=tid,
                defaults={
                    "label": p.get("label", f"Person #{tid}"),
                    "last_seen_camera": p.get("lastSeenCamera", "CAM-02"),
                    "last_seen_location": p.get("lastSeenLocation", "Monitored Zone"),
                    "last_seen_time": p.get("lastSeenTime", time.strftime("%I:%M:%S %p")),
                    "status": p.get("status", "TRACKED"),
                    "risk_level": p.get("riskLevel", "MEDIUM"),
                    "risk_score": int(p.get("riskScore", 50)),
                    "speed": p.get("speed", "1.0 m/s"),
                    "heading": p.get("heading", "North"),
                    "dwell_time": p.get("dwellTime", "1m 00s"),
                    "appearance": p.get("appearance", "Detected subject"),
                    "associated_alerts": p.get("associatedAlerts") or [],
                    "detection_confidence": p.get("detectionConfidence", "95.0%"),
                    "trajectory_path": p.get("trajectoryPath") or [],
                }
            )
            if created:
                p_count += 1

        # 4. Activity Logs
        act_count = 0
        for act in INITIAL_ACTIVITY:
            _, created = ActivityLog.objects.update_or_create(
                id=act["id"],
                defaults={
                    "time": act["time"],
                    "timestamp": act["timestamp"],
                    "camera": act["camera"],
                    "camera_name": act["cameraName"],
                    "event_type": act["eventType"],
                    "description": act["description"],
                    "risk_level": act["riskLevel"],
                    "risk_score": act["riskScore"],
                    "person_id": act["personId"],
                    "icon_type": act["iconType"],
                }
            )
            if created:
                act_count += 1

        # 5. System Settings
        s_count = 0
        now_str = time.strftime("%Y-%m-%dT%H:%M:%S")
        for k, v in INITIAL_SETTINGS.items():
            _, created = SystemSetting.objects.update_or_create(
                key=k,
                defaults={"value": v, "updated_at": now_str}
            )
            if created:
                s_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded database: {c_count} cameras, {a_count} alerts, "
                f"{p_count} persons, {act_count} activity logs, {s_count} settings."
            )
        )
