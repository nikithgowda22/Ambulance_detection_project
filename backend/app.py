# backend/app.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import asyncio
import json
import threading
import cv2
from ultralytics import YOLO
from typing import Dict, List
import logging
import urllib.request
import urllib.error

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Allow CORS for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            "police": [],
            "hospital": [],
            "traffic": []
        }

    async def connect(self, websocket: WebSocket, user_type: str):
        await websocket.accept()
        self.active_connections[user_type].append(websocket)
        logger.info(f"New {user_type} connection. Total: {len(self.active_connections[user_type])}")

    def disconnect(self, websocket: WebSocket, user_type: str):
        if websocket in self.active_connections[user_type]:
            self.active_connections[user_type].remove(websocket)
        logger.info(f"{user_type} disconnected. Total: {len(self.active_connections[user_type])}")

    async def broadcast(self, message: str, user_type: str):
        if user_type in self.active_connections:
            disconnected_connections = []
            for connection in self.active_connections[user_type]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending message: {e}")
                    disconnected_connections.append(connection)
            
            # Remove disconnected connections
            for connection in disconnected_connections:
                self.disconnect(connection, user_type)

manager = ConnectionManager()

# WebSocket endpoint for real-time alerts
@app.websocket("/ws/{user_type}")
async def websocket_endpoint(websocket: WebSocket, user_type: str):
    if user_type not in ["police", "hospital", "traffic"]:
        await websocket.close(code=1008, reason="Invalid user type")
        return
        
    await manager.connect(websocket, user_type)
    try:
        while True:
            # Keep connection alive by receiving messages
            data = await websocket.receive_text()
            # You can handle incoming messages here if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_type)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_type)

# HTTP endpoint to trigger alerts
@app.post("/alert")
async def trigger_alert(alert_data: dict):
    user_type = alert_data.get("user_type", "police")
    message = alert_data.get("message", "")
    
    # Broadcast to all connected clients of this user type
    await manager.broadcast(json.dumps({
        "type": "alert",
        "message": message,
        "timestamp": datetime.now().isoformat()
    }), user_type)
    
    return {"status": "alert_sent", "message": message}

# HTTP endpoint to get recent alerts (optional)
@app.get("/alerts/{user_type}")
async def get_recent_alerts(user_type: str, limit: int = 10):
    # In a real app, you would fetch from a database
    return {"alerts": []}

# Load video model
video_model = None

def load_model():
    global video_model
    try:
        # Load your YOLO model here
        video_model = YOLO("detection/best.pt")
        logger.info("YOLO model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {e}")

# Video detection function
def detect_ambulance(video_source=0, alert_callback=None):
    cap = cv2.VideoCapture(video_source)
    if not cap.isOpened():
        logger.error("Error opening video source")
        return
    
    logger.info("Starting ambulance detection...")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        results = video_model(frame, verbose=False)
        ambulance_detected = False

        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                if video_model.names[cls] == "ambulance":
                    ambulance_detected = True
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(frame, "Ambulance Detected", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

        # Display the frame (optional)
        cv2.imshow("Ambulance Detection", frame)
        
        # Trigger alert if ambulance detected
        if ambulance_detected and alert_callback:
            alert_callback("🚨 Ambulance detected in video!")
            
        # Break on 'q' key press
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

# Background task to run detection
detection_thread = None
stop_detection = False

def run_detection_in_background():
    global stop_detection
    stop_detection = False
    
    def alert_callback(message):
        # This will be called when an ambulance is detected
        asyncio.run(manager.broadcast(json.dumps({
            "type": "alert",
            "message": message,
            "timestamp": datetime.now().isoformat()
        }), "police"))
    
    while not stop_detection:
        detect_ambulance(0, alert_callback)  # 0 for webcam
        # Add a small delay before restarting detection
        threading.Event().wait(1)

@app.on_event("startup")
async def startup_event():
    load_model()
    # Start detection in a separate thread
    global detection_thread
    detection_thread = threading.Thread(target=run_detection_in_background, daemon=True)
    detection_thread.start()
    logger.info("Detection system started")

@app.on_event("shutdown")
async def shutdown_event():
    global stop_detection
    stop_detection = True
    logger.info("Shutting down detection system")

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Ambulance Detection API is running"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": video_model is not None}