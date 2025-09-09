# import librosa
# import numpy as np
# import tensorflow as tf
# import logging
# import warnings
# import sys
# from pathlib import Path
# import pygame                   # for playing input sound
# import pyttsx3                  # for voice alerts

# warnings.filterwarnings('ignore')

# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

# MODEL_PATH = Path("models/siren_cnn_model_finalnew.keras")  # relative to detection/
# SAMPLE_RATE = 22050
# DURATION = 3.0  # 3 seconds

# # Initialize text-to-speech engine
# engine = pyttsx3.init()
# engine.setProperty("rate", 160)   # speech speed
# engine.setProperty("volume", 1.0) # volume (0.0 to 1.0)

# def speak(message: str):
#     """Speak the given message aloud"""
#     engine.say(message)
#     engine.runAndWait()

# def play_audio(audio_file: str):
#     """Play audio file using pygame (supports wav & mp3)"""
#     try:
#         pygame.mixer.init()
#         pygame.mixer.music.load(audio_file)
#         pygame.mixer.music.play()
#         while pygame.mixer.music.get_busy():
#             pygame.time.Clock().tick(10)
#     except Exception as e:
#         logger.error(f"Could not play audio {audio_file}: {e}")

# def extract_audio_features(audio_file_path):
#     """Extract mel spectrogram features from audio file for inference"""
#     try:
#         audio_data, sr = librosa.load(audio_file_path, sr=SAMPLE_RATE, duration=DURATION)
#         target_length = int(SAMPLE_RATE * DURATION)

#         if len(audio_data) < target_length:
#             audio_data = np.pad(audio_data, (0, target_length - len(audio_data)))
#         else:
#             audio_data = audio_data[:target_length]

#         mel_spec = librosa.feature.melspectrogram(
#             y=audio_data,
#             sr=sr,
#             n_mels=128,   # ✅ must match training
#             fmax=8000
#         )
#         log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
#         log_mel_spec = (log_mel_spec - log_mel_spec.mean()) / (log_mel_spec.std() + 1e-6)

#         # Ensure shape (128, 128)
#         if log_mel_spec.shape[1] < 128:
#             pad_width = 128 - log_mel_spec.shape[1]
#             log_mel_spec = np.pad(log_mel_spec, ((0, 0), (0, pad_width)), mode='constant')
#         else:
#             log_mel_spec = log_mel_spec[:, :128]

#         return log_mel_spec.reshape(1, 128, 128, 1)  # ✅ match training input shape
#     except Exception as e:
#         logger.error(f"Error extracting features from {audio_file_path}: {e}")
#         return None

# def predict_siren(audio_file):
#     """Predict if siren is present in the audio and play alerts"""
#     if not MODEL_PATH.exists():
#         logger.error("Trained model not found. Please train the model first.")
#         return

#     print(f"🔊 Playing {audio_file} ...")
#     play_audio(audio_file)

#     # Load trained model
#     model = tf.keras.models.load_model(MODEL_PATH, compile=False)

#     features = extract_audio_features(audio_file)
#     if features is None:
#         return

#     prediction = model.predict(features)
#     prob = prediction[0][0]

#     if prob > 0.1:
#         alert_msg = "🚨 ALERT: Siren sound detected in audio! 🚑"
#         print(alert_msg)
#         speak("Alert! Siren detected. Please give way.")
#     else:
#         normal_msg = "✅ No siren detected in audio."
#         print(normal_msg)
#         speak("No siren detected.")

# if __name__ == "__main__":
#     if len(sys.argv) < 2:
#         print("Usage: python alert_system.py <audio_file.wav>")
#     else:
#         audio_file = sys.argv[1]
#         predict_siren(audio_file)
def send_alert(message):
    print(message)  # later replace with SMS, email, or app notification
