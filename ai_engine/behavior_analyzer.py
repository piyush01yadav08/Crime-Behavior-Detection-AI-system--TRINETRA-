import math
import time
import logging
from collections import deque
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger(__name__)

class TrackKinematics:
    def __init__(self, track_id: int, pos: Tuple[int, int], bbox: List[int], current_time: float):
        self.track_id = track_id
        self.pos = pos
        self.bbox = bbox
        self.last_time = current_time
        self.velocity = (0.0, 0.0)  # (vx, vy) px/s
        self.speed = 0.0            # px/s
        self.aspect_ratios = deque([self._calc_ar(bbox)], maxlen=20)
        self.positions = deque([pos], maxlen=25)
        self.fall_start_time: Optional[float] = None
        self.is_fallen = False
        self.fall_alerted = False

    def _calc_ar(self, bbox: List[int]) -> float:
        w = max(1, bbox[2] - bbox[0])
        h = max(1, bbox[3] - bbox[1])
        return round(h / w, 2)

    def update(self, pos: Tuple[int, int], bbox: List[int], current_time: float):
        dt = max(0.01, current_time - self.last_time)
        dx = pos[0] - self.pos[0]
        dy = pos[1] - self.pos[1]

        self.velocity = (dx / dt, dy / dt)
        self.speed = math.sqrt(self.velocity[0]**2 + self.velocity[1]**2)
        self.pos = pos
        self.bbox = bbox
        self.last_time = current_time
        self.positions.append(pos)

        ar = self._calc_ar(bbox)
        self.aspect_ratios.append(ar)

        # Fall analysis: collapsed aspect ratio (horizontal posture) and motionless state
        if ar < 0.65:
            if self.fall_start_time is None:
                self.fall_start_time = current_time
            elif (current_time - self.fall_start_time) >= 1.5 and self.speed < 60.0:
                self.is_fallen = True
        else:
            self.fall_start_time = None
            self.is_fallen = False
            self.fall_alerted = False


