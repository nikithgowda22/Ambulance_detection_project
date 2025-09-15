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
# import uuid

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

# # Store active ambulances and their status
# active_ambulances = {}
# ambulance_history = []

# # Mock location generator
# def get_mock_location():
#     import random
#     locations = [
#         {"latitude": 12.9716, "longitude": 77.5946, "address": "MG Road, Bangalore"},
#         {"latitude": 12.9698, "longitude": 77.7500, "address": "Whitefield, Bangalore"},
#         {"latitude": 12.9352, "longitude": 77.6245, "address": "Koramangala, Bangalore"},
#         {"latitude": 12.9279, "longitude": 77.6271, "address": "BTM Layout, Bangalore"},
#         {"latitude": 12.9141, "longitude": 77.6081, "address": "JP Nagar, Bangalore"},
#     ]
#     return random.choice(locations)

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

#     async def broadcast_to_multiple(self, message: str, user_types: List[str]):
#         for user_type in user_types:
#             await self.broadcast(message, user_type)

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
#             # Receive and handle incoming messages
#             data = await websocket.receive_text()
#             try:
#                 message_data = json.loads(data)
#                 await handle_websocket_message(message_data, user_type)
#             except json.JSONDecodeError:
#                 logger.error(f"Invalid JSON received from {user_type}")
#     except WebSocketDisconnect:
#         manager.disconnect(websocket, user_type)
#     except Exception as e:
#         logger.error(f"WebSocket error: {e}")
#         manager.disconnect(websocket, user_type)

# async def handle_websocket_message(message_data: dict, sender_type: str):
#     """Handle incoming WebSocket messages"""
#     message_type = message_data.get("type")
    
#     if message_type == "ambulance_passed":
#         # Police confirmed ambulance has passed
#         ambulance_id = message_data.get("ambulanceId")
#         if ambulance_id in active_ambulances:
#             ambulance_data = active_ambulances[ambulance_id]
#             ambulance_data["status"] = "passed"
#             ambulance_data["passedAt"] = datetime.now().isoformat()
            
#             # Move to history
#             ambulance_history.append(ambulance_data.copy())
#             del active_ambulances[ambulance_id]
            
#             # Broadcast update to all police dashboards
#             await manager.broadcast(json.dumps({
#                 "type": "ambulance_status_update",
#                 "ambulanceId": ambulance_id,
#                 "status": "passed",
#                 "timestamp": datetime.now().isoformat()
#             }), "police")
            
#             logger.info(f"Ambulance {ambulance_id} marked as passed")

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

# # Get ambulance history endpoint
# @app.get("/ambulance-history")
# async def get_ambulance_history():
#     return {"history": ambulance_history}

# # Get active ambulances endpoint
# @app.get("/active-ambulances")
# async def get_active_ambulances():
#     return {"active": list(active_ambulances.values())}

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
#         # For testing, create a mock model
#         video_model = "mock_model"

# # Enhanced ambulance detection with proper alert system
# def detect_ambulance(video_source=0, alert_callback=None):
#     cap = cv2.VideoCapture(video_source)
#     if not cap.isOpened():
#         logger.error("Error opening video source")
#         return
    
#     logger.info("Starting ambulance detection...")
#     last_detection_time = 0
#     detection_cooldown = 10  # 10 seconds cooldown between detections
    
#     while cap.isOpened():
#         ret, frame = cap.read()
#         if not ret:
#             break

#         current_time = datetime.now().timestamp()
#         ambulance_detected = False

#         try:
#             if video_model != "mock_model":
#                 results = video_model(frame, verbose=False)
#                 for r in results:
#                     for box in r.boxes:
#                         cls = int(box.cls[0])
#                         if video_model.names[cls] == "ambulance":
#                             ambulance_detected = True
#                             x1, y1, x2, y2 = map(int, box.xyxy[0])
#                             cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
#                             cv2.putText(frame, "Ambulance Detected", (x1, y1 - 10),
#                                         cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
#             else:
#                 # Mock detection for testing (simulate detection every 30 seconds)
#                 if int(current_time) % 30 == 0:
#                     ambulance_detected = True
#                     cv2.putText(frame, "MOCK: Ambulance Detected", (50, 50),
#                                 cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
#         except Exception as e:
#             logger.error(f"Detection error: {e}")

#         # Display the frame (optional)
#         cv2.imshow("Ambulance Detection", frame)
        
#         # Trigger alert if ambulance detected and cooldown period passed
#         if ambulance_detected and (current_time - last_detection_time) > detection_cooldown:
#             if alert_callback:
#                 alert_callback()
#             last_detection_time = current_time
            
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
    
