import logging
import time
import uuid
import cv2
from typing import Dict, Any, Tuple
from django.conf import settings
from ai_engine.human_detector import HumanDetector
from ai_engine.tracker import PersonTracker
from ai_engine.loitering_detector import LoiteringDetector
from ai_engine.behavior_analyzer import BehaviorAnalyzer
from ai_engine.zone_monitor import ZoneMonitor
from alerts.models import Alert, ActivityLog
from cameras.models import Camera, TrackedPerson
from alerts.views import _broadcast_ws

import threading

logger = logging.getLogger(__name__)


class CameraPipelineContext:
    """Dedicated AI state pipeline context for a single camera stream."""
    def __init__(self, camera_id: str, service: "AIEngineService"):
        self.camera_id = camera_id
        self.service = service
        self.tracker = PersonTracker()
        self.loitering_detector = LoiteringDetector(
            distance_threshold=getattr(settings, "LOITERING_DISTANCE_THRESHOLD", 60.0),
            time_threshold=getattr(settings, "LOITERING_TIME_THRESHOLD", 8.0),
        )
        self.loitering_detector.on_loitering_alert = lambda payload: service._handle_loitering_alert(payload, camera_id=camera_id)

        self.behavior_analyzer = BehaviorAnalyzer()
        self.behavior_analyzer.on_behavior_alert = lambda event: service._handle_behavior_alert(event, camera_id=camera_id)

        self.zone_monitor = ZoneMonitor()
        self.zone_monitor.on_breach_alert = lambda event: service._handle_breach_alert(event, camera_id=camera_id)

        self.unique_track_ids = set()
        self.last_active_time = time.time()
        self.latest_telemetry: Dict[str, Any] = {
            "camera_id": camera_id,
            "fps": 30,
            "detectedPersons": 0,
            "detectedVehicles": 0,
            "trackedPersons": 0,
            "cumulativeTrackedPersons": 0,
            "loiteringPersons": 0,
            "suspiciousActivity": 0,
            "helmetViolations": 0,
            "restrictedViolations": 0,
            "activeBehaviors": [],
            "subjects": [],
        }

    def reset(self):
        """Resets this camera's pipeline state cleanly without affecting any other camera."""
        self.tracker = PersonTracker()
        self.loitering_detector.person_states.clear()
        self.behavior_analyzer.kinematics.clear()
        self.zone_monitor.prev_positions.clear()
        self.unique_track_ids.clear()


