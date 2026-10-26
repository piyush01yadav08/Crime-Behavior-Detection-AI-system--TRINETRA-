import logging
from django.http import StreamingHttpResponse, HttpResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.stream_service import stream_service
from .services.ai_engine_service import ai_engine_service

logger = logging.getLogger(__name__)


class MJPEGStreamingResponse(StreamingHttpResponse):
    """
    MJPEG Streaming Response supporting both ASGI (Daphne) and WSGI (test client / gunicorn).
    Avoids Django ASGIHandler's sync_to_async(list) buffering trap by providing an explicit
    asynchronous iterator for ASGI and synchronous iterator for WSGI.
    """
    def __init__(self, camera_id="CAM-02", *args, **kwargs):
        kwargs["content_type"] = "multipart/x-mixed-replace; boundary=frame"
        self.camera_id = camera_id
        async_gen = stream_service.generate_frames_async(camera_id)
        super().__init__(
            streaming_content=async_gen,
            *args,
            **kwargs,
        )
        self._async_gen = async_gen

    def __iter__(self):
        # Fallback for synchronous consumers (e.g. Django test client or WSGI)
        return stream_service.generate_frames(self.camera_id)

    async def __aiter__(self):
        # Asynchronous frame delivery for Daphne / ASGIHandler
        async for chunk in self._async_gen:
            yield chunk


def live_stream_feed(request, camera_id="CAM-02"):
    """
    Returns an MJPEG stream processed in real-time by the YOLOv8 and AI Engine pipeline.
    """
    mode_param = request.GET.get("mode")
    if mode_param in ["webcam", "simulated"] and mode_param != stream_service.mode:
        stream_service.set_mode(mode_param)

    return MJPEGStreamingResponse(camera_id=camera_id)

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
    """
    Manages active video stream mode: 'webcam' or 'simulated'.
    Serializes transitions and returns confirmed camera health state.
    """
    def get(self, request):
        return Response({
            "mode": stream_service.mode,
            "active_source": stream_service.get_active_source(),
            "camera": stream_service.get_camera_status(),
        })

    def post(self, request):
        data = request.data or {}
        mode = data.get("mode")
        if not mode or mode not in ["webcam", "simulated"]:
            return Response(
                {"error": f"Invalid mode '{mode}'. Supported modes are: ['webcam', 'simulated']"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, message = stream_service.set_mode(mode)
        if not success:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "status": "success",
            "mode": stream_service.mode,
            "message": message,
            "active_source": stream_service.get_active_source(),
            "camera": stream_service.get_camera_status(),
        })


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
