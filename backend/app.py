# # backend/app.py
# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# from fastapi.middleware.cors import CORSMiddleware
# from datetime import datetime
# import asyncio
# import json
# import threading
# import cv2
# from ultralytics import YOLO
# from typing import Dict, List
# import logging
# import urllib.request
# import urllib.error

# # Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI()

# # Allow CORS for React Native app
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # For development only
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Store active WebSocket connections
# class ConnectionManager:
#     def __init__(self):
#         self.active_connections: Dict[str, List[WebSocket]] = {
#             "police": [],
#             "hospital": [],
#             "traffic": [],
#             "ambulance": []
#         }

#     async def connect(self, websocket: WebSocket, user_type: str):
#         await websocket.accept()
#         self.active_connections[user_type].append(websocket)
#         logger.info(f"New {user_type} connection. Total: {len(self.active_connections[user_type])}")

#     def disconnect(self, websocket: WebSocket, user_type: str):
#         if websocket in self.active_connections[user_type]:
#             self.active_connections[user_type].remove(websocket)
#         logger.info(f"{user_type} disconnected. Total: {len(self.active_connections[user_type])}")

#     async def broadcast(self, message: str, user_type: str):
#         if user_type in self.active_connections:
#             disconnected_connections = []
#             for connection in self.active_connections[user_type]:
#                 try:
#                     await connection.send_text(message)
#                 except Exception as e:
#                     logger.error(f"Error sending message: {e}")
#                     disconnected_connections.append(connection)
            
#             # Remove disconnected connections
#             for connection in disconnected_connections:
#                 self.disconnect(connection, user_type)

# manager = ConnectionManager()

# # WebSocket endpoint for real-time alerts
# @app.websocket("/ws/{user_type}")
# async def websocket_endpoint(websocket: WebSocket, user_type: str):
#     if user_type not in ["police", "hospital", "traffic", "ambulance"]:
#         await websocket.close(code=1008, reason="Invalid user type")
#         return
        
#     await manager.connect(websocket, user_type)
#     try:
#         while True:
#             # Keep connection alive by receiving messages
#             data = await websocket.receive_text()
#             # You can handle incoming messages here if needed
#     except WebSocketDisconnect:
#         manager.disconnect(websocket, user_type)
#     except Exception as e:
#         logger.error(f"WebSocket error: {e}")
#         manager.disconnect(websocket, user_type)

# # HTTP endpoint to trigger alerts
# @app.post("/alert")
# async def trigger_alert(alert_data: dict):
#     user_type = alert_data.get("user_type", "police")
#     message = alert_data.get("message", "")
    
#     # Broadcast to all connected clients of this user type
#     await manager.broadcast(json.dumps({
#         "type": "alert",
#         "message": message,
#         "timestamp": datetime.now().isoformat()
#     }), user_type)
    
#     return {"status": "alert_sent", "message": message}

# # HTTP endpoint to get recent alerts (optional)
# @app.get("/alerts/{user_type}")
# async def get_recent_alerts(user_type: str, limit: int = 10):
#     # In a real app, you would fetch from a database
#     return {"alerts": []}

# # Load video model
# video_model = None

# def load_model():
#     global video_model
#     try:
#         # Load your YOLO model here
#         video_model = YOLO("detection/best.pt")
#         logger.info("YOLO model loaded successfully")
#     except Exception as e:
#         logger.error(f"Error loading model: {e}")

# # Video detection function
# def detect_ambulance(video_source=0, alert_callback=None):
#     cap = cv2.VideoCapture(video_source)
#     if not cap.isOpened():
#         logger.error("Error opening video source")
#         return
    
#     logger.info("Starting ambulance detection...")
    
#     while cap.isOpened():
#         ret, frame = cap.read()
#         if not ret:
#             break

#         results = video_model(frame, verbose=False)
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

#         # Display the frame (optional)
#         cv2.imshow("Ambulance Detection", frame)
        
#         # Trigger alert if ambulance detected
#         if ambulance_detected and alert_callback:
#             alert_callback("🚨 Ambulance detected in video!")
            
#         # Break on 'q' key press
#         if cv2.waitKey(1) & 0xFF == ord("q"):
#             break

#     cap.release()
#     cv2.destroyAllWindows()

# # Background task to run detection
# detection_thread = None
# stop_detection = False

# def run_detection_in_background():
#     global stop_detection
#     stop_detection = False
    
#     def alert_callback(message):
#         # This will be called when an ambulance is detected
#         asyncio.run(manager.broadcast(json.dumps({
#             "type": "alert",
#             "message": message,
#             "timestamp": datetime.now().isoformat()
#         }), "police"))
    
#     while not stop_detection:
#         detect_ambulance(0, alert_callback)  # 0 for webcam
#         # Add a small delay before restarting detection
#         threading.Event().wait(1)

# @app.on_event("startup")
# async def startup_event():
#     load_model()
#     # Start detection in a separate thread
#     global detection_thread
#     detection_thread = threading.Thread(target=run_detection_in_background, daemon=True)
#     detection_thread.start()
#     logger.info("Detection system started")

# @app.on_event("shutdown")
# async def shutdown_event():
#     global stop_detection
#     stop_detection = True
#     logger.info("Shutting down detection system")

# # Health check endpoint
# @app.get("/")
# async def root():
#     return {"message": "Ambulance Detection API is running"}

# # Health check endpoint
# @app.get("/health")
# async def health_check():
#     return {"status": "healthy", "model_loaded": video_model is not None}

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
import uuid

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

# Store active ambulances and their status
active_ambulances = {}
ambulance_history = []

