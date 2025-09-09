import cv2
from ultralytics import YOLO

# Load trained YOLO model with verbose disabled
model = YOLO(r"C:\Users\LENOVO\Downloads\Ambulance_detection_project-main\Ambulance_detection_project-main\detection\best.pt")

def detect_ambulance(video_path=0):
    cap = cv2.VideoCapture(video_path)  # 0 = webcam, or provide video file path

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # disable verbose logs by setting verbose=False
        results = model(frame, stream=True, verbose=False)
        ambulance_detected = False

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                if cls_id == 0:  # "ambulance" class
                    ambulance_detected = True
                    # Draw bounding box
                    cv2.rectangle(
                        frame,
                        (int(box.xyxy[0][0]), int(box.xyxy[0][1])),
                        (int(box.xyxy[0][2]), int(box.xyxy[0][3])),
                        (0, 255, 0), 2
                    )
                    cv2.putText(frame, "Ambulance", 
                                (int(box.xyxy[0][0]), int(box.xyxy[0][1]) - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        # Alert message only when ambulance is detected
        if ambulance_detected:
            print("🚨 Ambulance detected! Sending alert...")

        cv2.imshow("Ambulance Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    detect_ambulance(0)  # default webcam
