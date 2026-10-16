import time
import math
import logging
import threading
from typing import Generator, Optional, Tuple, Any
from django.conf import settings
from .ai_engine_service import ai_engine_service

logger = logging.getLogger(__name__)

class ThreadedFrameGrabber:
    """
    Dedicated background frame capture thread.
    Continuously drains VideoCapture driver buffer so that the consumer
    always reads the freshest sensor frame with zero cumulative backlog.
    """
    def __init__(self, src=0, width=640, height=360):
        self.src = src
        self.width = width
        self.height = height
        self.cap = None
        self._lock = threading.Lock()
        self._latest_frame: Optional[Any] = None
        self._frame_timestamp: float = 0.0
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self.is_connected = False
        self.reconnect_cooldown = 3.0
        self._last_reconnect_attempt = 0.0

    def start(self):
        with self._lock:
            if not self._running:
                self._running = True
                self._thread = threading.Thread(target=self._grab_loop, daemon=True)
                self._thread.start()

    def stop(self):
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        with self._lock:
            if self.cap is not None:
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None
            self.is_connected = False

    def _open_camera(self) -> bool:
        import os
        import cv2
        import numpy as np

        now = time.time()
        if now - self._last_reconnect_attempt < self.reconnect_cooldown:
            return False
        self._last_reconnect_attempt = now

        try:
            if os.name == "nt" and isinstance(self.src, int):
                cap = cv2.VideoCapture(self.src, cv2.CAP_DSHOW)
            else:
                cap = cv2.VideoCapture(self.src)

            if cap.isOpened():
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
                ret, test_frame = cap.read()
                if ret and test_frame is not None and float(np.mean(test_frame)) >= 1.0:
                    self.cap = cap
                    self.is_connected = True
                    logger.info(f"ThreadedFrameGrabber connected successfully to camera source {self.src}")
                    return True
                cap.release()
        except Exception as e:
            logger.warning(f"ThreadedFrameGrabber open failed for source {self.src}: {e}")

        self.cap = None
        self.is_connected = False
        return False

    def _grab_loop(self):
        import cv2
        while self._running:
            if self.cap is None or not self.cap.isOpened():
                if not self._open_camera():
                    time.sleep(1.0)
                    continue

            ret, raw = self.cap.read()
            if not ret or raw is None:
                logger.warning("Frame read returned False, scheduling reconnect...")
                if self.cap:
                    try:
                        self.cap.release()
                    except Exception:
                        pass
                    self.cap = None
                self.is_connected = False
                time.sleep(0.5)
                continue

            resized = cv2.resize(raw, (self.width, self.height))
            capture_ts = time.time()

            with self._lock:
                self._latest_frame = resized
                self._frame_timestamp = capture_ts

            time.sleep(0.005)

    def get_latest_frame(self) -> Tuple[Optional[Any], float]:
        """Returns safe copy of latest frame and its capture timestamp."""
        with self._lock:
            if self._latest_frame is None:
                return None, 0.0
            return self._latest_frame.copy(), self._frame_timestamp