# Mock location generator
def get_mock_location():
    import random
    locations = [
        {"latitude": 12.9716, "longitude": 77.5946, "address": "MG Road, Bangalore"},
        {"latitude": 12.9698, "longitude": 77.7500, "address": "Whitefield, Bangalore"},
        {"latitude": 12.9352, "longitude": 77.6245, "address": "Koramangala, Bangalore"},
        {"latitude": 12.9279, "longitude": 77.6271, "address": "BTM Layout, Bangalore"},
        {"latitude": 12.9141, "longitude": 77.6081, "address": "JP Nagar, Bangalore"},
    ]
    return random.choice(locations)

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            "police": [],
            "hospital": [],
            "traffic": [],
            "ambulance": []
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

    async def broadcast_to_multiple(self, message: str, user_types: List[str]):
        for user_type in user_types:
            await self.broadcast(message, user_type)

manager = ConnectionManager()

# WebSocket endpoint for real-time alerts
@app.websocket("/ws/{user_type}")
async def websocket_endpoint(websocket: WebSocket, user_type: str):
    if user_type not in ["police", "hospital", "traffic", "ambulance"]:
        await websocket.close(code=1008, reason="Invalid user type")
        return
        
    await manager.connect(websocket, user_type)
    try:
        while True:
            # Receive and handle incoming messages
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                await handle_websocket_message(message_data, user_type)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from {user_type}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_type)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_type)

async def handle_websocket_message(message_data: dict, sender_type: str):
    """Handle incoming WebSocket messages"""
    message_type = message_data.get("type")
    
    if message_type == "ambulance_passed":
        # Police confirmed ambulance has passed
        ambulance_id = message_data.get("ambulanceId")
        if ambulance_id in active_ambulances:
            ambulance_data = active_ambulances[ambulance_id]
            ambulance_data["status"] = "passed"
            ambulance_data["passedAt"] = datetime.now().isoformat()
            
            # Move to history
            ambulance_history.append(ambulance_data.copy())
            del active_ambulances[ambulance_id]
            
            # Broadcast update to all police dashboards
            await manager.broadcast(json.dumps({
                "type": "ambulance_status_update",
                "ambulanceId": ambulance_id,
                "status": "passed",
                "timestamp": datetime.now().isoformat()
            }), "police")
            
            logger.info(f"Ambulance {ambulance_id} marked as passed")

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

# Get ambulance history endpoint
@app.get("/ambulance-history")
async def get_ambulance_history():
    return {"history": ambulance_history}

# Get active ambulances endpoint
@app.get("/active-ambulances")
async def get_active_ambulances():
    return {"active": list(active_ambulances.values())}

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
        # For testing, create a mock model
        video_model = "mock_model"

# Enhanced ambulance detection with proper alert system
def detect_ambulance(video_source=0, alert_callback=None):
    cap = cv2.VideoCapture(video_source)
    if not cap.isOpened():
        logger.error("Error opening video source")
        return
    
    logger.info("Starting ambulance detection...")
    last_detection_time = 0
    detection_cooldown = 10  # 10 seconds cooldown between detections
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        current_time = datetime.now().timestamp()
        ambulance_detected = False

        try:
            if video_model != "mock_model":
                results = video_model(frame, verbose=False)
                for r in results:
                    for box in r.boxes:
                        cls = int(box.cls[0])
                        if video_model.names[cls] == "ambulance":
                            ambulance_detected = True
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                            cv2.putText(frame, "Ambulance Detected", (x1, y1 - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            else:
                # Mock detection for testing (simulate detection every 30 seconds)
                if int(current_time) % 30 == 0:
                    ambulance_detected = True
                    cv2.putText(frame, "MOCK: Ambulance Detected", (50, 50),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        except Exception as e:
            logger.error(f"Detection error: {e}")

        # Display the frame (optional)
        cv2.imshow("Ambulance Detection", frame)
        
        # Trigger alert if ambulance detected and cooldown period passed
        if ambulance_detected and (current_time - last_detection_time) > detection_cooldown:
            if alert_callback:
                alert_callback()
            last_detection_time = current_time
            
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
    
    def alert_callback():
        """Called when ambulance is detected in video"""
        # Generate unique ambulance ID
        ambulance_id = str(uuid.uuid4())[:8]
        location = get_mock_location()
        
        # Create ambulance record
        ambulance_data = {
            "id": ambulance_id,
            "detectedAt": datetime.now().isoformat(),
            "location": location,
            "status": "detected",
            "priority": "HIGH"
        }
        
        # Add to active ambulances
        active_ambulances[ambulance_id] = ambulance_data
        
        # Create the alert message for police dashboard
        alert_message = {
            "type": "emergency_alert",
            "id": ambulance_id,
            "message": f"🚨 AMBULANCE DETECTED - Requesting green corridor clearance",
            "location": location,
            "timestamp": datetime.now().isoformat(),
            "ambulanceId": ambulance_id,
            "priority": "HIGH",
            "status": "active"
        }
        
        # Broadcast to police dashboard
        asyncio.run(manager.broadcast(json.dumps(alert_message), "police"))
        
        logger.info(f"Ambulance detection alert sent: {ambulance_id} at {location['address']}")
    
    try:
        detect_ambulance(0, alert_callback)  # 0 for webcam
    except Exception as e:
        logger.error(f"Detection error: {e}")

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
    return {
        "status": "healthy", 
        "model_loaded": video_model is not None,
        "active_ambulances": len(active_ambulances),
        "total_history": len(ambulance_history)
    }