from django.urls import path
from .views import (
    live_stream_feed,
    default_live_feed,
    stream_snapshot,
    StreamTelemetryAPIView,
    StreamModeAPIView,
    AIStatusAPIView,
    LoiteringSettingsAPIView,
    TriggerLoiteringDemoAPIView,
)

urlpatterns = [
    # Video Streaming
    path("live", default_live_feed, name="stream-live"),
    path("feed/<str:camera_id>", live_stream_feed, name="stream-feed"),
    path("snapshot", stream_snapshot, name="stream-snapshot"),
    path("telemetry", StreamTelemetryAPIView.as_view(), name="stream-telemetry"),
    path("mode", StreamModeAPIView.as_view(), name="stream-mode"),
    # AI Engine Controls
    path("ai/status", AIStatusAPIView.as_view(), name="ai-status"),
    path("ai/loitering/settings", LoiteringSettingsAPIView.as_view(), name="ai-loitering-settings"),
    path("ai/trigger-loitering-demo", TriggerLoiteringDemoAPIView.as_view(), name="ai-trigger-demo"),
]
