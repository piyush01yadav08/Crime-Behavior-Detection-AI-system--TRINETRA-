from rest_framework import serializers
from .models import Alert, ActivityLog, SystemSetting

class AlertSerializer(serializers.ModelSerializer):
    cameraName = serializers.CharField(source="camera_name", required=False)
    riskScore = serializers.IntegerField(source="risk_score", required=False)
    timeFormatted = serializers.CharField(source="time_formatted", required=False)
    personId = serializers.CharField(source="person_id", required=False)
    recommendedAction = serializers.CharField(source="recommended_action", required=False)
    snapshotUrl = serializers.CharField(source="snapshot_url", required=False)
    dwellTime = serializers.FloatField(source="dwell_time", required=False)
    operatorNotes = serializers.CharField(source="operator_notes", required=False)
    lastUpdated = serializers.CharField(source="last_updated", required=False)

    class Meta:
        model = Alert
        fields = [
            "id",
            "camera",
            "cameraName",
            "location",
            "zone",
            "behavior",
            "riskScore",
            "severity",
            "timestamp",
            "timeFormatted",
            "status",
            "personId",
            "description",
            "trajectory",
            "recommendedAction",
            "snapshotUrl",
            "tags",
            "confidence",
            "dwellTime",
            "operatorNotes",
            "lastUpdated",
        ]

    def to_representation(self, instance):
        return instance.to_dict()


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = "__all__"

    def to_representation(self, instance):
        return instance.to_dict()


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ["key", "value", "updated_at"]

    def to_representation(self, instance):
        return instance.to_dict()