class BehaviorAnalyzer:
    """
    Advanced Multi-Modal Kinetic Behavior Analyzer:
    - Aggressive Interaction & Sudden Convergence
    - Slip, Trip & Fall Detection
    - High-Speed Pursuit / Chase
    - Crowd Panic Dispersal
    """
    def __init__(self):
        self.kinematics: Dict[int, TrackKinematics] = {}
        self.cooldowns: Dict[str, float] = {}  # alert_key -> timestamp
        self.on_behavior_alert = None  # Callback (dict) -> None

    def update(self, tracks: List[Dict[str, Any]], camera_id: str = "CAM-02") -> List[Dict[str, Any]]:
        now = time.time()
        active_ids = {t["track_id"] for t in tracks}
        events = []

        # Remove dead tracks
        for tid in list(self.kinematics.keys()):
            if tid not in active_ids and (now - self.kinematics[tid].last_time) > 3.0:
                del self.kinematics[tid]

        # Update kinematics
        for t in tracks:
            tid = t["track_id"]
            pos = t["center"]
            bbox = t["bbox"]

            if tid not in self.kinematics:
                self.kinematics[tid] = TrackKinematics(tid, pos, bbox, now)
            else:
                self.kinematics[tid].update(pos, bbox, now)

        # 1. Fall / Collapse Detection
        for tid, k in self.kinematics.items():
            if k.is_fallen and not k.fall_alerted:
                cooldown_key = f"{camera_id}_fall_{tid}"
                if now - self.cooldowns.get(cooldown_key, 0) > 15.0:
                    k.fall_alerted = True
                    self.cooldowns[cooldown_key] = now
                    event = {
                        "behavior": "Fall / Collapse Detected",
                        "severity": "HIGH",
                        "riskScore": 84,
                        "camera": camera_id,
                        "personId": f"TRK-{tid}",
                        "description": f"Subject TRK-{tid} suffered abrupt vertical collapse (AR < 0.65) and remained recumbent.",
                        "recommendedAction": "Dispatch medical first responders and security marshal immediately.",
                        "tags": ["Medical Assist", "Fall Incident", "High Risk"]
                    }
                    events.append(event)
                    if callable(self.on_behavior_alert):
                        self.on_behavior_alert(event)

        # 2. Aggressive Interaction / Hostile Closing Velocity
        track_list = [k for k in self.kinematics.values() if k.track_id in active_ids]
        n = len(track_list)

        for i in range(n):
            for j in range(i + 1, n):
                k1, k2 = track_list[i], track_list[j]
                dist = math.sqrt((k1.pos[0] - k2.pos[0])**2 + (k1.pos[1] - k2.pos[1])**2)

                # Two subjects very close (< 65 px) with high combined speeds or rapid approach
                if dist < 65.0:
                    closing_speed = k1.speed + k2.speed
                    if closing_speed > 130.0:
                        pair_key = f"{camera_id}_agg_{min(k1.track_id, k2.track_id)}_{max(k1.track_id, k2.track_id)}"
                        if now - self.cooldowns.get(pair_key, 0) > 12.0:
                            self.cooldowns[pair_key] = now
                            event = {
                                "behavior": "Aggressive Interaction",
                                "severity": "HIGH",
                                "riskScore": 88,
                                "camera": camera_id,
                                "personId": f"TRK-{k1.track_id} & TRK-{k2.track_id}",
                                "description": f"Rapid physical convergence (speed {closing_speed:.0f} px/s) between subjects TRK-{k1.track_id} and TRK-{k2.track_id}.",
                                "recommendedAction": "Alert local patrol unit. Dispatch campus security to de-escalate confrontation.",
                                "tags": ["Hostile Vector", "Confrontation", "Public Area"]
                            }
                            events.append(event)
                            if callable(self.on_behavior_alert):
                                self.on_behavior_alert(event)

        # 3. High-Speed Pursuit / Chase Detection
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                k1, k2 = track_list[i], track_list[j]
                # High speed (> 190 px/s) moving in similar direction, following distance 40-150px
                if k1.speed > 190.0 and k2.speed > 170.0:
                    dist = math.sqrt((k1.pos[0] - k2.pos[0])**2 + (k1.pos[1] - k2.pos[1])**2)
                    if 35.0 < dist < 160.0:
                        chase_key = f"{camera_id}_chase_{k1.track_id}_{k2.track_id}"
                        if now - self.cooldowns.get(chase_key, 0) > 15.0:
                            self.cooldowns[chase_key] = now
                            event = {
                                "behavior": "Pursuit / Chase Detection",
                                "severity": "HIGH",
                                "riskScore": 79,
                                "camera": camera_id,
                                "personId": f"TRK-{k1.track_id} -> TRK-{k2.track_id}",
                                "description": f"High velocity pursuit trajectory identified between TRK-{k1.track_id} and TRK-{k2.track_id}.",
                                "recommendedAction": "Broadcast alert to adjacent corridor cameras and dispatch field officer.",
                                "tags": ["Pursuit", "High Velocity", "Active Chase"]
                            }
                            events.append(event)
                            if callable(self.on_behavior_alert):
                                self.on_behavior_alert(event)

        # 4. Crowd Panic / Rapid Multi-Directional Dispersal (if >= 3 subjects)
        if n >= 3:
            sprinting_count = sum(1 for k in track_list if k.speed > 160.0)
            if sprinting_count >= 3:
                panic_key = f"{camera_id}_panic"
                if now - self.cooldowns.get(panic_key, 0) > 20.0:
                    self.cooldowns[panic_key] = now
                    event = {
                        "behavior": "Crowd Panic Pattern",
                        "severity": "CRITICAL",
                        "riskScore": 92,
                        "camera": camera_id,
                        "personId": "MULTIPLE_SUBJECTS",
                        "description": f"Sudden multi-directional explosive acceleration flagged across {sprinting_count} subjects simultaneously.",
                        "recommendedAction": "Initiate Tier 1 Emergency protocol. Check audio feed and alert central security command.",
                        "tags": ["Crowd Panic", "Mass Dispersal", "Critical Incident"]
                    }
                    events.append(event)
                    if callable(self.on_behavior_alert):
                        self.on_behavior_alert(event)

        return events

    def annotate_frame(self, frame) -> Any:
        """Annotates fallen persons or confrontational vectors on video frame."""
        try:
            import cv2
        except ImportError:
            return frame

        for k in self.kinematics.values():
            if k.is_fallen:
                x1, y1, x2, y2 = k.bbox
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                alert_text = "EMERGENCY: FALL DETECTED"
                (tw, th), _ = cv2.getTextSize(alert_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                cv2.rectangle(frame, (x1, max(15, y1 - 22)), (x1 + tw + 6, max(25, y1)), (0, 0, 220), -1)
                cv2.putText(frame, alert_text, (x1 + 3, max(22, y1 - 5)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)

        return frame
