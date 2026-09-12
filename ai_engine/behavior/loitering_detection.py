import cv2
import math
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
import time

LOITERING_DISTANCE = 50
LOITERING_TIME = 10

person_data = {}

# Load YOLO model
model = YOLO("yolov8s.pt")

# Initialize tracker
tracker = DeepSort(
    max_age=60,
    n_init=3,
    max_cosine_distance=0.3,
    max_iou_distance=0.7,
    nn_budget=100
)

# Store previous positions
previous_positions = {}

cap = cv2.VideoCapture(0)

while True:

    ret, frame = cap.read()

    if not ret:
        break

    results = model(frame)

    detections = []

    for result in results:

        for box in result.boxes:

            cls = int(box.cls[0])

            label = model.names[cls]

            if label == "person":

                confidence = float(box.conf[0])

                if confidence < 0.5:
                    continue

                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )

                width = x2 - x1
                height = y2 - y1

                detections.append(
                    (
                        [x1, y1, width, height],
                        confidence,
                        label
                    )
                )

    tracks = tracker.update_tracks(
        detections,
        frame=frame
    )

    for track in tracks:

        if not track.is_confirmed():
            continue

        track_id = track.track_id

        ltrb = track.to_ltrb()

        x1, y1, x2, y2 = map(
            int,
            ltrb
        )

        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2

        speed = 0

        if track_id in previous_positions:

            prev_x, prev_y = previous_positions[track_id]

            distance = math.sqrt(
                (center_x - prev_x) ** 2 +
                (center_y - prev_y) ** 2
            )

            speed = round(distance, 2)

        previous_positions[track_id] = (
            center_x,
            center_y
        )
        current_time = time.time()

        if track_id not in person_data:

            person_data[track_id] = {
                "start_x": center_x,
                "start_y": center_y,
                "start_time": current_time
            }

        else:

            start_x = person_data[track_id]["start_x"]
            start_y = person_data[track_id]["start_y"]

            distance = math.sqrt(
                (center_x - start_x) ** 2 +
                (center_y - start_y) ** 2
            )

            elapsed = current_time - person_data[track_id]["start_time"]

            if distance < LOITERING_DISTANCE and elapsed > LOITERING_TIME:

                cv2.putText(
                    frame,
                    "LOITERING ALERT",
                    (x1, y2 + 25),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 0, 255),
                    2
                )

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"ID:{track_id} Speed:{speed}",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )

    cv2.imshow(
        "Trinetra AI - Movement Analysis",
        frame
    )

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q") or key == 27:
        break

cap.release()
cv2.destroyAllWindows()