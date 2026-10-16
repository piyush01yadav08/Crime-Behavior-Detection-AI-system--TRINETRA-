import math
import time
import logging
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger(__name__)

class VirtualTripwire:
    def __init__(self, wire_id: str, pt1: Tuple[int, int], pt2: Tuple[int, int], name: str = "Tripwire Alpha"):
        self.id = wire_id
        self.pt1 = pt1  # (x1, y1)
        self.pt2 = pt2  # (x2, y2)
        self.name = name
        self.breached_tracks = set()

    def intersects(self, p1: Tuple[int, int], p2: Tuple[int, int]) -> bool:
        """Determines if segment (p1, p2) intersects with tripwire (pt1, pt2)."""
        def ccw(A, B, C):
            return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

        A, B = self.pt1, self.pt2
        C, D = p1, p2
        return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)


class RestrictedZone:
    def __init__(self, zone_id: str, polygon: List[Tuple[int, int]], name: str = "Restricted Bay"):
        self.id = zone_id
        self.polygon = polygon  # List of (x, y) vertices
        self.name = name
        self.active_violators = set()

    def contains_point(self, pt: Tuple[int, int]) -> bool:
        """Ray-casting algorithm to test point-in-polygon."""
        x, y = pt
        n = len(self.polygon)
        inside = False
        p1x, p1y = self.polygon[0]
        for i in range(n + 1):
            p2x, p2y = self.polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside


class ZoneMonitor:
    """
    Real-Time Perimeter & Tripwire Intrusion Analyzer.
    Supports customizable geometric boundaries and line crossings.
    """
    def __init__(self):
        # Default security zones calibrated for typical surveillance feeds (640x480 resolution)
        self.zones: Dict[str, RestrictedZone] = {
            "ZONE-HIGH-SEC": RestrictedZone(
                "ZONE-HIGH-SEC",
                [(440, 260), (630, 260), (630, 470), (440, 470)],
                name="High Security Perimeter"
            )
        }
        self.tripwires: Dict[str, VirtualTripwire] = {
            "TW-01": VirtualTripwire(
                "TW-01",
                (50, 410),
                (590, 410),
                name="Perimeter Virtual Tripwire #1"
            )
        }
        self.prev_positions: Dict[int, Tuple[int, int]] = {}
        self.cooldowns: Dict[str, float] = {}  # alert_key -> timestamp
        self.on_breach_alert = None  # Callback (dict) -> None

    def update(self, tracks: List[Dict[str, Any]], camera_id: str = "CAM-02") -> List[Dict[str, Any]]:
        """
        Analyzes active tracks against tripwires and restricted zones.
        Returns list of breach events detected this frame.
        """
        now = time.time()
        breaches = []

        for track in tracks:
            tid = track["track_id"]
            cx, cy = track["center"]
            prev_pos = self.prev_positions.get(tid, (cx, cy))

            # 1. Test Restricted Zone containment
            for zid, zone in self.zones.items():
                is_inside = zone.contains_point((cx, cy))
                if is_inside:
                    zone.active_violators.add(tid)
                    cooldown_key = f"{camera_id}_{zid}_{tid}"
                    if now - self.cooldowns.get(cooldown_key, 0) > 10.0:
                        self.cooldowns[cooldown_key] = now
                        event = {
                            "type": "ZONE_BREACH",
                            "camera_id": camera_id,
                            "zone_id": zid,
                            "zone_name": zone.name,
                            "track_id": tid,
                            "position": (cx, cy),
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
                        }
                        breaches.append(event)
                        if callable(self.on_breach_alert):
                            self.on_breach_alert(event)
                else:
                    zone.active_violators.discard(tid)

            # 2. Test Virtual Tripwire crossing
            for tw_id, wire in self.tripwires.items():
                if wire.intersects(prev_pos, (cx, cy)):
                    cooldown_key = f"{camera_id}_{tw_id}_{tid}"
                    if now - self.cooldowns.get(cooldown_key, 0) > 10.0:
                        self.cooldowns[cooldown_key] = now
                        event = {
                            "type": "TRIPWIRE_BREACH",
                            "camera_id": camera_id,
                            "tripwire_id": tw_id,
                            "tripwire_name": wire.name,
                            "track_id": tid,
                            "position": (cx, cy),
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
                        }
                        breaches.append(event)
                        if callable(self.on_breach_alert):
                            self.on_breach_alert(event)

            self.prev_positions[tid] = (cx, cy)

        # Cleanup tracks
        active_tids = {t["track_id"] for t in tracks}
        for tid in list(self.prev_positions.keys()):
            if tid not in active_tids:
                del self.prev_positions[tid]

        return breaches

    def annotate_frame(self, frame) -> Any:
        """Renders cyber HUD virtual tripwires and restricted zones onto video frame."""
        try:
            import cv2
            import numpy as np
        except ImportError:
            return frame

        overlay = frame.copy()

        # Render Restricted Zones
        for zone in self.zones.values():
            pts = np.array(zone.polygon, np.int32).reshape((-1, 1, 2))
            is_breached = len(zone.active_violators) > 0

            # Color: pulsing red if breached, cyan/purple when normal
            fill_color = (0, 0, 180) if is_breached else (80, 20, 120)
            border_color = (0, 0, 255) if is_breached else (200, 100, 255)

            cv2.fillPoly(overlay, [pts], fill_color)
            cv2.polylines(frame, [pts], True, border_color, 2, cv2.LINE_AA)

            # Zone label
            lx, ly = zone.polygon[0]
            label = f"[RESTRICTED] {zone.name}" + (" - BREACH DETECTED!" if is_breached else "")
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.40, 1)
            cv2.rectangle(frame, (lx, ly - 16), (lx + tw + 6, ly), (0, 0, 0), -1)
            cv2.putText(frame, label, (lx + 3, ly - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.40,
                        (0, 50, 255) if is_breached else (220, 150, 255), 1, cv2.LINE_AA)

        # Alpha blend overlay for soft transparent zones
        cv2.addWeighted(overlay, 0.25, frame, 0.75, 0, frame)

        # Render Virtual Tripwires
        for wire in self.tripwires.values():
            cv2.line(frame, wire.pt1, wire.pt2, (0, 230, 255), 2, cv2.LINE_AA)
            # Tripwire hash accents
            mx = (wire.pt1[0] + wire.pt2[0]) // 2
            my = (wire.pt1[1] + wire.pt2[1]) // 2
            cv2.putText(frame, f"-- {wire.name} --", (mx - 90, my - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 230, 255), 1, cv2.LINE_AA)

        return frame
