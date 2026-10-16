import os
import sys

# Ensure backend root and project root are in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
project_root = os.path.abspath(os.path.join(backend_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "trinetra_backend.settings")
import django
django.setup()

import unittest
import numpy as np
import time
from ai_engine.human_detector import HumanDetector
from ai_engine.tracker import PersonTracker
from ai_engine.loitering_detector import LoiteringDetector
from ai_engine.behavior_analyzer import BehaviorAnalyzer
from ai_engine.zone_monitor import ZoneMonitor, RestrictedZone, VirtualTripwire
from surveillance.services.ai_engine_service import AIEngineService

class TestAIEngine(unittest.TestCase):
    def setUp(self):
        self.frame = np.zeros((480, 640, 3), dtype=np.uint8)

    def test_human_detector_init_and_detect(self):
        detector = HumanDetector(conf_thresh=0.4)
        # Test detection on black frame (should return empty list without error)
        detections = detector.detect(self.frame)
        self.assertIsInstance(detections, list)

    def test_person_tracker_lifecycle(self):
        tracker = PersonTracker(max_age=5, iou_thresh=0.2)
        det1 = [{"bbox": [100, 100, 160, 240], "confidence": 0.88, "label": "person", "category": "person"}]
        tracks1 = tracker.update(det1, frame=self.frame)
        self.assertEqual(len(tracks1), 1)
        tid = tracks1[0]["track_id"]

        # Follow up frame with small shift
        det2 = [{"bbox": [105, 105, 165, 245], "confidence": 0.90, "label": "person", "category": "person"}]
        tracks2 = tracker.update(det2, frame=self.frame)
        self.assertEqual(len(tracks2), 1)
        self.assertEqual(tracks2[0]["track_id"], tid, "Track ID must remain continuous on slight movement")

    def test_loitering_detector(self):
        detector = LoiteringDetector(distance_threshold=50.0, time_threshold=0.1)
        alert_triggered = []
        detector.on_loitering_alert = lambda payload: alert_triggered.append(payload)

        # Subject stationary at (100, 100)
        tracks = [{"track_id": 101, "center": (100, 100), "bbox": [80, 80, 120, 160]}]
        detector.update(tracks)
        time.sleep(0.15)
        res = detector.update(tracks)

        self.assertTrue(res[0]["is_loitering"], "Subject should be flagged as loitering after exceeding dwell threshold")
        self.assertGreaterEqual(len(alert_triggered), 1, "Loitering alert callback must be fired")

    def test_loitering_brief_disappearance_continuity(self):
        detector = LoiteringDetector(distance_threshold=50.0, time_threshold=0.2, max_lost_time=2.0)
        tracks = [{"track_id": 105, "center": (100, 100), "bbox": [80, 80, 120, 160]}]
        
        # Frame 1 at t=0
        detector.update(tracks)
        time.sleep(0.12)
        
        # Frame 2 at t=0.12: track present
        res1 = detector.update(tracks)
        dwell_before = res1[0]["dwell_time"]
        self.assertGreater(dwell_before, 0.08)

        # Disappears for 0.1s (empty track update)
        detector.update([])
        time.sleep(0.1)

        # Returns: dwell time must continue accumulating from prior observed time, not reset to 0
        res2 = detector.update(tracks)
        self.assertEqual(len(res2), 1)
        self.assertGreaterEqual(res2[0]["dwell_time"], dwell_before, "Dwell time must not reset to zero after brief disappearance")

    def test_loitering_pacing_within_area(self):
        detector = LoiteringDetector(distance_threshold=60.0, time_threshold=0.25)
        # Subject paces back and forth along x between 100 and 150 (within pacing envelope)
        positions = [100, 115, 130, 145, 130, 115, 100, 120, 140, 110]
        loiter_flagged = False
        for x in positions:
            t = [{"track_id": 106, "center": (x, 100), "bbox": [x - 20, 80, x + 20, 160]}]
            res = detector.update(t)
            if res[0]["is_loitering"]:
                loiter_flagged = True
            time.sleep(0.04)

        self.assertTrue(loiter_flagged, "Subject pacing within localized area must be flagged as loitering")

    def test_loitering_two_subjects_passing_close(self):
        detector = LoiteringDetector(distance_threshold=50.0, time_threshold=0.2)
        # Person 101 stationary at (100, 100), Person 102 walks right past them from (90, 80) to (110, 120)
        # Person 101 accumulates dwell time
        t101 = {"track_id": 101, "center": (100, 100), "bbox": [80, 80, 120, 160]}
        detector.update([t101])
        time.sleep(0.12)

        # Person 102 enters nearby
        t102 = {"track_id": 102, "center": (102, 102), "bbox": [82, 82, 122, 162]}
        res = detector.update([t101, t102])
        r101 = next(r for r in res if r["track_id"] == 101)
        r102 = next(r for r in res if r["track_id"] == 102)

        # Person 102 is fresh so dwell time is near 0; Person 101 retains accumulated dwell time
        self.assertGreaterEqual(r101["dwell_time"], 0.10)
        self.assertLess(r102["dwell_time"], 0.05)
        self.assertNotEqual(r101["dwell_time"], r102["dwell_time"])

    def test_loitering_departure_expires_state(self):
        detector = LoiteringDetector(distance_threshold=40.0, time_threshold=0.2, max_lost_time=0.2)
        t = [{"track_id": 107, "center": (100, 100), "bbox": [80, 80, 120, 160]}]
        detector.update(t)
        self.assertIn(107, detector.person_states)

        # Subject leaves for longer than max_lost_time (0.2s)
        time.sleep(0.25)
        detector.update([])

        # State should be purged
        self.assertNotIn(107, detector.person_states, "State must expire after exceeding max_lost_time")

        analyzer = BehaviorAnalyzer()
        fall_events = []
        analyzer.on_behavior_alert = lambda e: fall_events.append(e)

        # 1. Standing human (height 120, width 40 -> AR = 3.0)
        t_stand = [{"track_id": 102, "center": (200, 200), "bbox": [180, 140, 220, 260]}]
        analyzer.update(t_stand)

        # 2. Collapse to horizontal (height 30, width 100 -> AR = 0.3)
        t_fall = [{"track_id": 102, "center": (200, 250), "bbox": [150, 235, 250, 265]}]
        analyzer.update(t_fall)
        time.sleep(1.6)
        analyzer.update(t_fall)

        self.assertGreaterEqual(len(fall_events), 1, "Fall alert should trigger after horizontal posture threshold")
        self.assertEqual(fall_events[0]["behavior"], "Fall / Collapse Detected")

    def test_behavior_analyzer_aggression(self):
        analyzer = BehaviorAnalyzer()
        agg_events = []
        analyzer.on_behavior_alert = lambda e: agg_events.append(e)

        # Frame 1: Two subjects at (200, 200) and (280, 200) -> distance 80px
        analyzer.update([
            {"track_id": 201, "center": (200, 200), "bbox": [180, 150, 220, 250]},
            {"track_id": 202, "center": (280, 200), "bbox": [260, 150, 300, 250]}
        ])
        time.sleep(0.05)

        # Frame 2: Rapid convergence to (225, 200) and (235, 200) -> distance 10px, high closing speed
        analyzer.update([
            {"track_id": 201, "center": (225, 200), "bbox": [205, 150, 245, 250]},
            {"track_id": 202, "center": (235, 200), "bbox": [215, 150, 255, 250]}
        ])

        self.assertGreaterEqual(len(agg_events), 1, "Aggressive interaction should trigger on rapid convergence")
        self.assertEqual(agg_events[0]["behavior"], "Aggressive Interaction")

    def test_zone_monitor_tripwire_and_polygon(self):
        monitor = ZoneMonitor()
        breaches = []
        monitor.on_breach_alert = lambda b: breaches.append(b)

        # Tripwire at y=410, from x=50 to 590
        # Subject moves from y=390 to y=430 (crossing y=410)
        track_before = [{"track_id": 301, "center": (200, 390), "bbox": [180, 350, 220, 430]}]
        monitor.update(track_before)

        track_after = [{"track_id": 301, "center": (200, 430), "bbox": [180, 390, 220, 470]}]
        breach_events = monitor.update(track_after)

        self.assertGreaterEqual(len(breaches), 1, "Tripwire crossing must trigger breach event")
        self.assertEqual(breaches[0]["type"], "TRIPWIRE_BREACH")

    def test_tracker_empty_frames(self):
        tracker = PersonTracker()
        tracks = tracker.update([], frame=self.frame)
        self.assertEqual(tracks, [])

    def test_tracker_single_moving_subject(self):
        tracker = PersonTracker(max_age=10)
        track_ids = []
        for i in range(10):
            x1 = 100 + i * 15
            y1 = 100
            det = [{"bbox": [x1, y1, x1 + 60, y1 + 140], "confidence": 0.88, "label": "person", "category": "person"}]
            tracks = tracker.update(det, frame=self.frame)
            self.assertEqual(len(tracks), 1, f"Expected 1 track on frame {i}")
            track_ids.append(tracks[0]["track_id"])
        
        # All frames must have the exact same track ID
        self.assertEqual(len(set(track_ids)), 1, f"Track ID switched during single-subject movement: {track_ids}")

    def test_tracker_two_subjects_crossing(self):
        tracker = PersonTracker(max_age=15, iou_thresh=0.2)
        # Person A moves 100 -> 300, Person B moves 300 -> 100 across 9 frames
        # They cross at frame 4 around x=200
        pA_history = []
        pB_history = []
        for i in range(9):
            xA = 100 + i * 25
            xB = 300 - i * 25
            det = [
                {"bbox": [xA, 120, xA + 50, 240], "confidence": 0.90, "label": "person", "category": "person"},
                {"bbox": [xB, 120, xB + 50, 240], "confidence": 0.90, "label": "person", "category": "person"},
            ]
            tracks = tracker.update(det, frame=self.frame)
            # Find closest track to xA and xB
            tA = min(tracks, key=lambda t: abs(t["bbox"][0] - xA))
            tB = min(tracks, key=lambda t: abs(t["bbox"][0] - xB))
            pA_history.append(tA["track_id"])
            pB_history.append(tB["track_id"])

        self.assertEqual(pA_history[0], pA_history[-1], "Person A track ID changed after crossing")
        self.assertEqual(pB_history[0], pB_history[-1], "Person B track ID changed after crossing")
        self.assertNotEqual(pA_history[-1], pB_history[-1], "Person A and B merged into same ID")

    def test_tracker_brief_occlusion(self):
        tracker = PersonTracker(max_age=5)
        # Frames 0..2: visible
        initial_id = None
        for i in range(3):
            det = [{"bbox": [150 + i * 5, 120, 200 + i * 5, 240], "confidence": 0.88, "label": "person", "category": "person"}]
            tracks = tracker.update(det, frame=self.frame)
            initial_id = tracks[0]["track_id"]

        # Frames 3..4: occluded (no detection)
        tracker.update([], frame=self.frame)
        tracker.update([], frame=self.frame)

        # Frame 5: reappears nearby
        det_reappear = [{"bbox": [170, 120, 220, 240], "confidence": 0.85, "label": "person", "category": "person"}]
        tracks_reappear = tracker.update(det_reappear, frame=self.frame)
        self.assertEqual(len(tracks_reappear), 1)
        self.assertEqual(tracks_reappear[0]["track_id"], initial_id, "Track ID must persist through brief occlusion")

    def test_tracker_low_confidence_detections(self):
        tracker = PersonTracker(max_age=10)
        # Frame 0: high confidence detection
        det1 = [{"bbox": [100, 100, 160, 220], "confidence": 0.85, "label": "person", "category": "person"}]
        tracks1 = tracker.update(det1, frame=self.frame)
        tid = tracks1[0]["track_id"]

        # Frame 1: confidence dips to 0.25 (partial occlusion/blur)
        det2 = [{"bbox": [105, 100, 165, 220], "confidence": 0.25, "label": "person", "category": "person"}]
        tracks2 = tracker.update(det2, frame=self.frame)
        self.assertEqual(len(tracks2), 1, "Low-confidence detection should be associated to existing track")
        self.assertEqual(tracks2[0]["track_id"], tid)

    def test_tracker_false_positive_filtering(self):
        tracker = PersonTracker(max_age=5, n_init=2)
        # Single transient false detection (1 frame only)
        fp_det = [{"bbox": [50, 50, 90, 130], "confidence": 0.55, "label": "person", "category": "person"}]
        tracks1 = tracker.update(fp_det, frame=self.frame)
        # With n_init=2, a single-frame detection is tentative and should not be emitted
        self.assertEqual(len(tracks1), 0, "Transient single-frame false positive should not be confirmed when n_init=2")

    def test_tracker_expiration(self):
        tracker = PersonTracker(max_age=3)
        det = [{"bbox": [100, 100, 160, 220], "confidence": 0.85, "label": "person", "category": "person"}]
        tracker.update(det, frame=self.frame)
        
        # 4 empty frames (exceeding max_age=3)
        for _ in range(4):
            tracker.update([], frame=self.frame)
        
        # Now a new detection far away should receive a NEW track id
        det_new = [{"bbox": [400, 400, 460, 520], "confidence": 0.85, "label": "person", "category": "person"}]
        tracks = tracker.update(det_new, frame=self.frame)
        self.assertEqual(len(tracks), 1)
        # Prior track was expired, active tracks should only be the new one
        self.assertNotIn(101, [t["track_id"] for t in tracks if t["track_id"] != tracks[0]["track_id"]])

    def test_full_ai_engine_service_pipeline(self):
        engine = AIEngineService()
        annotated_frame, telemetry = engine.process_frame(self.frame, camera_id="CAM-02")

        self.assertIsNotNone(annotated_frame)
        self.assertIsInstance(telemetry, dict)
        self.assertIn("detectedPersons", telemetry)
        self.assertIn("detectedVehicles", telemetry)
        self.assertIn("trackedPersons", telemetry)
        self.assertIn("cumulativeTrackedPersons", telemetry)
        self.assertIn("loiteringPersons", telemetry)
        self.assertIn("activeBehaviors", telemetry)

    def test_multicamera_state_isolation(self):
        engine = AIEngineService()
        ctx1 = engine.get_context("CAM-10")
        ctx2 = engine.get_context("CAM-20")

        # Track person on CAM-10
        det10 = [{"bbox": [100, 100, 160, 220], "confidence": 0.90, "label": "person", "category": "person"}]
        tracks10 = ctx1.tracker.update(det10)
        self.assertEqual(len(tracks10), 1)

        # Track 2 persons on CAM-20
        det20 = [
            {"bbox": [100, 100, 160, 220], "confidence": 0.90, "label": "person", "category": "person"},
            {"bbox": [300, 300, 360, 420], "confidence": 0.90, "label": "person", "category": "person"},
        ]
        tracks20 = ctx2.tracker.update(det20)
        self.assertEqual(len(tracks20), 2)

        # Ensure contexts do not collide or share track counts
        self.assertEqual(len(ctx1.tracker.tracks), 1)
        self.assertEqual(len(ctx2.tracker.tracks), 2)
        self.assertIsNot(ctx1.tracker, ctx2.tracker)
        self.assertIsNot(ctx1.loitering_detector, ctx2.loitering_detector)

    def test_camera_context_reset_independence(self):
        engine = AIEngineService()
        ctx1 = engine.get_context("CAM-30")
        ctx2 = engine.get_context("CAM-40")

        # Add tracks to both
        ctx1.tracker.update([{"bbox": [100, 100, 160, 220], "confidence": 0.90, "label": "person", "category": "person"}])
        ctx2.tracker.update([{"bbox": [200, 200, 260, 320], "confidence": 0.90, "label": "person", "category": "person"}])
        self.assertGreaterEqual(len(ctx1.tracker.tracks), 1)
        self.assertGreaterEqual(len(ctx2.tracker.tracks), 1)

        # Reset CAM-30 only
        engine.reset_camera_context("CAM-30")

        # CAM-30 must be cleared (0 tracks)
        self.assertEqual(len(ctx1.tracker.tracks), 0)
        # CAM-40 must retain its track undisturbed
        self.assertGreaterEqual(len(ctx2.tracker.tracks), 1)


if __name__ == "__main__":
    unittest.main()