#     def alert_callback():
#         """Called when ambulance is detected in video"""
#         # Generate unique ambulance ID
#         ambulance_id = str(uuid.uuid4())[:8]
#         location = get_mock_location()
        
#         # Create ambulance record
#         ambulance_data = {
#             "id": ambulance_id,
#             "detectedAt": datetime.now().isoformat(),
#             "location": location,
#             "status": "detected",
#             "priority": "HIGH"
#         }
        
#         # Add to active ambulances
#         active_ambulances[ambulance_id] = ambulance_data
        
#         # Create the alert message for police dashboard
#         alert_message = {
#             "type": "emergency_alert",
#             "id": ambulance_id,
#             "message": f"🚨 AMBULANCE DETECTED - Requesting green corridor clearance",
#             "location": location,
#             "timestamp": datetime.now().isoformat(),
#             "ambulanceId": ambulance_id,
#             "priority": "HIGH",
#             "status": "active"
#         }
        
#         # Broadcast to police dashboard
#         asyncio.run(manager.broadcast(json.dumps(alert_message), "police"))
        
#         logger.info(f"Ambulance detection alert sent: {ambulance_id} at {location['address']}")
    
#     try:
#         detect_ambulance(0, alert_callback)  # 0 for webcam
#     except Exception as e:
#         logger.error(f"Detection error: {e}")

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
#     return {
#         "status": "healthy", 
#         "model_loaded": video_model is not None,
#         "active_ambulances": len(active_ambulances),
#         "total_history": len(ambulance_history)
#     }

# backend/app.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import asyncio
import json
import threading
import cv2
from ultralytics import YOLO
from typing import Dict, List, Optional
import logging
import uuid
import sqlite3
import os
from contextlib import contextmanager
from pydantic import BaseModel

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

# Database setup
DATABASE_PATH = "ambulance_system.db"

def init_database():
    """Initialize the SQLite database with required tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create ambulance_detections table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ambulance_detections (
            id TEXT PRIMARY KEY,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            location_lat REAL,
            location_lng REAL,
            location_address TEXT,
            status TEXT DEFAULT 'detected',
            priority TEXT DEFAULT 'HIGH',
            cleared_at TIMESTAMP,
            passed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create emergency_alerts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS emergency_alerts (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            location_lat REAL,
            location_lng REAL,
            location_address TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create notification_queue table for background notifications
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notification_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ambulance_id TEXT,
            message TEXT,
            recipient_type TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sent_at TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Pydantic models for API
class AmbulanceDetection(BaseModel):
    id: str
    detected_at: str
    location_lat: float
    location_lng: float
    location_address: str
    status: str
    priority: str
    cleared_at: Optional[str] = None
    passed_at: Optional[str] = None

class DatabaseService:
    @staticmethod
    def save_ambulance_detection(ambulance_data: dict):
        """Save ambulance detection to database"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO ambulance_detections 
                (id, detected_at, location_lat, location_lng, location_address, status, priority)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                ambulance_data['id'],
                ambulance_data['detectedAt'],
                ambulance_data['location']['latitude'],
                ambulance_data['location']['longitude'],
                ambulance_data['location']['address'],
                ambulance_data['status'],
                ambulance_data['priority']
            ))
            conn.commit()
            logger.info(f"Saved ambulance detection {ambulance_data['id']} to database")
    
    @staticmethod
    def update_ambulance_status(ambulance_id: str, status: str, timestamp_field: str = None):
        """Update ambulance status in database"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            update_query = "UPDATE ambulance_detections SET status = ?, updated_at = CURRENT_TIMESTAMP"
            params = [status]
            
            if timestamp_field == 'cleared_at':
                update_query += ", cleared_at = ?"
                params.append(datetime.now().isoformat())
            elif timestamp_field == 'passed_at':
                update_query += ", passed_at = ?"
                params.append(datetime.now().isoformat())
            
            update_query += " WHERE id = ?"
            params.append(ambulance_id)
            
            cursor.execute(update_query, params)
            conn.commit()
            logger.info(f"Updated ambulance {ambulance_id} status to {status}")
    
    @staticmethod
    def get_ambulance_history(limit: int = 100):
        """Get ambulance history from database"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM ambulance_detections 
                WHERE status IN ('passed', 'completed')
                ORDER BY detected_at DESC 
                LIMIT ?
            ''', (limit,))
            
            rows = cursor.fetchall()
            history = []
            
            for row in rows:
                history.append({
                    'id': row['id'],
                    'detectedAt': row['detected_at'],
                    'location': {
                        'latitude': row['location_lat'],
                        'longitude': row['location_lng'],
                        'address': row['location_address']
                    },
                    'status': row['status'],
                    'priority': row['priority'],
                    'clearedAt': row['cleared_at'],
                    'passedAt': row['passed_at']
                })
            
            return history
    
    @staticmethod
    def get_active_ambulances():
        """Get currently active ambulances from database"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM ambulance_detections 
                WHERE status IN ('detected', 'path_cleared', 'active')
                ORDER BY detected_at DESC
            ''')
            
            rows = cursor.fetchall()
            active = []
            
            for row in rows:
                active.append({
                    'id': row['id'],
                    'detectedAt': row['detected_at'],
                    'location': {
                        'latitude': row['location_lat'],
                        'longitude': row['location_lng'],
                        'address': row['location_address']
                    },
                    'status': row['status'],
                    'priority': row['priority'],
                    'clearedAt': row['cleared_at']
                })
            
            return active
    
    @staticmethod
    def queue_notification(ambulance_id: str, message: str, recipient_type: str):
        """Queue a notification for background processing"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO notification_queue (ambulance_id, message, recipient_type)
                VALUES (?, ?, ?)
            ''', (ambulance_id, message, recipient_type))
            conn.commit()
            logger.info(f"Queued notification for {recipient_type}: {message[:50]}...")
    @staticmethod
    def delete_ambulance_record(ambulance_id: str) -> bool:
        """
        Deletes a specific ambulance record from the database.
        Returns True if a record was deleted, False otherwise.
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM ambulance_detections WHERE id = ?", (ambulance_id,))
            conn.commit()
            
            # Check if any row was deleted
            return cursor.rowcount > 0

