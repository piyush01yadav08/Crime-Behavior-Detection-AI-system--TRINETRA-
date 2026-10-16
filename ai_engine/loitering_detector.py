import time
import math
import logging
from collections import deque
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class PersonState:
    def __init__(self, track_id: int, pos: tuple, current_time: float):
        self.track_id = track_id
        self.start_pos = pos
        self.current_pos = pos
        self.start_time = current_time
        self.last_update_time = current_time
        self.total_observed_time = 0.0
        self.trajectory = deque([pos], maxlen=45)
        self.is_loitering = False
        self.alert_triggered = False
        self.speed = 0.0
        self.departing_frames = 0


class LoiteringDetector:
    def __init__(self, distance_threshold: float = 60.0, time_threshold: float = 8.0, max_lost_time: float = 8.0):
        self.distance_threshold = distance_threshold
        self.time_threshold = time_threshold
        self.max_lost_time = max_lost_time
        self.person_states: Dict[int, PersonState] = {}
        self.on_loitering_alert = None  # Callback (dict) -> None

    def update(self, tracks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyzes movement patterns and updates loitering status for each track.
        Preserves dwell-time continuity across brief track interruptions and supports pacing.
        """
        current_time = time.time()
        active_ids = {t["track_id"] for t in tracks}
        enriched_results = []

        # Remove stale tracks absent longer than max_lost_time
        for tid in list(self.person_states.keys()):
            if tid not in active_ids and (current_time - self.person_states[tid].last_update_time) > self.max_lost_time:
                del self.person_states[tid]

        for track in tracks:
            tid = track["track_id"]
            cx, cy = track["center"]
            bbox = track["bbox"]

            if tid not in self.person_states:
                self.person_states[tid] = PersonState(tid, (cx, cy), current_time)

            state = self.person_states[tid]
            prev_x, prev_y = state.current_pos
            dt = current_time - state.last_update_time

            # If track was interrupted/occluded for a short duration (> 0.4s),
            # adjust start_time so unobserved gap is not counted as active presence,
            # while fully preserving previously accumulated dwell time.
            if dt > 0.4:
                unobserved_gap = dt - 0.04
                state.start_time += unobserved_gap

            dt_safe = max(0.01, dt)
            step_distance = math.sqrt((cx - prev_x)**2 + (cy - prev_y)**2)
            state.speed = round(step_distance / dt_safe, 1)

            # Update position and trajectory
            state.current_pos = (cx, cy)
            state.trajectory.append((cx, cy))
            state.last_update_time = current_time

            # Calculate displacement from anchor position
            sx, sy = state.start_pos
            displacement = math.sqrt((cx - sx)**2 + (cy - sy)**2)
            dwell_time = max(0.0, current_time - state.start_time)

            # Check pacing within a localized envelope
            traj_pts = list(state.trajectory)
            min_x = min(p[0] for p in traj_pts)
            max_x = max(p[0] for p in traj_pts)
            min_y = min(p[1] for p in traj_pts)
            max_y = max(p[1] for p in traj_pts)
            envelope_w = max_x - min_x
            envelope_h = max_y - min_y
            is_pacing_envelope = (envelope_w <= self.distance_threshold * 2.2 and envelope_h <= self.distance_threshold * 2.2)

            # Detect genuine sustained departure vs local pacing
            if displacement > (self.distance_threshold * 1.5) and not is_pacing_envelope:
                state.departing_frames += 1
                # Require 4 consecutive departing frames or large displacement to reset anchor
                if state.departing_frames >= 4 or displacement > (self.distance_threshold * 3.0):
                    state.start_pos = (cx, cy)
                    state.start_time = current_time
                    state.is_loitering = False
                    state.alert_triggered = False
                    displacement = 0.0
                    dwell_time = 0.0
                    state.departing_frames = 0
            else:
                state.departing_frames = max(0, state.departing_frames - 1)

            # Loitering condition: stayed within radius or pacing envelope for exceeding time threshold
            is_loitering = (dwell_time >= self.time_threshold and (displacement <= self.distance_threshold or is_pacing_envelope))
            state.is_loitering = is_loitering

            # Trigger alert callback once per incident
            if is_loitering and not state.alert_triggered:
                state.alert_triggered = True
                alert_payload = {
                    "track_id": tid,
                    "dwell_time": round(dwell_time, 1),
                    "displacement": round(displacement, 1),
                    "pos": (cx, cy),
                    "bbox": bbox,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
                }
                logger.warning(f"⚠️ Loitering detected for Subject #{tid}! Dwell: {dwell_time:.1f}s")
                if callable(self.on_loitering_alert):
                    try:
                        self.on_loitering_alert(alert_payload)
                    except Exception as e:
                        logger.error(f"Error in loitering alert callback: {e}")

            enriched_results.append({
                "track_id": tid,
                "bbox": bbox,
                "center": (cx, cy),
                "dwell_time": round(dwell_time, 1),
                "displacement": round(displacement, 1),
                "speed": state.speed,
                "is_loitering": is_loitering,
                "alert_triggered": state.alert_triggered,
                "trajectory": list(state.trajectory)
            })

        return enriched_results

    def annotate_frame(self, frame, analysis_results: List[Dict[str, Any]]):
        """
        Draws bounding boxes, trajectory trails, and loitering warnings directly onto the image frame.
        """
        try:
            import cv2
        except ImportError:
            return frame

        for res in analysis_results:
            x1, y1, x2, y2 = res["bbox"]
            tid = res["track_id"]
            dwell = res["dwell_time"]
            is_loiter = res["is_loitering"]
            traj = res.get("trajectory", [])

            # Trajectory path polyline
            if len(traj) > 1:
                pts = [tuple(p) for p in traj]
                for i in range(1, len(pts)):
                    cv2.line(frame, pts[i - 1], pts[i], (0, 220, 255), 1)

            # Color scheme: Red for Loitering, Orange for warning dwell > 50%, Green for normal
            if is_loiter:
                box_color = (0, 0, 255)  # BGR Red
                label_bg = (0, 0, 220)
                box_thickness = 2
            elif dwell > (self.time_threshold * 0.5):
                box_color = (0, 165, 255)  # Orange
                label_bg = (0, 140, 230)
                box_thickness = 2
            else:
                box_color = (0, 255, 120)  # Cyan/Green
                label_bg = (20, 140, 50)
                box_thickness = 1

            # Bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, box_thickness)

            # Corner accents
            c_len = 10
            cv2.line(frame, (x1, y1), (x1 + c_len, y1), box_color, 2)
            cv2.line(frame, (x1, y1), (x1, y1 + c_len), box_color, 2)
            cv2.line(frame, (x2, y1), (x2 - c_len, y1), box_color, 2)
            cv2.line(frame, (x2, y1), (x2, y1 + c_len), box_color, 2)

            # Top label badge
            label_text = f"Subject #{tid} | Dwell: {dwell:.0f}s"
            (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(frame, (x1, y1 - 18), (x1 + tw + 6, y1), label_bg, -1)
            cv2.putText(frame, label_text, (x1 + 3, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

            # Loitering Alert Banner
            if is_loiter:
                alert_text = "LOITERING ALERT"
                (aw, ah), _ = cv2.getTextSize(alert_text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                # Centered above box
                ax = max(10, (x1 + x2) // 2 - aw // 2)
                ay = max(25, y1 - 25)
                cv2.rectangle(frame, (ax - 6, ay - ah - 6), (ax + aw + 6, ay + 6), (0, 0, 230), -1)
                cv2.putText(frame, alert_text, (ax, ay), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

        return frame
