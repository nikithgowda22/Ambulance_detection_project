# # Siren Sound Detection using CNN (Improved Google Colab version)

# import os
# import numpy as np
# import librosa
# import tensorflow as tf
# from tensorflow import keras
# from sklearn.model_selection import train_test_split
# from sklearn.metrics import classification_report, confusion_matrix, roc_curve
# import matplotlib.pyplot as plt
# import seaborn as sns
# from pathlib import Path
# import logging
# import warnings
# from collections import Counter

# warnings.filterwarnings('ignore')

# # Configure logging
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

# class SirenCNNTrainer:
#     """Training class for CNN siren detection model"""

#     def __init__(self, data_path=None, output_path=None):
#         base_dir = Path(__file__).resolve().parent
#         if data_path is None:
#             data_path = base_dir / "data"
#         if output_path is None:
#             output_path = base_dir / "models"

#         self.data_path = Path(data_path)
#         self.output_path = Path(output_path)
#         self.output_path.mkdir(parents=True, exist_ok=True)
    
#         # Audio settings
#         self.sample_rate = 22050
#         self.duration = 3.0  # 3 seconds audio clips
    
    
#     # ------------------------
#     # Audio Augmentation
#     # ------------------------
#     def augment_audio(self, audio_data, sr):
#         """Apply random augmentation with 50% probability"""
#         if np.random.rand() < 0.5:
#             choice = np.random.choice(["pitch", "stretch", "noise"])
#             if choice == "pitch":
#                 steps = np.random.randint(-2, 3)  # semitones
#                 return librosa.effects.pitch_shift(y=audio_data, sr=sr, n_steps=steps)
#             elif choice == "stretch":
#                 rate = np.random.uniform(0.8, 1.2)
#                 stretched = librosa.effects.time_stretch(y=audio_data, rate=rate)
#                 return librosa.util.fix_length(stretched, size=len(audio_data))
#             elif choice == "noise":
#                 noise = np.random.normal(0, 0.005, audio_data.shape)
#                 return audio_data + noise
#         return audio_data

#     def spec_augment(self, mel_spec):
#         """Apply simple SpecAugment: random frequency and time masking"""
#         spec = mel_spec.copy()
#         num_mels, num_frames = spec.shape

#         # Frequency mask
#         f = np.random.randint(0, num_mels // 8)
#         f0 = np.random.randint(0, num_mels - f)
#         spec[f0:f0+f, :] = 0

#         # Time mask
#         t = np.random.randint(0, num_frames // 8)
#         t0 = np.random.randint(0, num_frames - t)
#         spec[:, t0:t0+t] = 0

#         return spec

#     def load_audio_data(self):
#         """Load and preprocess audio data"""
#         audio_path = self.data_path / 'audio'
#         siren_path = audio_path / 'siren'
#         no_siren_path = audio_path / 'no_siren'

#         if not (siren_path.exists() and no_siren_path.exists()):
#             logger.error("Dataset not found. Expected 'siren' and 'no_siren' directories inside data/audio/")
#             return None, None

#         features, labels = [], []

#         # Process siren audio files
#         for audio_file in list(siren_path.glob("*.wav")) + list(siren_path.glob("*.mp3")):
#             feature = self.extract_audio_features(str(audio_file), augment=True)
#             if feature is not None:
#                 features.append(feature)
#                 labels.append(1)

#         # Process non-siren audio files
#         for audio_file in list(no_siren_path.glob("*.wav")) + list(no_siren_path.glob("*.mp3")):
#             feature = self.extract_audio_features(str(audio_file), augment=True)
#             if feature is not None:
#                 features.append(feature)
#                 labels.append(0)

#         if not features:
#             logger.error("No audio features extracted. Please check audio files.")
#             return None, None

#         class_counts = Counter(labels)
#         logger.info(f"Loaded {len(features)} samples ({class_counts[1]} siren, {class_counts[0]} no-siren)")
#         return np.array(features), np.array(labels)

#     def extract_audio_features(self, audio_file_path, augment=False):
#         """Extract mel spectrogram features from audio file"""
#         try:
#             audio_data, sr = librosa.load(audio_file_path, sr=self.sample_rate, duration=self.duration)
#             target_length = int(self.sample_rate * self.duration)

