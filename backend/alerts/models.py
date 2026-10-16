from django.db import models

class Alert(models.Model):
    id = models.CharField(max_length=32, primary_key=True)
    camera = models.CharField(max_length=32, db_index=True)
    camera_name = models.CharField(max_length=128)
    location = models.CharField(max_length=256)
    zone = models.CharField(max_length=128)
    behavior = models.CharField(max_length=128, db_index=True)
    risk_score = models.IntegerField(default=50, db_index=True)
    severity = models.CharField(max_length=32, default="MEDIUM", db_index=True)
    timestamp = models.CharField(max_length=64, db_index=True)
    time_formatted = models.CharField(max_length=32)
    status = models.CharField(max_length=32, default="NEW", db_index=True)
    person_id = models.CharField(max_length=64, default="TRK-UNKNOWN", db_index=True)
    description = models.TextField()
    trajectory = models.JSONField(default=list, blank=True)
    recommended_action = models.TextField(blank=True, default="")
    snapshot_url = models.CharField(max_length=256, blank=True, default="")
    tags = models.JSONField(default=list, blank=True)
    confidence = models.FloatField(default=0.85)
    dwell_time = models.FloatField(null=True, blank=True)
    operator_notes = models.TextField(blank=True, default="")
    last_updated = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["severity", "status"]),
            models.Index(fields=["camera", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.id} ({self.behavior}) on {self.camera}"

    def to_dict(self):
        res = {
            "id": self.id,
            "camera": self.camera,
            "cameraName": self.camera_name,
            "location": self.location,
            "zone": self.zone,
            "behavior": self.behavior,
            "riskScore": self.risk_score,
            "severity": self.severity,
            "timestamp": self.timestamp,
            "timeFormatted": self.time_formatted,
            "status": self.status,
            "personId": self.person_id,
            "description": self.description,
            "trajectory": self.trajectory or [],
            "recommendedAction": self.recommended_action or "",
            "snapshotUrl": self.snapshot_url or "",
            "tags": self.tags or [],
            "confidence": self.confidence,
        }
        if self.dwell_time is not None:
            res["dwellTime"] = self.dwell_time
        if self.operator_notes:
            res["operatorNotes"] = self.operator_notes
        if self.last_updated:
            res["lastUpdated"] = self.last_updated
        return res


class ActivityLog(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    time = models.CharField(max_length=32)
    timestamp = models.CharField(max_length=64, db_index=True)
    camera = models.CharField(max_length=32, db_index=True)
    camera_name = models.CharField(max_length=128)
    event_type = models.CharField(max_length=128)
    description = models.TextField()
    risk_level = models.CharField(max_length=32, default="LOW", db_index=True)
    risk_score = models.IntegerField(default=20)
    person_id = models.CharField(max_length=64, default="SYS-AUTO")
    icon_type = models.CharField(max_length=32, default="check")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.id} - {self.event_type}"

    def to_dict(self):
        return {
            "id": self.id,
            "time": self.time,
            "timestamp": self.time,
            "isoTimestamp": self.timestamp,
            "camera": self.camera,
            "cameraId": self.camera,
            "cameraName": self.camera_name,
            "eventType": self.event_type,
            "description": self.description,
            "message": self.description,
            "riskLevel": self.risk_level,
            "riskScore": self.risk_score,
            "personId": self.person_id,
            "iconType": self.icon_type,
        }


class SystemSetting(models.Model):
    key = models.CharField(max_length=64, primary_key=True)
    value = models.JSONField(default=dict)
    updated_at = models.CharField(max_length=64)

    def __str__(self):
        return self.key

    def to_dict(self):
        return {
            "key": self.key,
            "value": self.value,
            "updatedAt": self.updated_at,
        }
