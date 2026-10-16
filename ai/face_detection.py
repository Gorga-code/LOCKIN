"""Standalone YOLO face-detection prototype; not connected to the web app."""

import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True, type=Path,
                        help="Local Ultralytics-compatible face detection .pt weights")
    parser.add_argument("--camera", type=int, default=0)
    parser.add_argument("--confidence", type=float, default=0.5)
    args = parser.parse_args()
    if not args.model.is_file():
        parser.error("Model file not found. Supply face-trained weights with --model.")
    if not 0 < args.confidence <= 1:
        parser.error("Confidence must be greater than 0 and at most 1.")

    import cv2
    from ultralytics import YOLO

    model = YOLO(str(args.model))
    if model.task != "detect":
        parser.error("Use an object-detection model trained to detect faces.")
    face_ids = [index for index, name in model.names.items()
                if name.lower().strip() in {"face", "faces"}]
    if not face_ids:
        parser.error("Model has no 'face' class. Generic person detection is not face detection.")

    camera = cv2.VideoCapture(args.camera)
    try:
        if not camera.isOpened():
            raise RuntimeError("Cannot open webcam. Check camera permissions or use --camera 1.")
        print("Camera started. Press Q in the preview window to quit.")
        while True:
            ok, frame = camera.read()
            if not ok:
                raise RuntimeError("Could not read a webcam frame.")
            result = model.predict(frame, conf=args.confidence, classes=face_ids,
                                   device="cpu", verbose=False, save=False)[0]
            face_count = len(result.boxes) if result.boxes is not None else 0
            preview = result.plot()
            label = f"Faces: {face_count}" if face_count else "No face detected"
            cv2.putText(preview, label, (20, 35), cv2.FONT_HERSHEY_SIMPLEX,
                        0.8, (0, 255, 0) if face_count else (0, 0, 255), 2)
            cv2.imshow("LOCKIN - Face detection prototype", preview)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
            if cv2.getWindowProperty("LOCKIN - Face detection prototype",
                                     cv2.WND_PROP_VISIBLE) < 1:
                break
    finally:
        camera.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
