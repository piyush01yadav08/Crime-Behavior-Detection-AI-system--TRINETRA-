import os
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

VEHICLE_LABELS = {"car", "motorcycle", "bus", "truck", "bicycle"}
PERSON_LABELS = {"person"}

class HumanDetector:
    def __init__(self, model_path: str = "yolov8n.pt", conf_thresh: float = 0.40):
        self.model_path = model_path
        self.conf_thresh = conf_thresh
        self.model = None
        self.is_loaded = False
        self._init_model()

    def _init_model(self):
        try:
            # Deterministically resolve model path across working directories
            resolved_path = None
            basename = os.path.basename(self.model_path)
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
            candidates = [
                self.model_path,
                os.path.join(os.getcwd(), self.model_path),
                os.path.join(project_root, basename),
                os.path.join(project_root, self.model_path),
            ]
            for candidate in candidates:
                if candidate and os.path.exists(candidate):
                    resolved_path = os.path.abspath(candidate)
                    break

            if resolved_path is None:
                logger.error(
                    f"YOLO model weights not found on disk (searched: {candidates}). "
                    f"Automatic network download is disabled to avoid side-effects. Running in fallback mode."
                )
                self.model = None
                self.is_loaded = False
                return

            self.model_path = resolved_path
            from ultralytics import YOLO
            import torch

            logger.info(f"Loading YOLO model from local path: {self.model_path}")
            self.model = YOLO(self.model_path)
            self.is_loaded = True
            logger.info("YOLO Human & Vehicle Detector initialized successfully.")
        except Exception as e:
            logger.warning(f"Could not load ultralytics YOLO ({e}). Running in fallback mode.")
            self.model = None
            self.is_loaded = False

    def detect(self, frame) -> List[Dict[str, Any]]:
        """
        Detects humans and vehicles in the provided OpenCV BGR frame.
        Uses torch.no_grad() to eliminate CPU gradient tensor allocations and prevent memory growth.
        """
        detections = []
        if self.is_loaded and self.model is not None:
            try:
                import torch
                with torch.no_grad():
                    results = self.model(frame, verbose=False)
                    for result in results:
                        boxes = result.boxes
                        if boxes is None:
                            continue
                        for box in boxes:
                            cls_idx = int(box.cls[0].item())
                            label = self.model.names.get(cls_idx, "")
                            conf = float(box.conf[0].item())

                            if conf < self.conf_thresh:
                                continue

                            coords = box.xyxy[0].cpu().numpy()
                            x1, y1, x2, y2 = int(coords[0]), int(coords[1]), int(coords[2]), int(coords[3])

                            if label in PERSON_LABELS:
                                detections.append({
                                    "bbox": [x1, y1, x2, y2],
                                    "confidence": round(conf, 3),
                                    "label": "person",
                                    "category": "person"
                                })
                            elif label in VEHICLE_LABELS:
                                detections.append({
                                    "bbox": [x1, y1, x2, y2],
                                    "confidence": round(conf, 3),
                                    "label": label,
                                    "category": "vehicle"
                                })
                    del results
                return detections
            except Exception as e:
                logger.error(f"Error during YOLO inference: {e}")

        return detections
