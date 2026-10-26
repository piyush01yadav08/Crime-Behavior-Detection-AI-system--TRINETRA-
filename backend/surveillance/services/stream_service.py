import time
import math
import logging
import threading
from typing import Generator, Optional, Tuple, Any, Dict
from django.conf import settings
from .ai_engine_service import ai_engine_service

logger = logging.getLogger(__name__)


class ThreadedFrameGrabber:
    """
    Dedicated background frame capture thread.
    Continuously drains VideoCapture driver buffer so that the consumer
    always reads the freshest sensor frame with zero cumulative backlog.
    Includes multi-metric frame usability evaluation and bounded reconnection.
    """
    def __init__(
        self,
        src=0,
        width: int = 640,
        height: int = 360,
        min_dynamic_range: float = 22.0,
        min_std: float = 3.0,
        min_mean: float = 15.0,
        reconnect_cooldown: float = 4.0,
    ):
        self.src = src
        self.width = width
        self.height = height
        self.cap = None
        self._lock = threading.Lock()
        self._latest_frame: Optional[Any] = None
        self._frame_timestamp: float = 0.0
        self._running = False
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

        # Camera status state machine: "connected" | "unusable" | "disconnected" | "reconnecting"
        self.status: str = "disconnected"
        self.status_reason: str = "Initialized"
        self.is_connected: bool = False
        self.is_usable: bool = False

        # Configurable health thresholds
        self.min_dynamic_range = min_dynamic_range
        self.min_std = min_std
        self.min_mean = min_mean
        self.reconnect_cooldown = reconnect_cooldown
        self._last_reconnect_attempt = 0.0

        # Unusable frame tracking
        self._consecutive_unusable_count = 0
        self._max_consecutive_unusable = 10
        self._last_logged_status: Optional[Tuple[str, str]] = None

    def _update_status(self, new_status: str, reason: str):
        with self._lock:
            self.status = new_status
            self.status_reason = reason
            status_pair = (new_status, reason)
            if self._last_logged_status != status_pair:
                self._last_logged_status = status_pair
                if new_status == "connected":
                    logger.info(f"ThreadedFrameGrabber: {reason}")
                elif new_status == "unusable":
                    logger.warning(f"ThreadedFrameGrabber: {reason}")
                elif new_status == "disconnected":
                    logger.error(f"ThreadedFrameGrabber: {reason}")

    def _evaluate_frame(self, frame) -> Tuple[bool, str, Dict[str, float]]:
        """
        Evaluates frame image statistics (intensity, dynamic range, and standard deviation)
        across multiple dimensions to distinguish:
        1. Healthy usable footage (including legitimate low-light scenes with contrast).
        2. Unusable frames (None, zero size, or flat sensor noise / obstructed camera).
        """
        if frame is None or getattr(frame, "size", 0) == 0:
            return False, "Empty or None frame returned", {"mean": 0.0, "std": 0.0, "range": 0.0}

        import numpy as np

        try:
            p_min = float(np.min(frame))
            p_max = float(np.max(frame))
            mean = float(np.mean(frame))
            std = float(np.std(frame))
            dyn_range = p_max - p_min
            stats = {
                "mean": round(mean, 2),
                "std": round(std, 2),
                "min": round(p_min, 2),
                "max": round(p_max, 2),
                "range": round(dyn_range, 2),
            }
        except Exception as e:
            return False, f"Statistical calculation error: {e}", {"mean": 0.0, "std": 0.0, "range": 0.0}

        # 1. Total signal absence
        if mean < 0.5 and dyn_range < 2.0:
            return False, "Signal absent (completely black frame)", stats

        # 2. Legitimate dark scenes:
        # If dynamic range is healthy (>= 25.0) or standard deviation indicates texture/features (>= 4.0),
        # the scene has lighting variation or objects even if the overall mean is low. Do not reject.
        if dyn_range >= 25.0 or std >= 4.0:
            return True, "Legitimate low-light or normal scene with spatial variation", stats

        # 3. Suspicious uniform dark frame / sensor thermal noise:
        # When ALL THREE conditions persist:
        # - Dynamic range is compressed (<= min_dynamic_range)
        # - Standard deviation is low (< min_std)
        # - Mean intensity is near noise floor (< min_mean)
        if dyn_range <= self.min_dynamic_range and std < self.min_std and mean < self.min_mean:
            return False, (
                f"Suspicious uniform dark frame (mean={mean:.1f}, std={std:.2f}, range={dyn_range:.1f}); "
                "possible covered sensor or closed shutter"
            ), stats

        return True, "Healthy frame", stats

    def start(self):
        with self._lock:
            if not self._running:
                self._running = True
                self._stop_event.clear()
                self._thread = threading.Thread(target=self._grab_loop, daemon=True)
                self._thread.start()

    def stop(self):
        self._running = False
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        with self._lock:
            if self.cap is not None:
                try:
                    self.cap.release()
                except Exception:
                    pass
                self.cap = None
            self.is_connected = False
            self.is_usable = False
            self.status = "disconnected"
            self.status_reason = "Grabber stopped"

    def _open_camera(self) -> bool:
        import os
        import cv2

        now = time.time()
        if now - self._last_reconnect_attempt < self.reconnect_cooldown:
            return False
        self._last_reconnect_attempt = now
        self.status = "reconnecting"

        try:
            if os.name == "nt" and isinstance(self.src, int):
                cap = cv2.VideoCapture(self.src, cv2.CAP_DSHOW)
            else:
                cap = cv2.VideoCapture(self.src)

            if not cap.isOpened():
                self._update_status("disconnected", f"Could not open camera device source {self.src}")
                return False

            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)

            # Warmup frames to let hardware AGC settle
            usable_count = 0
            last_reason = "No frames read"
            warmup_frames = 5
            for _ in range(warmup_frames):
                ret, test_frame = cap.read()
                if not ret or test_frame is None:
                    continue
                is_usable, reason, _ = self._evaluate_frame(test_frame)
                if is_usable:
                    usable_count += 1
                else:
                    last_reason = reason

            if usable_count == 0:
                self._update_status("unusable", f"Camera source {self.src} opened but frames are unusable: {last_reason}")
                try:
                    cap.release()
                except Exception:
                    pass
                self.cap = None
                self.is_connected = False
                self.is_usable = False
                return False

            self.cap = cap
            self.is_connected = True
            self.is_usable = True
            self._consecutive_unusable_count = 0
            self._update_status("connected", f"Camera source {self.src} connected successfully")
            return True

        except Exception as e:
            self._update_status("disconnected", f"Camera open exception on source {self.src}: {e}")

        self.cap = None
        self.is_connected = False
        self.is_usable = False
        return False

    def _grab_loop(self):
        import cv2

        while self._running:
            if self.cap is None or not self.cap.isOpened():
                if not self._open_camera():
                    self._stop_event.wait(self.reconnect_cooldown)
                    continue

            ret, raw = self.cap.read()
            if not ret or raw is None:
                self._consecutive_unusable_count += 1
                if self._consecutive_unusable_count >= self._max_consecutive_unusable:
                    self._update_status("disconnected", "Frame read failed; releasing device for reconnect")
                    if self.cap:
                        try:
                            self.cap.release()
                        except Exception:
                            pass
                        self.cap = None
                    self.is_connected = False
                    self.is_usable = False
                    self._stop_event.wait(1.0)
                else:
                    self._stop_event.wait(0.02)
                continue

            is_usable, reason, _ = self._evaluate_frame(raw)
            if not is_usable:
                self._consecutive_unusable_count += 1
                if self._consecutive_unusable_count >= self._max_consecutive_unusable:
                    self._update_status("unusable", f"Persistently unusable frames: {reason}")
                    if self.cap:
                        try:
                            self.cap.release()
                        except Exception:
                            pass
                        self.cap = None
                    self.is_connected = False
                    self.is_usable = False
                    self._stop_event.wait(self.reconnect_cooldown)
                    continue
                else:
                    self._stop_event.wait(0.02)
                    continue

            self._consecutive_unusable_count = 0
            if not self.is_usable:
                self.is_usable = True
                self._update_status("connected", f"Camera source {self.src} streaming healthy frames")

            resized = cv2.resize(raw, (self.width, self.height))
            capture_ts = time.time()

            with self._lock:
                self._latest_frame = resized
                self._frame_timestamp = capture_ts

            self._stop_event.wait(0.005)

    def get_latest_frame(self) -> Tuple[Optional[Any], float]:
        """Returns safe copy of latest frame and its capture timestamp."""
        with self._lock:
            if not self.is_usable or self._latest_frame is None:
                return None, 0.0
            return self._latest_frame.copy(), self._frame_timestamp