#             if len(audio_data) < target_length:
#                 audio_data = np.pad(audio_data, (0, target_length - len(audio_data)))
#             else:
#                 audio_data = audio_data[:target_length]

#             if augment:
#                 audio_data = self.augment_audio(audio_data, sr)

#             mel_spec = librosa.feature.melspectrogram(
#                 y=audio_data,
#                 sr=sr,
#                 n_mels=128,
#                 fmax=8000
#             )
#             log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
#             log_mel_spec = (log_mel_spec - log_mel_spec.mean()) / (log_mel_spec.std() + 1e-6)

#             if augment and np.random.rand() < 0.3:  # 30% chance to apply SpecAugment
#                 log_mel_spec = self.spec_augment(log_mel_spec)

#             # Ensure shape (128, 128)
#             if log_mel_spec.shape[1] < 128:
#                 pad_width = 128 - log_mel_spec.shape[1]
#                 log_mel_spec = np.pad(log_mel_spec, ((0, 0), (0, pad_width)), mode='constant')
#             else:
#                 log_mel_spec = log_mel_spec[:, :128]

#             return log_mel_spec

#         except Exception as e:
#             logger.error(f"Error processing {audio_file_path}: {e}")
#             return None

#     def create_cnn_model(self, input_shape=(128, 128, 1)):
#         """Stronger CNN with BatchNorm & Dropout"""
#         model = keras.Sequential([
#             keras.layers.Conv2D(32, (3, 3), padding="same", activation="relu", input_shape=input_shape),
#             keras.layers.BatchNormalization(),
#             keras.layers.MaxPooling2D((2, 2)),

#             keras.layers.Conv2D(64, (3, 3), padding="same", activation="relu"),
#             keras.layers.BatchNormalization(),
#             keras.layers.MaxPooling2D((2, 2)),

#             keras.layers.Conv2D(128, (3, 3), padding="same", activation="relu"),
#             keras.layers.BatchNormalization(),
#             keras.layers.MaxPooling2D((2, 2)),

#             keras.layers.Conv2D(256, (3, 3), padding="same", activation="relu"),
#             keras.layers.BatchNormalization(),
#             keras.layers.MaxPooling2D((2, 2)),

#             keras.layers.Flatten(),
#             keras.layers.Dense(256, activation="relu"),
#             keras.layers.Dropout(0.5),
#             keras.layers.Dense(1, activation="sigmoid")
#         ])

#         model.compile(
#             optimizer=keras.optimizers.Adam(learning_rate=1e-4),
#             loss="binary_crossentropy",
#             metrics=["accuracy", keras.metrics.Precision(), keras.metrics.Recall()]
#         )
#         return model

#     def train_cnn_model(self, epochs=50, batch_size=32):
#         """Train CNN model for siren detection"""
#         features, labels = self.load_audio_data()
#         if features is None or labels is None:
#             return None

#         features = features.reshape(-1, 128, 128, 1)

#         X_train, X_test, y_train, y_test = train_test_split(
#             features, labels, test_size=0.2, random_state=42, stratify=labels
#         )

#         model = self.create_cnn_model()
#         model.summary()

#         # Compute class weights
#         class_weights = dict(enumerate(len(labels) / (2 * np.bincount(labels))))

#         callbacks = [
#             keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
#             keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5),
#             keras.callbacks.ModelCheckpoint(
#                 str(self.output_path / "best_siren_modelnew.keras"),
#                 save_best_only=True,
#                 monitor="val_loss"
#             )
#         ]

#         history = model.fit(
#             X_train, y_train,
#             epochs=epochs,
#             batch_size=batch_size,
#             validation_split=0.2,
#             class_weight=class_weights,
#             callbacks=callbacks,
#             verbose=1
#         )

#         # Evaluate
#         test_loss, test_accuracy, test_precision, test_recall = model.evaluate(X_test, y_test, verbose=0)
#         logger.info(f"Test Accuracy: {test_accuracy:.4f}")
#         logger.info(f"Test Precision: {test_precision:.4f}")
#         logger.info(f"Test Recall: {test_recall:.4f}")

#         # Find best threshold
#         y_probs = model.predict(X_test).ravel()
#         fpr, tpr, thresholds = roc_curve(y_test, y_probs)
#         best_threshold = thresholds[np.argmax(tpr - fpr)]
#         logger.info(f"Best Threshold Found: {best_threshold:.3f}")