# Store active ambulances and their status (in-memory cache)
active_ambulances = {}

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
        
        # Send current active ambulances to new police connections
        if user_type == "police":
            active_ambulances_data = DatabaseService.get_active_ambulances()
            for ambulance in active_ambulances_data:
                await websocket.send_text(json.dumps({
                    "type": "emergency_alert",
                    "id": ambulance['id'],
                    "message": f"🚨 AMBULANCE DETECTED - Requesting green corridor clearance",
                    "location": ambulance['location'],
                    "timestamp": ambulance['detectedAt'],
                    "ambulanceId": ambulance['id'],
                    "priority": ambulance['priority'],
                    "status": ambulance['status']
                }))

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
    
    def has_active_connections(self, user_type: str) -> bool:
        """Check if there are active connections for a user type"""
        return len(self.active_connections[user_type]) > 0

manager = ConnectionManager()

# Background notification service
class NotificationService:
    @staticmethod
    async def process_queued_notifications():
        """Process pending notifications in the queue"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, ambulance_id, message, recipient_type 
                FROM notification_queue 
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT 10
            ''')
            
            notifications = cursor.fetchall()
            
            for notification in notifications:
                try:
                    # Try to send notification
                    if manager.has_active_connections(notification['recipient_type']):
                        await manager.broadcast(notification['message'], notification['recipient_type'])
                        
                        # Mark as sent
                        cursor.execute('''
                            UPDATE notification_queue 
                            SET status = 'sent', sent_at = CURRENT_TIMESTAMP 
                            WHERE id = ?
                        ''', (notification['id'],))
                        conn.commit()
                        
                        logger.info(f"Sent queued notification {notification['id']}")
                    else:
                        # Keep in queue if no active connections
                        logger.info(f"No active {notification['recipient_type']} connections, keeping notification in queue")
                
                except Exception as e:
                    logger.error(f"Error processing notification {notification['id']}: {e}")
    
    @staticmethod
    async def schedule_background_notifications():
        """Background task to process notifications periodically"""
        while True:
            try:
                await NotificationService.process_queued_notifications()
                await asyncio.sleep(5)  # Check every 5 seconds
            except Exception as e:
                logger.error(f"Error in background notification service: {e}")
                await asyncio.sleep(10)

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
    
    if message_type == "path_cleared":
        # Police cleared the path
        ambulance_id = message_data.get("ambulanceId")
        if ambulance_id:
            # Update database
            DatabaseService.update_ambulance_status(ambulance_id, "path_cleared", "cleared_at")
            
            # Update in-memory cache
            if ambulance_id in active_ambulances:
                active_ambulances[ambulance_id]["status"] = "path_cleared"
                active_ambulances[ambulance_id]["clearedAt"] = datetime.now().isoformat()
            
            logger.info(f"Path cleared for ambulance {ambulance_id}")
    
    elif message_type == "ambulance_passed":
        # Police confirmed ambulance has passed
        ambulance_id = message_data.get("ambulanceId")
        if ambulance_id:
            # Update database
            DatabaseService.update_ambulance_status(ambulance_id, "passed", "passed_at")
            
            # Remove from in-memory cache
            if ambulance_id in active_ambulances:
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
    history = DatabaseService.get_ambulance_history()
    return {"history": history}

# Get active ambulances endpoint
@app.get("/active-ambulances")
async def get_active_ambulances():
    active = DatabaseService.get_active_ambulances()
    return {"active": active}
@app.delete("/ambulance-history/{ambulance_id}")
async def delete_ambulance_history(ambulance_id: str):
    """
    Deletes a specific ambulance record from the history.
    """
    try:
        success = DatabaseService.delete_ambulance_record(ambulance_id)
        if success:
            logger.info(f"Ambulance record {ambulance_id} deleted successfully.")
            return {"status": "success", "message": f"Record for ambulance ID {ambulance_id} deleted successfully."}
        else:
            logger.warning(f"Attempted to delete non-existent record: {ambulance_id}")
            raise HTTPException(status_code=404, detail=f"Record for ambulance ID {ambulance_id} not found.")
    except Exception as e:
        logger.error(f"Error deleting ambulance record {ambulance_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

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
    detection_cooldown = 15  # 15 seconds cooldown between detections
    
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
                if int(current_time) % 30 == 0 and (current_time - last_detection_time) > detection_cooldown:
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
        
        # Save to database
        DatabaseService.save_ambulance_detection(ambulance_data)
        
        # Add to active ambulances cache
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
            "status": "detected"
        }
        
        alert_json = json.dumps(alert_message)
        
        # Try to broadcast to connected police dashboards
        if manager.has_active_connections("police"):
            asyncio.run(manager.broadcast(alert_json, "police"))
            logger.info(f"Ambulance detection alert sent: {ambulance_id} at {location['address']}")
        else:
            # Queue notification for when police reconnect
            DatabaseService.queue_notification(
                ambulance_id, 
                alert_json, 
                "police"
            )
            logger.info(f"No active police connections - queued notification for ambulance {ambulance_id}")
    
    try:
        detect_ambulance(0, alert_callback)  # 0 for webcam
    except Exception as e:
        logger.error(f"Detection error: {e}")

@app.on_event("startup")
async def startup_event():
    # Initialize database
    init_database()
    
    # Load model
    load_model()
    
    # Start detection in a separate thread
    global detection_thread
    detection_thread = threading.Thread(target=run_detection_in_background, daemon=True)
    detection_thread.start()
    
    # Start background notification service
    asyncio.create_task(NotificationService.schedule_background_notifications())
    
    logger.info("Ambulance detection system started with database support")

@app.on_event("shutdown")
async def shutdown_event():
    global stop_detection
    stop_detection = True
    logger.info("Shutting down detection system")

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Ambulance Detection API is running with database support"}

# Health check endpoint
@app.get("/health")
async def health_check():
    active_count = len(DatabaseService.get_active_ambulances())
    history_count = len(DatabaseService.get_ambulance_history())
    
    return {
        "status": "healthy", 
        "model_loaded": video_model is not None,
        "active_ambulances": active_count,
        "total_history": history_count,
        "database_connected": os.path.exists(DATABASE_PATH)
    }

# Manual test endpoint to simulate ambulance detection
@app.post("/test-detection")
async def test_detection():
    """Manually trigger ambulance detection for testing"""
    ambulance_id = str(uuid.uuid4())[:8]
    location = get_mock_location()
    
    ambulance_data = {
        "id": ambulance_id,
        "detectedAt": datetime.now().isoformat(),
        "location": location,
        "status": "detected",
        "priority": "HIGH"
    }
    
    # Save to database
    DatabaseService.save_ambulance_detection(ambulance_data)
    
    # Add to active ambulances cache
    active_ambulances[ambulance_id] = ambulance_data
    
    alert_message = {
        "type": "emergency_alert",
        "id": ambulance_id,
        "message": f"🚨 TEST AMBULANCE DETECTED - Requesting green corridor clearance",
        "location": location,
        "timestamp": datetime.now().isoformat(),
        "ambulanceId": ambulance_id,
        "priority": "HIGH",
        "status": "detected"
    }
    
    alert_json = json.dumps(alert_message)
    
    if manager.has_active_connections("police"):
        await manager.broadcast(alert_json, "police")
        return {"status": "test_alert_sent", "ambulance_id": ambulance_id}
    else:
        DatabaseService.queue_notification(ambulance_id, alert_json, "police")
        return {"status": "test_alert_queued", "ambulance_id": ambulance_id}