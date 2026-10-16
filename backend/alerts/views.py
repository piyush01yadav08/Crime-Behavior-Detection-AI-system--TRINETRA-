import time
import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Alert, ActivityLog, SystemSetting
from cameras.models import TrackedPerson
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def _broadcast_ws(event_type, payload):
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                "surveillance_feed",
                {
                    "type": "surveillance_message",
                    "event_type": event_type,
                    "payload": payload,
                }
            )
    except Exception:
        pass


class AlertListCreateAPIView(APIView):
    def get(self, request):
        query = Alert.objects.all()
        q_sev = request.query_params.get("severity")
        q_stat = request.query_params.get("status")
        q_cam = request.query_params.get("camera")
        q = request.query_params.get("search")

        if q_sev and q_sev.upper() != "ALL":
            query = query.filter(severity__iexact=q_sev)
        if q_stat and q_stat.upper() != "ALL":
            query = query.filter(status__iexact=q_stat)
        if q_cam and q_cam.upper() != "ALL":
            query = query.filter(camera=q_cam)
        if q:
            query = query.filter(
                Q(id__icontains=q)
                | Q(behavior__icontains=q)
                | Q(location__icontains=q)
                | Q(camera__icontains=q)
                | Q(person_id__icontains=q)
                | Q(description__icontains=q)
            )

        return Response([a.to_dict() for a in query])

    def post(self, request):
        data = request.data or {}
        new_id = data.get("id") or f"TR-{uuid.uuid4().hex[:6].upper()}"
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%S")
        now_time = time.strftime("%I:%M %p")
        cam_id = data.get("camera", "CAM-02")
        person_id = data.get("personId", "TRK-UNKNOWN")
        behavior = data.get("behavior", "Suspicious Activity Detected")
        risk_score = int(data.get("riskScore", 85))
        severity = data.get("severity", "HIGH")
        desc = data.get("description", "Automated AI anomaly detection flagged behavioral deviation.")

        alert = Alert.objects.create(
            id=new_id,
            camera=cam_id,
            camera_name=data.get("cameraName") or (f"Live Feed ({cam_id})" if cam_id != "CAM-02" else "Cam 02 - City Road"),
            location=data.get("location") or ("New Delhi, India" if cam_id == "CAM-02" else f"Monitored Sector ({cam_id})"),
            zone=data.get("zone", "North Corridor Sector 4"),
            behavior=behavior,
            risk_score=risk_score,
            severity=severity,
            timestamp=data.get("timestamp") or now_iso,
            time_formatted=data.get("timeFormatted") or now_time,
            status=data.get("status", "NEW"),
            person_id=person_id,
            description=desc,
            confidence=float(data.get("confidence", 0.92)),
            dwell_time=float(data["dwellTime"]) if data.get("dwellTime") is not None else None,
            trajectory=data.get("trajectory") or [
                {"time": now_time, "note": f"Event flagged by TRINETRA AI engine for {person_id}"}
            ],
            recommended_action=data.get("recommendedAction", "Verify camera feed. Dispatch security marshal if required."),
            snapshot_url=data.get("snapshotUrl", ""),
            tags=data.get("tags") or ["AI Engine", "Real-Time Alert"],
        )

        # Log activity
        act_id = f"act-{uuid.uuid4().hex[:6]}"
        icon = "shield-alert" if severity in ["CRITICAL", "HIGH"] else "alert-triangle"
        ActivityLog.objects.create(
            id=act_id,
            time=now_time,
            timestamp=now_iso,
            camera=cam_id,
            camera_name=alert.camera_name,
            event_type=behavior,
            description=desc,
            risk_level=severity,
            risk_score=risk_score,
            person_id=person_id,
            icon_type=icon,
        )

        # Update tracked person dossier if present
        if person_id and person_id != "TRK-UNKNOWN":
            try:
                person = TrackedPerson.objects.get(tracking_id=person_id)
                person.last_seen_camera = cam_id
                person.last_seen_time = now_time
                person.risk_level = severity
                person.risk_score = max(person.risk_score, risk_score)
                alerts_list = list(person.associated_alerts or [])
                if new_id not in alerts_list:
                    alerts_list.append(new_id)
                    person.associated_alerts = alerts_list
                path = list(person.trajectory_path or [])
                path.append({"camera": cam_id, "time": now_time, "event": behavior})
                person.trajectory_path = path
                person.save()
            except TrackedPerson.DoesNotExist:
                pass

        alert_dict = alert.to_dict()
        _broadcast_ws("new_alert", alert_dict)
        return Response(alert_dict, status=status.HTTP_201_CREATED)


class AlertDetailAPIView(APIView):
    def get(self, request, alert_id):
        try:
            alert = Alert.objects.get(id=alert_id)
            return Response(alert.to_dict())
        except Alert.DoesNotExist:
            return Response({"error": f"Alert {alert_id} not found"}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, alert_id):
        try:
            alert = Alert.objects.get(id=alert_id)
            data = request.data or {}
            new_status = data.get("status")
            notes = data.get("operatorNotes", "")

            if not new_status:
                return Response({"error": "status is required"}, status=status.HTTP_400_BAD_REQUEST)

            alert.status = new_status
            if notes:
                alert.operator_notes = notes
            alert.last_updated = time.strftime("%Y-%m-%dT%H:%M:%S")
            alert.save()

            # Record audit activity
            act_id = f"act-op-{uuid.uuid4().hex[:6]}"
            ActivityLog.objects.create(
                id=act_id,
                time=time.strftime("%I:%M %p"),
                timestamp=alert.last_updated,
                camera=alert.camera,
                camera_name=alert.camera_name,
                event_type=f"Alert Status: {new_status}",
                description=f"Incident {alert_id} updated to {new_status}. {notes}".strip(),
                risk_level=alert.severity,
                risk_score=alert.risk_score,
                person_id=alert.person_id,
                icon_type="check" if new_status == "RESOLVED" else "shield-alert",
            )

            res = alert.to_dict()
            _broadcast_ws("alert_updated", res)
            return Response(res)
        except Alert.DoesNotExist:
            return Response({"error": f"Alert {alert_id} not found"}, status=status.HTTP_404_NOT_FOUND)


class ActivityLogListAPIView(APIView):
    def get(self, request):
        limit = int(request.query_params.get("limit", 50))
        camera_filter = request.query_params.get("camera")
        query = ActivityLog.objects.all()
        if camera_filter and camera_filter != "ALL":
            query = query.filter(camera=camera_filter)
        return Response([a.to_dict() for a in query[:limit]])


class SystemSettingAPIView(APIView):
    def get(self, request):
        rows = SystemSetting.objects.all()
        return Response({r.key: r.value for r in rows})

    def post(self, request, key=None):
        return self._save(request, key)

    def put(self, request, key=None):
        return self._save(request, key)

    def _save(self, request, key):
        if not key:
            key = request.data.get("key")
        if not key:
            return Response({"error": "Setting key is required"}, status=status.HTTP_400_BAD_REQUEST)

        if "value" in request.data and len(request.data) == 1:
            val = request.data["value"]
        else:
            val = request.data
        now_str = time.strftime("%Y-%m-%dT%H:%M:%S")

        obj, _ = SystemSetting.objects.update_or_create(
            key=key,
            defaults={"value": val, "updated_at": now_str}
        )
        return Response({"status": "success", "key": key, "value": obj.value, "updatedAt": now_str})

