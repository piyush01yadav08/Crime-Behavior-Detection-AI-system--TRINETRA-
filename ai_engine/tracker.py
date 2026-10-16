import math
import logging
from typing import List, Dict, Any, Tuple
import numpy as np
from scipy.optimize import linear_sum_assignment

logger = logging.getLogger(__name__)


class KalmanBoxTracker:
    """
    8-state Kalman Filter for tracking 2D bounding boxes:
    State: [cx, cy, a, h, vx, vy, va, vh]^T
    Measurement: [cx, cy, a, h]^T
    where (cx, cy) is box center, a is aspect ratio (w/h), and h is height.
    """
    def __init__(self, bbox: List[int]):
        # State transition matrix F (constant velocity)
        self.F = np.eye(8, dtype=np.float32)
        for i in range(4):
            self.F[i, i + 4] = 1.0

        # Measurement matrix H
        self.H = np.eye(4, 8, dtype=np.float32)

        # Measurement noise covariance R
        self.R = np.eye(4, dtype=np.float32) * 1.0

        # Process noise covariance Q
        self.Q = np.eye(8, dtype=np.float32) * 1.0
        self.Q[4:, 4:] *= 2.0

        # State estimation covariance P
        self.P = np.eye(8, dtype=np.float32) * 10.0
        self.P[4:, 4:] *= 100.0

        # Initial state x
        cx, cy, a, h = self._bbox_to_z(bbox)
        self.x = np.array([cx, cy, a, h, 0, 0, 0, 0], dtype=np.float32)

    @staticmethod
    def _bbox_to_z(bbox: List[int]) -> Tuple[float, float, float, float]:
        x1, y1, x2, y2 = bbox
        w = max(1.0, float(x2 - x1))
        h = max(1.0, float(y2 - y1))
        cx = float(x1) + w / 2.0
        cy = float(y1) + h / 2.0
        a = w / h
        return cx, cy, a, h

    def predict(self) -> List[int]:
        """Advances state vector by 1 time step and returns predicted bbox [x1, y1, x2, y2]."""
        self.x = np.dot(self.F, self.x)
        self.P = np.dot(np.dot(self.F, self.P), self.F.T) + self.Q
        # Bound aspect ratio and height to positive values
        self.x[2] = max(0.05, float(self.x[2]))
        self.x[3] = max(1.0, float(self.x[3]))
        return self.to_ltrb()

    def update(self, bbox: List[int]):
        """Updates state with observed bounding box measurement."""
        z = np.array(self._bbox_to_z(bbox), dtype=np.float32)
        y = z - np.dot(self.H, self.x)
        S = np.dot(np.dot(self.H, self.P), self.H.T) + self.R
        try:
            K = np.dot(np.dot(self.P, self.H.T), np.linalg.inv(S))
        except np.linalg.LinAlgError:
            K = np.dot(np.dot(self.P, self.H.T), np.linalg.pinv(S))

        self.x = self.x + np.dot(K, y)
        I_KH = np.eye(8, dtype=np.float32) - np.dot(K, self.H)
        self.P = np.dot(I_KH, self.P)
        self.x[2] = max(0.05, float(self.x[2]))
        self.x[3] = max(1.0, float(self.x[3]))

    def to_ltrb(self) -> List[int]:
        """Converts state [cx, cy, a, h] to integer coordinates [x1, y1, x2, y2]."""
        cx, cy, a, h = float(self.x[0]), float(self.x[1]), float(self.x[2]), float(self.x[3])
        w = a * h
        x1 = int(round(cx - w / 2.0))
        y1 = int(round(cy - h / 2.0))
        x2 = int(round(cx + w / 2.0))
        y2 = int(round(cy + h / 2.0))
        return [x1, y1, x2, y2]


class Track:
    """Internal track representation with Kalman Filter and hit/miss lifecycle."""
    def __init__(self, track_id: int, bbox: List[int], confidence: float, n_init: int = 1):
        self.track_id = track_id
        self.kalman = KalmanBoxTracker(bbox)
        self.bbox = [int(v) for v in bbox]
        self.confidence = float(confidence)
        self.hits = 1
        self.misses = 0
        self.time_since_update = 0
        self.n_init = n_init
        self.confirmed = (n_init <= 1)

    @property
    def center(self) -> Tuple[int, int]:
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) // 2, (y1 + y2) // 2)

    def predict(self) -> List[int]:
        pred_box = self.kalman.predict()
        self.time_since_update += 1
        self.misses += 1
        return pred_box

    def update(self, bbox: List[int], confidence: float):
        self.kalman.update(bbox)
        self.bbox = [int(v) for v in bbox]
        self.confidence = float(confidence)
        self.hits += 1
        self.misses = 0
        self.time_since_update = 0
        if self.hits >= self.n_init:
            self.confirmed = True

    def to_ltrb(self) -> List[int]:
        return self.bbox


