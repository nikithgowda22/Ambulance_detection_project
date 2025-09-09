from keras.models import load_model, save_model

# Load your .keras model
model = load_model(r"C:\Users\LENOVO\Downloads\Ambulance_detection_project-main\Ambulance_detection_project-main\detection\models\siren_cnn_model_finalnew.keras")

# Save as .h5 format
save_model(model, r"C:\Users\LENOVO\Downloads\Ambulance_detection_project-main\Ambulance_detection_project-main\detection\models\siren_cnn_model_finalnew.h5")
