import cv2
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

# Load YOLO
model = YOLO("yolov8s.pt")

# Initialize DeepSORT
tracker = DeepSort(
    max_age=50,
    n_init=3,
    max_cosine_distance=0.4
)

# Webcam
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()

    if not ret:
        break

    # YOLO Detection
    results = model(frame)

    detections = []

    for result in results:

        for box in result.boxes:

            cls = int(box.cls[0])

            label = model.names[cls]

            if label == "person":

                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )

                confidence = float(box.conf[0])
                if confidence < 0.5:
                    continue

                width = x2 - x1
                height = y2 - y1

                detections.append(
                    (
                        [x1, y1, width, height],
                        confidence,
                        label
                    )
                )

    # Tracking
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

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"Person #{track_id}",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )

    cv2.imshow(
        "Trinetra AI - Person Tracking",
        frame
    )

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q") or key == 27:
        break

cap.release()
cv2.destroyAllWindows()