class StreamService:
    def __init__(self):
        self.mode = "webcam"  # "webcam" or "simulated"
        self.grabber: Optional[ThreadedFrameGrabber] = None
        self.sim_tick = 0
        self.sim_start_time = time.time()

        self._lock = threading.Lock()
        self._mode_lock = threading.Lock()
        self._latest_jpeg: Optional[bytes] = None
        self._latest_latency_ms: float = 0.0
        self._new_frame_event = threading.Condition(threading.Lock())
        self._running = True
        self._frame_seq: int = 0
        self._active_source: str = "initializing"

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
                self._active_source = "physical_camera"

            if self._worker_thread is None or not self._worker_thread.is_alive():
                self._running = True
                self._worker_thread = threading.Thread(target=self._capture_and_process_loop, daemon=True)
                self._worker_thread.start()

    def get_camera_status(self) -> Dict[str, Any]:
        with self._lock:
            if self.mode == "simulated":
                return {
                    "mode": "simulated",
                    "status": "disabled",
                    "reason": "Simulated CCTV mode active (hardware camera standby)",
                    "is_connected": False,
                    "is_usable": False,
                    "active_source": "simulated",
                }
            if self.grabber is None:
                return {
                    "mode": "webcam",
                    "status": "disconnected",
                    "reason": "Camera grabber uninitialized",
                    "is_connected": False,
                    "is_usable": False,
                    "active_source": "fallback_simulation",
                }
            return {
                "mode": "webcam",
                "status": self.grabber.status,
                "reason": self.grabber.status_reason,
                "is_connected": self.grabber.is_connected,
                "is_usable": self.grabber.is_usable,
                "active_source": "physical_camera" if self.grabber.is_usable else "fallback_simulation",
            }

    def get_active_source(self) -> str:
        with self._lock:
            return self._active_source

    def set_mode(self, mode: str) -> Tuple[bool, str]:
        with self._mode_lock:
            if mode not in ["webcam", "simulated"]:
                return False, f"Invalid mode '{mode}'. Supported modes are: ['webcam', 'simulated']"

            if mode == self.mode:
                return True, f"Mode is already '{mode}'"

            prev_mode = self.mode
            self.mode = mode
            logger.info(f"StreamService mode transition requested: {prev_mode} -> {mode}")

            with self._lock:
                if mode == "simulated":
                    if self.grabber is not None:
                        logger.info("Stopping physical camera grabber for simulated mode")
                        self.grabber.stop()
                        self.grabber = None
                    self._active_source = "simulated"
                elif mode == "webcam":
                    if self.grabber is None:
                        src_val = getattr(settings, "CAMERA_SOURCE", "0")
                        src = int(src_val) if str(src_val).isdigit() else src_val
                        w = getattr(settings, "FRAME_WIDTH", 640)
                        h = getattr(settings, "FRAME_HEIGHT", 360)
                        logger.info(f"Starting physical camera grabber on source {src}")
                        self.grabber = ThreadedFrameGrabber(src=src, width=w, height=h)
                        self.grabber.start()
                    self._active_source = "physical_camera"

            return True, f"Mode successfully switched to '{mode}'"

    def _generate_synthetic_frame(self, is_fallback: bool = False, fallback_reason: str = ""):
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

        if is_fallback:
            # Explicit Fallback Header — Never masquerade as genuine camera footage
            cv2.rectangle(frame, (0, 0), (w, 36), (15, 20, 80), -1)
            cv2.line(frame, (0, 36), (w, 36), (0, 100, 255), 2)
            cv2.putText(frame, "[FALLBACK] REAL CAMERA UNAVAILABLE / UNUSABLE", (15, 16),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 220, 255), 1, cv2.LINE_AA)
            reason_txt = fallback_reason[:75] if fallback_reason else "Physical camera offline or covered"
            cv2.putText(frame, f"REASON: {reason_txt}", (15, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.33, (180, 190, 230), 1, cv2.LINE_AA)
        else:
            # Explicit Simulated Mode Header
            cv2.rectangle(frame, (0, 0), (w, 28), (20, 35, 15), -1)
            cv2.line(frame, (0, 28), (w, 28), (40, 200, 60), 1)
            cv2.putText(frame, f"CAM-02 [SIMULATED CCTV MODE] {ts_str}", (15, 18),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (60, 230, 90), 1, cv2.LINE_AA)

        return frame

    def _capture_and_process_loop(self):
        import cv2

        fps = getattr(settings, "STREAM_FPS", 25)
        target_interval = 1.0 / max(10, fps)

        while self._running:
            loop_start = time.time()
            frame = None
            capture_ts = loop_start
            is_fallback = False
            fallback_reason = ""

            with self._lock:
                current_mode = self.mode
                grabber_ref = self.grabber

            if current_mode == "webcam" and grabber_ref is not None:
                grabbed_frame, grabbed_ts = grabber_ref.get_latest_frame()
                if grabbed_frame is not None:
                    frame = grabbed_frame
                    capture_ts = grabbed_ts
                    self._active_source = "physical_camera"
                else:
                    is_fallback = True
                    fallback_reason = grabber_ref.status_reason or "Camera disconnected or unusable"
                    frame = self._generate_synthetic_frame(is_fallback=True, fallback_reason=fallback_reason)
                    self._active_source = "fallback_simulation"
            else:
                frame = self._generate_synthetic_frame(is_fallback=False)
                self._active_source = "simulated"

            if frame is None:
                time.sleep(0.04)
                continue

            try:
                annotated, telemetry = ai_engine_service.process_frame(frame, camera_id="CAM-02")
                self._latest_latency_ms = round((time.time() - capture_ts) * 1000, 1)

                # Attach source metadata to latest telemetry
                telemetry["stream_mode"] = current_mode
                telemetry["active_source"] = self._active_source

                ret, buffer = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 72])
                if ret:
                    jpeg_bytes = buffer.tobytes()
                    with self._new_frame_event:
                        self._latest_jpeg = jpeg_bytes
                        self._frame_seq += 1
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
        with self._new_frame_event:
            return self._latest_jpeg

    def generate_frames(self, camera_id: str = "CAM-02") -> Generator[bytes, None, None]:
        """Synchronous frame generator for WSGI, unit tests, and snapshot callers."""
        self._ensure_worker()
        last_seq = -1

        try:
            while self._running:
                frame_data = None
                with self._new_frame_event:
                    if self._latest_jpeg is None or self._frame_seq == last_seq:
                        self._new_frame_event.wait(timeout=0.2)
                    if not self._running:
                        break
                    if self._latest_jpeg is not None and self._frame_seq != last_seq:
                        frame_data = self._latest_jpeg
                        last_seq = self._frame_seq

                if frame_data is not None:
                    header = (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n"
                        + f"Content-Length: {len(frame_data)}\r\n\r\n".encode("ascii")
                    )
                    yield header + frame_data + b"\r\n"
                else:
                    time.sleep(0.01)

        except (GeneratorExit, StopIteration):
            pass
        except Exception as e:
            logger.debug(f"Stream client disconnected: {e}")

    async def generate_frames_async(self, camera_id: str = "CAM-02"):
        """
        Asynchronous frame generator for ASGI (Daphne / Django Channels).
        Directly yields fresh MJPEG chunks without blocking the Twisted event loop
        or triggering Django's fatal sync_to_async(list) buffering trap.
        """
        import asyncio
        self._ensure_worker()
        last_seq = -1

        try:
            while self._running:
                frame_data = None
                with self._new_frame_event:
                    if self._latest_jpeg is not None and self._frame_seq != last_seq:
                        frame_data = self._latest_jpeg
                        last_seq = self._frame_seq

                if frame_data is not None:
                    header = (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n"
                        + f"Content-Length: {len(frame_data)}\r\n\r\n".encode("ascii")
                    )
                    yield header + frame_data + b"\r\n"
                    await asyncio.sleep(0.02)
                else:
                    await asyncio.sleep(0.03)

        except (GeneratorExit, StopIteration, asyncio.CancelledError):
            pass
        except Exception as e:
            logger.debug(f"Async stream client disconnected: {e}")

    def stop(self):
        with self._new_frame_event:
            self._running = False
            self._new_frame_event.notify_all()
        if self._worker_thread and self._worker_thread.is_alive():
            self._worker_thread.join(timeout=2.0)
        with self._lock:
            if self.grabber is not None:
                self.grabber.stop()
                self.grabber = None


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
