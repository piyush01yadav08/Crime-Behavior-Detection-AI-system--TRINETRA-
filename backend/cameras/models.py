from django.db import models

class Camera(models.Model):
    id = models.CharField(max_length=32, primary_key=True)
    name = models.CharField(max_length=128)
    short_name = models.CharField(max_length=64)
    location = models.CharField(max_length=256)
    zone = models.CharField(max_length=128, db_index=True)
    status = models.CharField(max_length=32, default="NORMAL", db_index=True)
    is_live = models.BooleanField(default=True, db_index=True)
    fps = models.IntegerField(default=30)
    resolution = models.CharField(max_length=64, default="1920 x 1080")
    codec = models.CharField(max_length=32, default="H.264")
    bitrate = models.CharField(max_length=32, default="3.5 Mbps")
    lat = models.FloatField(default=28.6139)
    lng = models.FloatField(default=77.2090)
    bearing = models.CharField(max_length=32, default="N 0°", blank=True, null=True)
    type = models.CharField(max_length=128, default="Outdoor Bullet Fixed")
    uptime = models.CharField(max_length=32, default="100%")
    loitering_enabled = models.BooleanField(default=True)
    preview_type = models.CharField(max_length=64, default="gate")
    featured = models.BooleanField(default=False)
    detections = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]
        indexes = [
            models.Index(fields=["status", "is_live"]),
        ]

    def __str__(self):
        return f"{self.id} - {self.name}"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "shortName": self.short_name,
            "location": self.location,
            "zone": self.zone,
            "status": self.status,
            "isLive": bool(self.is_live),
            "fps": self.fps,
            "resolution": self.resolution,
            "codec": self.codec,
            "bitrate": self.bitrate,
            "coordinates": {"lat": self.lat, "lng": self.lng},
            "lat": self.lat,
            "lng": self.lng,
            "bearing": self.bearing or "N 0°",
            "type": self.type,
            "uptime": self.uptime,
            "loiteringEnabled": bool(self.loitering_enabled),
            "previewType": self.preview_type,
            "featured": bool(self.featured),
            "detections": self.detections or {
                "vehicles": 0,
                "pedestrians": 0,
                "helmetViolations": 0,
                "suspiciousActivity": 0,
                "trackedPersons": 0,
                "restrictedViolations": 0,
            },
        }


class TrackedPerson(models.Model):
    tracking_id = models.CharField(max_length=64, primary_key=True)
    label = models.CharField(max_length=64)
    last_seen_camera = models.CharField(max_length=32, db_index=True)
    last_seen_location = models.CharField(max_length=256)
    last_seen_time = models.CharField(max_length=64)
    status = models.CharField(max_length=32, default="TRACKED", db_index=True)
    risk_level = models.CharField(max_length=32, default="LOW", db_index=True)
    risk_score = models.IntegerField(default=25)
    speed = models.CharField(max_length=64, default="1.2 m/s")
    heading = models.CharField(max_length=64, default="North")
    dwell_time = models.CharField(max_length=64, default="0m 10s")
    appearance = models.CharField(max_length=256, default="Unclassified attire")
    associated_alerts = models.JSONField(default=list, blank=True)
    detection_confidence = models.CharField(max_length=32, default="94.0%")
    trajectory_path = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-risk_score"]

    def __str__(self):
        return f"{self.tracking_id} ({self.label})"

    def to_dict(self):
        path = self.trajectory_path or []
        return {
            "id": self.tracking_id,
            "trackingId": self.tracking_id,
            "label": self.label,
            "lastSeenCamera": self.last_seen_camera,
            "lastSeenLocation": self.last_seen_location,
            "lastSeenTime": self.last_seen_time,
            "status": self.status,
            "riskLevel": self.risk_level,
            "riskScore": self.risk_score,
            "speed": self.speed,
            "heading": self.heading,
            "dwellTime": self.dwell_time,
            "appearance": self.appearance,
            "associatedAlerts": self.associated_alerts or [],
            "detectionConfidence": self.detection_confidence,
            "trajectoryPath": path,
            "trajectory": path,
        }