#         y_pred = (y_probs > best_threshold).astype(int)
#         print("\nClassification Report:")
#         print(classification_report(y_test, y_pred, target_names=["No Siren", "Siren"]))

#         # Save final model
#         final_model_path = self.output_path / "siren_cnn_model_finalnew.keras"
#         model.save(final_model_path)
#         logger.info(f"✅ Final model saved to {final_model_path}")

#         # Confusion Matrix
#         cm = confusion_matrix(y_test, y_pred)
#         plt.figure(figsize=(6, 5))
#         sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
#                     xticklabels=["No Siren", "Siren"],
#                     yticklabels=["No Siren", "Siren"])
#         plt.title("Confusion Matrix - Siren Detection")
#         plt.xlabel("Predicted")
#         plt.ylabel("Actual")
#         plt.show()

#         return model, history, best_threshold


# if __name__ == "__main__":
#     trainer = SirenCNNTrainer()
#     trainer.train_cnn_model()




import librosa
import numpy as np
import tensorflow as tf
import logging
import warnings
import sys
from pathlib import Path
import pygame                   # for playing input sound
import pyttsx3                  # for voice alerts

warnings.filterwarnings('ignore')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

MODEL_PATH = Path("/models/best_siren_modelcollab.h5")  # relative to detection/
SAMPLE_RATE = 22050
DURATION = 3.0  # 3 seconds

# Initialize text-to-speech engine
engine = pyttsx3.init()
engine.setProperty("rate", 160)   # speech speed
engine.setProperty("volume", 1.0) # volume (0.0 to 1.0)

def speak(message: str):
    """Speak the given message aloud"""
    engine.say(message)
    engine.runAndWait()

def play_audio(audio_file: str):
    """Play audio file using pygame (supports wav & mp3)"""
    try:
        pygame.mixer.init()
        pygame.mixer.music.load(audio_file)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
    except Exception as e:
        logger.error(f"Could not play audio {audio_file}: {e}")

def extract_audio_features(audio_file_path):
    """Extract mel spectrogram features from audio file for inference"""
    try:
        audio_data, sr = librosa.load(audio_file_path, sr=SAMPLE_RATE, duration=DURATION)
        target_length = int(SAMPLE_RATE * DURATION)

        if len(audio_data) < target_length:
            audio_data = np.pad(audio_data, (0, target_length - len(audio_data)))
        else:
            audio_data = audio_data[:target_length]

        mel_spec = librosa.feature.melspectrogram(
            y=audio_data,
            sr=sr,
            n_mels=128,   # ✅ must match training
            fmax=8000
        )
        log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
        log_mel_spec = (log_mel_spec - log_mel_spec.mean()) / (log_mel_spec.std() + 1e-6)

        # Ensure shape (128, 128)
        if log_mel_spec.shape[1] < 128:
            pad_width = 128 - log_mel_spec.shape[1]
            log_mel_spec = np.pad(log_mel_spec, ((0, 0), (0, pad_width)), mode='constant')
        else:
            log_mel_spec = log_mel_spec[:, :128]

        return log_mel_spec.reshape(1, 128, 128, 1)  # ✅ match training input shape
    except Exception as e:
        logger.error(f"Error extracting features from {audio_file_path}: {e}")
        return None

def predict_siren(audio_file):
    """Predict if siren is present in the audio and play alerts"""
    if not MODEL_PATH.exists():
        logger.error("Trained model not found. Please train the model first.")
        return

    print(f"🔊 Playing {audio_file} ...")
    play_audio(audio_file)

    # Load trained model
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)

    features = extract_audio_features(audio_file)
    if features is None:
        return

    prediction = model.predict(features)
    prob = prediction[0][0]

    if prob > 0.1:
        alert_msg = "🚨 ALERT: Siren sound detected in audio! 🚑"
        print(alert_msg)
        speak("Alert! Siren detected. Please give way.")
    else:
        normal_msg = "✅ No siren detected in audio."
        print(normal_msg)
        speak("No siren detected.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python alert_system.py <audio_file.wav>")
    else:
        audio_file = sys.argv[1]
        predict_siren(audio_file)