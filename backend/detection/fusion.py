# import cv2
# import threading
# import numpy as np
# import sounddevice as sd
# import librosa
# import tensorflow as tf
# from ultralytics import YOLO
# from detection.alert_system import send_alert

# # Load trained models
# audio_model = tf.keras.models.load_model("detection/models/best_siren_modelcollab.h5")

# # audio_model = tf.keras.models.load_model("detection/models/siren_cnn_model_finalnew.keras")
# video_model = YOLO("detection/best.pt")
# # Audio detection function
# def detect_siren(duration=3, sr=22050, threshold=0.5):
#     recording = sd.rec(int(duration * sr), samplerate=sr, channels=1, dtype='float32')
#     sd.wait()
#     audio_data = recording.flatten()

#     # Extract features
#     mel_spec = librosa.feature.melspectrogram(y=audio_data, sr=sr, n_mels=128, fmax=8000)
#     log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
#     log_mel_spec = (log_mel_spec - log_mel_spec.mean()) / log_mel_spec.std()
#     log_mel_spec = cv2.resize(log_mel_spec, (128, 128)).reshape(1, 128, 128, 1)

#     prediction = audio_model.predict(log_mel_spec, verbose=0)[0][0]
#     return prediction > threshold  # True if siren detected


# # Video detection function
# def detect_ambulance(video_source=0):
#     cap = cv2.VideoCapture(video_source)
#     while cap.isOpened():
#         ret, frame = cap.read()
#         if not ret:
#             break

#         results = video_model(frame)
#         ambulance_detected = False

#         for r in results:
#             for box in r.boxes:
#                 cls = int(box.cls[0])
#                 if video_model.names[cls] == "ambulance":
#                     ambulance_detected = True
#                     x1, y1, x2, y2 = map(int, box.xyxy[0])
#                     cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
#                     cv2.putText(frame, "Ambulance Detected", (x1, y1 - 10),
#                                 cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

#         cv2.imshow("Ambulance Detection", frame)

#         if ambulance_detected:
#             send_alert("🚨 Ambulance detected in video!")

#         if cv2.waitKey(1) & 0xFF == ord("q"):
#             break

#     cap.release()
#     cv2.destroyAllWindows()


# # Fusion logic
# def run_fusion(video_source=0):
#     def audio_loop():
#         while True:
#             if detect_siren():
#                 send_alert("🚨 Siren detected in audio!")

#     audio_thread = threading.Thread(target=audio_loop, daemon=True)
#     audio_thread.start()

#     detect_ambulance(video_source)


# if __name__ == "__main__":
#     run_fusion(0)  # 0 = webcam, or provide video path
# detection/fusion.py
import asyncio
from typing import Callable

# ... (your existing imports and code)

def run_fusion(video_source=0, alert_callback: Callable = None):
    def audio_loop():
        while True:
            if detect_siren():
                message = "🚨 Siren detected in audio!"
                if alert_callback:
                    alert_callback("audio", message)
                else:
                    print(message)

    def video_loop():
        cap = cv2.VideoCapture(video_source)
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            results = video_model(frame)
            ambulance_detected = False

            for r in results:
                for box in r.boxes:
                    cls = int(box.cls[0])
                    if video_model.names[cls] == "ambulance":
                        ambulance_detected = True
                        # ... (your existing drawing code)
                        
            if ambulance_detected:
                message = "🚨 Ambulance detected in video!"
                if alert_callback:
                    alert_callback("video", message)
                else:
                    print(message)

            # ... (rest of your video code)

    # Start audio and video threads
    # audio_thread = threading.Thread(target=audio_loop, daemon=True)
    # audio_thread.start()
    
    video_thread = threading.Thread(target=video_loop, daemon=True)
    video_thread.start()