class StreamService:
    def __init__(self):
        self.mode = "webcam"  # "webcam" or "simulated"
        self.grabber: Optional[ThreadedFrameGrabber] = None
        self.sim_tick = 0
        self.sim_start_time = time.time()

        self._lock = threading.Lock()
        self._latest_jpeg: Optional[bytes] = None
        self._latest_latency_ms: float = 0.0
        self._new_frame_event = threading.Condition(self._lock)
        self._running = True

        self._worker_thread = None

    def _ensure_worker(self):
        with self._lock:
            if self.mode == "webcam" and self.grabber is None:
                src_val = getattr(settings, "CAMERA_SOURCE", "0")
                src = int(src_val) if str(src_val).isdigit() else src_val
                w = getattr(settings, "FRAME_WIDTH", 640)
                h = getattr(settings, "FRAME_HEIGHT", 360)
                self.grabber = ThreadedFrameGrabber(src=src, width=w, height=h)
                self.grabber.start()

            if self._worker_thread is None or not self._worker_thread.is_alive():
                self._running = True
                self._worker_thread = threading.Thread(target=self._capture_and_process_loop, daemon=True)
                self._worker_thread.start()

    def set_mode(self, mode: str):
        with self._lock:
            if mode in ["webcam", "simulated"]:
                self.mode = mode
                if mode == "simulated" and self.grabber is not None:
                    self.grabber.stop()
                    self.grabber = None
                elif mode == "webcam" and self.grabber is None:
                    src_val = getattr(settings, "CAMERA_SOURCE", "0")
                    src = int(src_val) if str(src_val).isdigit() else src_val
                    w = getattr(settings, "FRAME_WIDTH", 640)
                    h = getattr(settings, "FRAME_HEIGHT", 360)
                    self.grabber = ThreadedFrameGrabber(src=src, width=w, height=h)
                    self.grabber.start()
                logger.info(f"Stream mode set to: {self.mode}")

    def _generate_synthetic_frame(self):
        import numpy as np
        try:
            import cv2
        except ImportError:
            return None

        w = getattr(settings, "FRAME_WIDTH", 640)
        h = getattr(settings, "FRAME_HEIGHT", 360)
        frame = np.zeros((h, w, 3), dtype=np.uint8)

        # Draw CCTV floor & road
        cv2.rectangle(frame, (0, 0), (w, int(h * 0.45)), (25, 20, 15), -1)
        cv2.rectangle(frame, (0, int(h * 0.45)), (w, h), (38, 32, 28), -1)

        # Sidewalk & lanes
        cv2.line(frame, (0, int(h * 0.7)), (w, int(h * 0.7)), (65, 55, 45), 2)
        cv2.line(frame, (0, int(h * 0.45)), (w, int(h * 0.45)), (80, 70, 60), 2)

        self.sim_tick += 1

        # Walking pedestrian TRK-101
        walk_x = int((50 + (self.sim_tick * 4)) % (w - 80))
        walk_y = int(h * 0.6)
        cv2.rectangle(frame, (walk_x, walk_y - 70), (walk_x + 36, walk_y), (85, 120, 180), -1)
        cv2.circle(frame, (walk_x + 18, walk_y - 82), 12, (180, 190, 210), -1)

        # Loitering subject TRK-104
        loiter_x = int(w * 0.65)
        loiter_y = int(h * 0.62)
        jitter_x = int(math.sin(self.sim_tick * 0.2) * 6)
        cv2.rectangle(frame, (loiter_x + jitter_x, loiter_y - 75), (loiter_x + jitter_x + 38, loiter_y), (140, 80, 80), -1)
        cv2.circle(frame, (loiter_x + jitter_x + 19, loiter_y - 87), 13, (210, 180, 180), -1)

        # Restricted Zone boundary
        cv2.rectangle(frame, (int(w * 0.55), int(h * 0.42)), (w - 20, int(h * 0.8)), (0, 50, 180), 1)
        cv2.putText(frame, "MONITORED ZONE B", (int(w * 0.56), int(h * 0.46)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 120, 255), 1)

        ts_str = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, f"CAM-02 [LIVE] {ts_str}", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 220, 255), 1)

        return frame

    def _capture_and_process_loop(self):
        import cv2

        fps = getattr(settings, "STREAM_FPS", 25)
        target_interval = 1.0 / max(10, fps)

        while self._running:
            loop_start = time.time()
            frame = None
            capture_ts = loop_start

            if self.mode == "webcam" and self.grabber is not None:
                grabbed_frame, grabbed_ts = self.grabber.get_latest_frame()
                if grabbed_frame is not None:
                    frame = grabbed_frame
                    capture_ts = grabbed_ts
                else:
                    frame = self._generate_synthetic_frame()
            else:
                frame = self._generate_synthetic_frame()

            if frame is None:
                time.sleep(0.04)
                continue

            try:
                annotated, telemetry = ai_engine_service.process_frame(frame, camera_id="CAM-02")
                self._latest_latency_ms = round((time.time() - capture_ts) * 1000, 1)

                ret, buffer = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 72])
                if ret:
                    jpeg_bytes = buffer.tobytes()
                    with self._new_frame_event:
                        self._latest_jpeg = jpeg_bytes
                        self._new_frame_event.notify_all()
                del buffer
                del annotated
            except Exception as e:
                logger.error(f"Error in stream processing loop: {e}")
            finally:
                del frame

            elapsed = time.time() - loop_start
            sleep_time = max(0.005, target_interval - elapsed)
            time.sleep(sleep_time)

    def get_latest_snapshot(self) -> Optional[bytes]:
        self._ensure_worker()
        with self._lock:
            return self._latest_jpeg

    def generate_frames(self, camera_id: str = "CAM-02") -> Generator[bytes, None, None]:
        self._ensure_worker()
        fps = getattr(settings, "STREAM_FPS", 25)
        try:
            while self._running:
                with self._new_frame_event:
                    if self._latest_jpeg is None:
                        self._new_frame_event.wait(timeout=0.5)
                    frame_data = self._latest_jpeg

                if frame_data is not None:
                    yield (b"--frame\r\n"
                           b"Content-Type: image/jpeg\r\n\r\n" + frame_data + b"\r\n")

                time.sleep(1.0 / max(10, fps))
        except (GeneratorExit, StopIteration):
            pass
        except Exception as e:
            logger.debug(f"Stream client disconnected: {e}")

class _LazyStreamService:
    def __init__(self):
        self._instance = None
        self._lock = threading.Lock()

    def _get(self):
        if self._instance is None:
            with self._lock:
                if self._instance is None:
                    self._instance = StreamService()
        return self._instance

    def __getattr__(self, name):
        return getattr(self._get(), name)

stream_service = _LazyStreamService()
