from rest_framework import serializers
from .models import Camera, TrackedPerson

class CameraSerializer(serializers.ModelSerializer):
    shortName = serializers.CharField(source="short_name", required=False)
    isLive = serializers.BooleanField(source="is_live", required=False)
    loiteringEnabled = serializers.BooleanField(source="loitering_enabled", required=False)
    previewType = serializers.CharField(source="preview_type", required=False)
    coordinates = serializers.SerializerMethodField()

    class Meta:
        model = Camera
        fields = [
            "id",
            "name",
            "shortName",
            "location",
            "zone",
            "status",
            "isLive",
            "fps",
            "resolution",
            "codec",
            "bitrate",
            "coordinates",
            "lat",
            "lng",
            "bearing",
            "type",
            "uptime",
            "loiteringEnabled",
            "previewType",
            "featured",
            "detections",
        ]

    def get_coordinates(self, obj):
        return {"lat": obj.lat, "lng": obj.lng}

    def to_representation(self, instance):
        return instance.to_dict()


class TrackedPersonSerializer(serializers.ModelSerializer):
    trackingId = serializers.CharField(source="tracking_id")
    lastSeenCamera = serializers.CharField(source="last_seen_camera")
    lastSeenLocation = serializers.CharField(source="last_seen_location")
    lastSeenTime = serializers.CharField(source="last_seen_time")
    riskLevel = serializers.CharField(source="risk_level")
    riskScore = serializers.IntegerField(source="risk_score")
    dwellTime = serializers.CharField(source="dwell_time")
    associatedAlerts = serializers.JSONField(source="associated_alerts")
    detectionConfidence = serializers.CharField(source="detection_confidence")
    trajectoryPath = serializers.JSONField(source="trajectory_path")

    class Meta:
        model = TrackedPerson
        fields = [
            "id",
            "trackingId",
            "label",
            "lastSeenCamera",
            "lastSeenLocation",
            "lastSeenTime",
            "status",
            "riskLevel",
            "riskScore",
            "speed",
            "heading",
            "dwellTime",
            "appearance",
            "associatedAlerts",
            "detectionConfidence",
            "trajectoryPath",
        ]

    def to_representation(self, instance):
        return instance.to_dict()