class AIEngineService:
    MAX_ACTIVE_CONTEXTS = 16

    def __init__(self):
        # 1. Multi-Class Object Detection (Shared YOLOv8 model)
        self.detector = HumanDetector(
            model_path=getattr(settings, "YOLO_MODEL_PATH", "yolov8n.pt"),
            conf_thresh=getattr(settings, "CONFIDENCE_THRESHOLD", 0.45),
        )

        self.active_camera_id = "CAM-02"
        self._contexts_lock = threading.Lock()
        self._contexts: Dict[str, CameraPipelineContext] = {}
        self._last_camera_sync = 0.0

    def get_context(self, camera_id: str) -> CameraPipelineContext:
        """Retrieves or initializes an isolated pipeline context for the specified camera."""
        with self._contexts_lock:
            if camera_id in self._contexts:
                ctx = self._contexts[camera_id]
                ctx.last_active_time = time.time()
                return ctx

            # Enforce resource bounds via LRU eviction of idle contexts
            if len(self._contexts) >= self.MAX_ACTIVE_CONTEXTS:
                oldest_id = None
                oldest_time = float("inf")
                for cid, c in self._contexts.items():
                    if cid != "CAM-02" and c.last_active_time < oldest_time:
                        oldest_time = c.last_active_time
                        oldest_id = cid
                if oldest_id:
                    logger.info(f"Evicting idle camera context {oldest_id} to respect resource limit.")
                    del self._contexts[oldest_id]

            ctx = CameraPipelineContext(camera_id, self)
            self._contexts[camera_id] = ctx
            return ctx

    def reset_camera_context(self, camera_id: str):
        """Explicitly resets state for a single camera without affecting other cameras."""
        with self._contexts_lock:
            if camera_id in self._contexts:
                self._contexts[camera_id].reset()

    # Backwards compatibility properties for CAM-02 / active camera
    @property
    def tracker(self):
        return self.get_context(self.active_camera_id).tracker

    @property
    def loitering_detector(self):
        return self.get_context(self.active_camera_id).loitering_detector

    @property
    def behavior_analyzer(self):
        return self.get_context(self.active_camera_id).behavior_analyzer

    @property
    def zone_monitor(self):
        return self.get_context(self.active_camera_id).zone_monitor

    @property
    def latest_telemetry(self):
        return self.get_context(self.active_camera_id).latest_telemetry

    @latest_telemetry.setter
    def latest_telemetry(self, val):
        self.get_context(self.active_camera_id).latest_telemetry = val

    @property
    def unique_track_ids(self):
        return self.get_context(self.active_camera_id).unique_track_ids

    def _persist_alert(self, alert_data: Dict[str, Any]):
        """Persists AI-generated alert to Django database and broadcasts over WebSockets."""
        try:
            new_id = alert_data.get("id") or f"TR-{uuid.uuid4().hex[:6].upper()}"
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%S")
            now_time = time.strftime("%I:%M %p")
            cam_id = alert_data.get("camera", self.active_camera_id)
            person_id = alert_data.get("personId", "TRK-UNKNOWN")
            behavior = alert_data.get("behavior", "Suspicious Activity Detected")
            risk_score = alert_data.get("riskScore", 85)
            severity = alert_data.get("severity", "HIGH")
            desc = alert_data.get("description", "Automated AI anomaly detection flagged behavioral deviation.")

            alert = Alert.objects.create(
                id=new_id,
                camera=cam_id,
                camera_name=alert_data.get("cameraName") or (f"Live Feed ({cam_id})" if cam_id != "CAM-02" else "Cam 02 - City Road"),
                location=alert_data.get("location") or ("New Delhi, India" if cam_id == "CAM-02" else f"Monitored Sector ({cam_id})"),
                zone=alert_data.get("zone", "North Corridor Sector 4"),
                behavior=behavior,
                risk_score=risk_score,
                severity=severity,
                timestamp=now_iso,
                time_formatted=now_time,
                status="NEW",
                person_id=person_id,
                description=desc,
                confidence=alert_data.get("confidence", 0.92),
                dwell_time=alert_data.get("dwellTime"),
                trajectory=alert_data.get("trajectory") or [
                    {"time": now_time, "note": f"Event flagged by TRINETRA AI engine for {person_id}"}
                ],
                recommended_action=alert_data.get("recommendedAction", "Verify camera feed. Dispatch security marshal if required."),
                snapshot_url=alert_data.get("snapshotUrl", ""),
                tags=alert_data.get("tags") or ["AI Engine", "Real-Time Alert"],
            )

            # Activity log
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

            # Camera status update
            Camera.objects.filter(id=cam_id).update(status="ALERT")

            # Update tracked person
            if person_id and person_id != "TRK-UNKNOWN":
                try:
                    person = TrackedPerson.objects.get(tracking_id=person_id)
                    person.last_seen_camera = cam_id
                    person.last_seen_time = now_time
                    person.risk_level = severity
                    person.risk_score = max(person.risk_score, risk_score)
                    a_list = list(person.associated_alerts or [])
                    if new_id not in a_list:
                        a_list.append(new_id)
                        person.associated_alerts = a_list
                    person.save()
                except TrackedPerson.DoesNotExist:
                    pass

            alert_dict = alert.to_dict()
            _broadcast_ws("new_alert", alert_dict)
            return alert_dict
        except Exception as exc:
            logger.error(f"Failed to persist AI alert to Django database: {exc}")
            return alert_data

    def _handle_loitering_alert(self, alert_data: Dict[str, Any], camera_id: str = None):
        target_cam = camera_id or alert_data.get("camera") or self.active_camera_id
        logger.info(f"AI Engine emitted Loitering Alert on {target_cam}: {alert_data}")
        tid = alert_data.get("track_id", "Unknown")
        dwell = alert_data.get("dwell_time", 10.0)
        self._persist_alert({
            "camera": target_cam,
            "behavior": "Loitering Pattern Confirmed",
            "riskScore": min(95, int(60 + dwell * 2)),
            "severity": "HIGH" if dwell < 20 else "CRITICAL",
            "personId": f"TRK-{tid}",
            "description": f"Subject TRK-{tid} detected loitering in monitored area for {dwell:.1f}s exceeding threshold.",
            "dwellTime": dwell,
            "recommendedAction": f"Observe camera feed {target_cam}. Verify subject authorization if loitering persists.",
            "tags": ["Loitering", "Real-Time AI", "Dwell Time"],
        })

    def _handle_behavior_alert(self, event: Dict[str, Any], camera_id: str = None):
        target_cam = camera_id or event.get("camera") or self.active_camera_id
        logger.warning(f"AI Engine emitted Behavior Alert: {event['behavior']} on {target_cam}")
        self._persist_alert({
            "camera": target_cam,
            "behavior": event["behavior"],
            "severity": event.get("severity", "HIGH"),
            "riskScore": event.get("riskScore", 85),
            "personId": event.get("personId", "TRK-UNKNOWN"),
            "description": event.get("description", ""),
            "recommendedAction": event.get("recommendedAction", "Verify camera feed. Dispatch security marshal if required."),
            "tags": event.get("tags") or ["Kinetic Analyzer", "Anomaly"],
        })

    def _handle_breach_alert(self, event: Dict[str, Any], camera_id: str = None):
        target_cam = camera_id or event.get("camera_id") or self.active_camera_id
        logger.warning(f"AI Engine emitted Perimeter Breach Alert: {event} on {target_cam}")
        tid = event.get("track_id", "Unknown")
        zone_label = event.get("zone_name") or event.get("tripwire_name") or "Restricted Zone"
        self._persist_alert({
            "camera": target_cam,
            "behavior": "Restricted Area Violation",
            "severity": "CRITICAL",
            "riskScore": 94,
            "personId": f"TRK-{tid}",
            "description": f"Subject TRK-{tid} crossed virtual security boundary into {zone_label} without authorization.",
            "recommendedAction": "Dispatch immediate patrol to perimeter boundary. Verify credential authorization.",
            "tags": ["Perimeter Breach", "Virtual Tripwire", "High Security"],
        })

    def process_frame(self, frame, camera_id: str = "CAM-02") -> Tuple[Any, Dict[str, Any]]:
        self.active_camera_id = camera_id
        ctx = self.get_context(camera_id)

        # 1. Detection (Shared YOLO model)
        detections = self.detector.detect(frame)
        person_detections = [d for d in detections if d.get("category") == "person"]
        vehicle_detections = [d for d in detections if d.get("category") == "vehicle"]

        # 2. Tracking (Per-camera isolated ByteTrack tracker)
        tracks = ctx.tracker.update(person_detections, frame=frame)
        for t in tracks:
            ctx.unique_track_ids.add(t["track_id"])

        # 3. Loitering (Per-camera isolated loitering engine)
        loitering_results = ctx.loitering_detector.update(tracks)
        loitering_count = sum(1 for r in loitering_results if r.get("is_loitering"))

        # 4. Kinetic Behaviors (Per-camera isolated kinematics)
        behavior_events = ctx.behavior_analyzer.update(tracks, camera_id=camera_id)

        # 5. Zone Breach (Per-camera isolated zone monitor)
        breach_events = ctx.zone_monitor.update(tracks, camera_id=camera_id)

        # 6. Render HUD Overlays
        annotated_frame = ctx.zone_monitor.annotate_frame(frame)
        annotated_frame = ctx.loitering_detector.annotate_frame(annotated_frame, loitering_results)
        annotated_frame = ctx.behavior_analyzer.annotate_frame(annotated_frame)

        for v in vehicle_detections:
            bx1, by1, bx2, by2 = v["bbox"]
            v_label = f"{v['label'].upper()} {int(v['confidence'] * 100)}%"
            cv2.rectangle(annotated_frame, (bx1, by1), (bx2, by2), (255, 180, 0), 2)
            (tw, th), _ = cv2.getTextSize(v_label, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
            cv2.rectangle(annotated_frame, (bx1, max(0, by1 - 18)), (bx1 + tw + 6, max(18, by1)), (255, 180, 0), -1)
            cv2.putText(annotated_frame, v_label, (bx1 + 3, max(14, by1 - 4)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 1, cv2.LINE_AA)

        # HUD Text
        hud_text = f"TRINETRA AI ENGINE | NODE: {camera_id} | PERSONS: {len(person_detections)} | VEHICLES: {len(vehicle_detections)}"
        cv2.rectangle(annotated_frame, (8, 8), (470, 28), (10, 15, 25), -1)
        cv2.rectangle(annotated_frame, (8, 8), (470, 28), (0, 230, 255), 1)
        cv2.putText(annotated_frame, hud_text, (14, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 230, 255), 1, cv2.LINE_AA)

        active_behaviors = []
        if loitering_count > 0:
            active_behaviors.append("Loitering")
        for be in behavior_events:
            active_behaviors.append(be["behavior"])
        for br in breach_events:
            active_behaviors.append("Perimeter Breach")

        has_suspicious = 1 if (loitering_count > 0 or len(behavior_events) > 0 or len(breach_events) > 0) else 0

        ctx.latest_telemetry = {
            "camera_id": camera_id,
            "fps": 30,
            "detectedPersons": len(person_detections),
            "detectedVehicles": len(vehicle_detections),
            "trackedPersons": len(tracks),
            "cumulativeTrackedPersons": max(len(ctx.unique_track_ids), len(tracks)),
            "loiteringPersons": loitering_count,
            "suspiciousActivity": has_suspicious,
            "helmetViolations": 0,
            "restrictedViolations": len(breach_events),
            "activeBehaviors": list(set(active_behaviors)),
            "subjects": [
                {
                    "track_id": r["track_id"],
                    "dwell_time": r["dwell_time"],
                    "speed": r["speed"],
                    "is_loitering": r["is_loitering"],
                }
                for r in loitering_results
            ]
        }

        # Throttled sync to Camera detections in database
        now = time.time()
        if now - self._last_camera_sync >= 5.0:
            self._last_camera_sync = now
            try:
                Camera.objects.filter(id=camera_id).update(
                    detections={
                        "vehicles": len(vehicle_detections),
                        "pedestrians": len(person_detections),
                        "trackedPersons": len(tracks),
                        "cumulativeTracked": max(len(ctx.unique_track_ids), len(tracks)),
                        "loiteringCount": loitering_count,
                        "suspiciousActivity": has_suspicious,
                        "restrictedViolations": len(breach_events),
                    }
                )
            except Exception:
                pass

        return annotated_frame, ctx.latest_telemetry

import threading

class _LazyAIEngineService:
    def __init__(self):
        self._instance = None
        self._lock = threading.Lock()

    def _get(self):
        if self._instance is None:
            with self._lock:
                if self._instance is None:
                    self._instance = AIEngineService()
        return self._instance

    def __getattr__(self, name):
        return getattr(self._get(), name)

ai_engine_service = _LazyAIEngineService()
