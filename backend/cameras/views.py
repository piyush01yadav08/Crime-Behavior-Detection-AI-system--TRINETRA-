from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Camera, TrackedPerson
from .serializers import CameraSerializer, TrackedPersonSerializer

class CameraListCreateAPIView(APIView):
    def get(self, request):
        cameras = Camera.objects.all()
        return Response([c.to_dict() for c in cameras])

    def post(self, request):
        data = request.data or {}
        cam_id = data.get("id")
        if not cam_id:
            count = Camera.objects.count()
            cam_id = f"CAM-{count + 1:02d}"

        coords = data.get("coordinates") if isinstance(data.get("coordinates"), dict) else {}
        lat = float(data.get("lat", coords.get("lat", 28.6139)))
        lng = float(data.get("lng", coords.get("lng", 77.2090)))

        camera, created = Camera.objects.update_or_create(
            id=cam_id,
            defaults={
                "name": data.get("name", cam_id),
                "short_name": data.get("shortName", data.get("name", cam_id)),
                "location": data.get("location", "Monitored Sector"),
                "zone": data.get("zone", "Default Perimeter"),
                "status": data.get("status", "NORMAL"),
                "is_live": bool(data.get("isLive", True)),
                "fps": int(data.get("fps", 30)),
                "resolution": data.get("resolution", "1920 x 1080"),
                "codec": data.get("codec", "H.264"),
                "bitrate": data.get("bitrate", "3.5 Mbps"),
                "lat": lat,
                "lng": lng,
                "bearing": data.get("bearing", "N 0°"),
                "type": data.get("type", "Outdoor Bullet Fixed"),
                "uptime": data.get("uptime", "100%"),
                "loitering_enabled": bool(data.get("loiteringEnabled", True)),
                "preview_type": data.get("previewType", "gate"),
                "featured": bool(data.get("featured", False)),
                "detections": data.get("detections") or {
                    "vehicles": 0,
                    "pedestrians": 0,
                    "helmetViolations": 0,
                    "suspiciousActivity": 0,
                    "trackedPersons": 0,
                    "restrictedViolations": 0,
                },
            }
        )
        return Response(camera.to_dict(), status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CameraDetailAPIView(APIView):
    def get(self, request, camera_id):
        try:
            cam = Camera.objects.get(id=camera_id)
            return Response(cam.to_dict())
        except Camera.DoesNotExist:
            return Response({"error": f"Camera {camera_id} not found"}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, camera_id):
        try:
            cam = Camera.objects.get(id=camera_id)
            data = request.data or {}
            if "status" in data:
                cam.status = data["status"]
                cam.is_live = data["status"] != "OFFLINE"
            if "loiteringEnabled" in data:
                cam.loitering_enabled = bool(data["loiteringEnabled"])
            if "detections" in data and isinstance(data["detections"], dict):
                current = cam.detections or {}
                current.update(data["detections"])
                cam.detections = current
            cam.save()
            return Response(cam.to_dict())
        except Camera.DoesNotExist:
            return Response({"error": f"Camera {camera_id} not found"}, status=status.HTTP_404_NOT_FOUND)


class TrackedPersonListCreateAPIView(APIView):
    def get(self, request):
        query = TrackedPerson.objects.all()
        q = request.query_params.get("search")
        q_status = request.query_params.get("status")
        q_risk = request.query_params.get("riskLevel")

        if q_status and q_status.upper() != "ALL":
            query = query.filter(status__iexact=q_status)
        if q_risk and q_risk.upper() != "ALL":
            query = query.filter(risk_level__iexact=q_risk)
        if q:
            query = query.filter(
                Q(tracking_id__icontains=q)
                | Q(label__icontains=q)
                | Q(last_seen_camera__icontains=q)
                | Q(last_seen_location__icontains=q)
                | Q(appearance__icontains=q)
            )

        return Response([p.to_dict() for p in query])

    def post(self, request):
        data = request.data or {}
        tid = data.get("trackingId") or data.get("id")
        if not tid:
            return Response({"error": "trackingId is required"}, status=status.HTTP_400_BAD_REQUEST)

        person, created = TrackedPerson.objects.update_or_create(
            tracking_id=tid,
            defaults={
                "label": data.get("label", f"Person #{tid}"),
                "last_seen_camera": data.get("lastSeenCamera", "CAM-02"),
                "last_seen_location": data.get("lastSeenLocation", "Monitored Zone"),
                "last_seen_time": data.get("lastSeenTime", "10:00 PM"),
                "status": data.get("status", "TRACKED"),
                "risk_level": data.get("riskLevel", "LOW"),
                "risk_score": int(data.get("riskScore", 25)),
                "speed": data.get("speed", "1.2 m/s"),
                "heading": data.get("heading", "North"),
                "dwell_time": data.get("dwellTime", "0m 10s"),
                "appearance": data.get("appearance", "Unclassified attire"),
                "associated_alerts": data.get("associatedAlerts") or [],
                "detection_confidence": data.get("detectionConfidence", "95.0%"),
                "trajectory_path": data.get("trajectoryPath") or [],
            }
        )
        return Response(person.to_dict(), status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class TrackedPersonDetailAPIView(APIView):
    def get(self, request, tracking_id):
        try:
            person = TrackedPerson.objects.get(tracking_id=tracking_id)
            return Response(person.to_dict())
        except TrackedPerson.DoesNotExist:
            return Response({"error": f"Tracked person {tracking_id} not found"}, status=status.HTTP_404_NOT_FOUND)
