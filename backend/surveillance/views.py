import logging
from django.http import StreamingHttpResponse, HttpResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.stream_service import stream_service
from .services.ai_engine_service import ai_engine_service

logger = logging.getLogger(__name__)


def live_stream_feed(request, camera_id="CAM-02"):
    """
    Returns an MJPEG stream processed in real-time by the YOLOv8 and AI Engine pipeline.
    """
    return StreamingHttpResponse(
        stream_service.generate_frames(camera_id),
        content_type="multipart/x-mixed-replace; boundary=frame"
    )

def default_live_feed(request):
    return live_stream_feed(request, "CAM-02")

def stream_snapshot(request):
    frame = stream_service.get_latest_snapshot()
    if frame is None:
        return HttpResponse(b"", status=404, content_type="image/jpeg")
    return HttpResponse(frame, content_type="image/jpeg")


class StreamTelemetryAPIView(APIView):
    def get(self, request):
        return Response(ai_engine_service.latest_telemetry)


class StreamModeAPIView(APIView):
    def get(self, request):
        return Response({"mode": stream_service.mode})

    def post(self, request):
        mode = request.data.get("mode", "webcam")
        stream_service.set_mode(mode)
        return Response({"status": "success", "mode": stream_service.mode})


class AIStatusAPIView(APIView):
    def get(self, request):
        return Response({
            "detectorLoaded": ai_engine_service.detector.is_loaded,
            "modelPath": getattr(settings, "YOLO_MODEL_PATH", "yolov8n.pt"),
            "confidenceThreshold": getattr(settings, "CONFIDENCE_THRESHOLD", 0.45),
            "loiteringDistanceThreshold": ai_engine_service.loitering_detector.distance_threshold,
            "loiteringTimeThreshold": ai_engine_service.loitering_detector.time_threshold,
            "activeTrackingCount": len(ai_engine_service.loitering_detector.person_states),
            "telemetry": ai_engine_service.latest_telemetry,
        })



class LoiteringSettingsAPIView(APIView):
    def post(self, request):
        data = request.data or {}
        if "distanceThreshold" in data:
            ai_engine_service.loitering_detector.distance_threshold = float(data["distanceThreshold"])
        if "timeThreshold" in data:
            ai_engine_service.loitering_detector.time_threshold = float(data["timeThreshold"])

        return Response({
            "status": "updated",
            "distanceThreshold": ai_engine_service.loitering_detector.distance_threshold,
            "timeThreshold": ai_engine_service.loitering_detector.time_threshold,
        })


class TriggerLoiteringDemoAPIView(APIView):
    def post(self, request):
        ai_engine_service._handle_loitering_alert({
            "track_id": 104,
            "dwell_time": 12.5,
            "displacement": 24.0,
            "pos": (320, 240),
        })
        return Response({"status": "alert_emitted", "subjectId": "TRK-104"})