class PersonTracker:
    """
    Stabilized ByteTrack-style Multi-Object Tracker.
    - Two-stage Hungarian assignment for high-confidence and low-confidence detections.
    - 8-state Kalman Filter motion prediction.
    - Preserves exact public interface: update(detections, frame=None) -> List[Dict].
    """
    def __init__(
        self,
        max_age: int = 30,
        iou_thresh: float = 0.3,
        n_init: int = 1,
        high_thresh: float = 0.45,
        low_thresh: float = 0.10,
    ):
        self.max_age = max_age
        self.iou_thresh = iou_thresh
        self.n_init = n_init
        self.high_thresh = high_thresh
        self.low_thresh = low_thresh
        self.tracks: Dict[int, Track] = {}
        self.next_id = 101

    @staticmethod
    def _calculate_iou(boxA: List[int], boxB: List[int]) -> float:
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        if interArea == 0:
            return 0.0

        boxAArea = max(1, (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]))
        boxBArea = max(1, (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]))
        iou = interArea / float(boxAArea + boxBArea - interArea)
        return float(iou)

    def _iou_cost_matrix(self, track_boxes: List[List[int]], det_boxes: List[List[int]]) -> np.ndarray:
        n = len(track_boxes)
        m = len(det_boxes)
        if n == 0 or m == 0:
            return np.empty((n, m), dtype=np.float32)

        cost = np.ones((n, m), dtype=np.float32)
        for i, tb in enumerate(track_boxes):
            for j, db in enumerate(det_boxes):
                iou = self._calculate_iou(tb, db)
                cost[i, j] = 1.0 - iou
        return cost

    def update(self, detections: List[Dict[str, Any]], frame=None) -> List[Dict[str, Any]]:
        """
        Updates tracking state with new detections using ByteTrack two-stage association.
        Returns active confirmed tracks for the current frame:
        [{"track_id": int, "bbox": [x1, y1, x2, y2], "confidence": float, "center": (cx, cy)}]
        """
        # Step 1: Predict all existing tracks
        for track in list(self.tracks.values()):
            track.predict()

        # Handle empty detection list cleanly
        if not detections:
            # Expire stale tracks
            for tid, t in list(self.tracks.items()):
                if t.time_since_update > self.max_age:
                    del self.tracks[tid]
            return []

        # Validate bounding boxes and extract clean detections
        valid_dets = []
        for d in detections:
            bbox = d.get("bbox")
            if not bbox or len(bbox) != 4:
                continue
            x1, y1, x2, y2 = bbox
            if (x2 - x1) <= 0 or (y2 - y1) <= 0:
                continue
            valid_dets.append({
                "bbox": [int(x1), int(y1), int(x2), int(y2)],
                "confidence": float(d.get("confidence", 0.5)),
            })

        if not valid_dets:
            for tid, t in list(self.tracks.items()):
                if t.time_since_update > self.max_age:
                    del self.tracks[tid]
            return []

        # Step 2: Partition detections into high and low confidence
        det_high = [d for d in valid_dets if d["confidence"] >= self.high_thresh]
        det_low = [d for d in valid_dets if self.low_thresh <= d["confidence"] < self.high_thresh]

        # In case all detections are below high_thresh (e.g. low-light), promote top detections to det_high
        if not det_high and valid_dets:
            det_high = valid_dets
            det_low = []

        active_track_list = list(self.tracks.values())
        matched_track_ids = set()
        matched_detections_high = set()

        # Step 3: First Association (Tracks with High-Confidence Detections)
        if active_track_list and det_high:
            track_boxes = [t.to_ltrb() for t in active_track_list]
            det_boxes = [d["bbox"] for d in det_high]
            cost_matrix = self._iou_cost_matrix(track_boxes, det_boxes)

            row_ind, col_ind = linear_sum_assignment(cost_matrix)
            max_cost = 1.0 - self.iou_thresh

            for r, c in zip(row_ind, col_ind):
                if cost_matrix[r, c] <= max_cost:
                    track = active_track_list[r]
                    det = det_high[c]
                    track.update(det["bbox"], det["confidence"])
                    matched_track_ids.add(track.track_id)
                    matched_detections_high.add(c)

        # Step 4: Second Association (Remaining Unmatched Confirmed Tracks with Low-Confidence Detections)
        unmatched_tracks = [t for t in active_track_list if t.track_id not in matched_track_ids and t.confirmed]
        if unmatched_tracks and det_low:
            track_boxes = [t.to_ltrb() for t in unmatched_tracks]
            det_boxes = [d["bbox"] for d in det_low]
            cost_matrix = self._iou_cost_matrix(track_boxes, det_boxes)

            row_ind, col_ind = linear_sum_assignment(cost_matrix)
            max_cost_low = 1.0 - 0.20  # Relaxed threshold for low confidence

            for r, c in zip(row_ind, col_ind):
                if cost_matrix[r, c] <= max_cost_low:
                    track = unmatched_tracks[r]
                    det = det_low[c]
                    track.update(det["bbox"], det["confidence"])
                    matched_track_ids.add(track.track_id)

        # Step 5: Initialize new tracks for unmatched high-confidence detections
        for i, det in enumerate(det_high):
            if i not in matched_detections_high:
                new_track = Track(self.next_id, det["bbox"], det["confidence"], n_init=self.n_init)
                self.tracks[self.next_id] = new_track
                if new_track.confirmed:
                    matched_track_ids.add(self.next_id)
                self.next_id += 1

        # Step 6: Expire stale tracks
        for tid, t in list(self.tracks.items()):
            if t.time_since_update > self.max_age:
                del self.tracks[tid]

        # Step 7: Format output active confirmed tracks matched in this frame
        results = []
        for tid in matched_track_ids:
            if tid in self.tracks:
                t = self.tracks[tid]
                if t.confirmed:
                    results.append({
                        "track_id": t.track_id,
                        "bbox": t.to_ltrb(),
                        "confidence": round(t.confidence, 3),
                        "center": t.center,
                    })

        # Sort by track_id for deterministic downstream behavior
        results.sort(key=lambda r: r["track_id"])
        return results

