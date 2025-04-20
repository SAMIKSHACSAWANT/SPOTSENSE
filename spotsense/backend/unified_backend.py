from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import cv2
import pickle
import numpy as np
import os
import json
import threading
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Constants
CARPARKPOS_PATH = os.path.join(os.path.dirname(__file__), 'CarParkPos')
UNIQUEID_PATH = os.path.join(os.path.dirname(__file__), 'UniqueID')
VIDEO_PATH = os.path.join(os.path.dirname(__file__), 'carPark.mp4')

# Global state
parking_status = {}  # {slot_id: {"occupied": bool, "last_updated": timestamp}}
parking_data = {
    "total_spaces": 0,
    "available_spaces": 0,
    "occupied_spaces": 0,
    "slots": []
}

# Video processing globals
width, height = 107, 48
global_frame = None
global_processed_frame = None
video_lock = threading.Lock()

def load_parking_configuration():
    """Load parking space configuration from files"""
    try:
        # Load parking positions
        with open(CARPARKPOS_PATH, 'rb') as f:
            positions = pickle.load(f)
        
        # Load unique IDs
        with open(UNIQUEID_PATH, 'rb') as f:
            unique_ids = pickle.load(f)
        
        # Initialize parking status
        global parking_status, parking_data
        parking_data["total_spaces"] = len(positions)
        parking_data["available_spaces"] = len(positions)
        parking_data["occupied_spaces"] = 0
        parking_data["slots"] = []
        
        # Create slot data
        for i, pos in enumerate(positions):
            slot_id = str(unique_ids[i]) if i < len(unique_ids) else str(i)
            slot_data = {
                "id": slot_id,
                "position": {"x": pos[0], "y": pos[1]},
                "status": "available",
                "last_updated": datetime.now().isoformat()
            }
            parking_data["slots"].append(slot_data)
            parking_status[slot_id] = {
                "occupied": False,
                "last_updated": datetime.now().isoformat(),
                "x": pos[0],
                "y": pos[1]
            }
        
        print(f"Loaded {len(positions)} parking spaces successfully")
        return True
    except Exception as e:
        print(f"Error loading parking configuration: {e}")
        return False

def process_frame(frame):
    """Process a video frame and update parking status"""
    global parking_data, parking_status

    # Convert to grayscale and apply image processing
    imgGray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    imgBlur = cv2.GaussianBlur(imgGray, (3, 3), 1)
    imgThreshold = cv2.adaptiveThreshold(
        imgBlur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
    imgMedian = cv2.medianBlur(imgThreshold, 5)
    kernel = np.ones((3, 3), np.uint8)
    imgDilate = cv2.dilate(imgMedian, kernel, iterations=1)
    
    # Count available spots
    available_count = 0
    occupied_count = 0
    
    # Draw rectangles and update status for each parking spot
    for slot in parking_data["slots"]:
        slot_id = slot["id"]
        x = parking_status[slot_id]["x"]
        y = parking_status[slot_id]["y"]
        
        # Extract the region of interest
        imgCrop = imgDilate[y:y+height, x:x+width]
        count = cv2.countNonZero(imgCrop)
        
        # Determine if the spot is occupied (threshold at 850)
        is_occupied = count >= 850
        
        # Update status
        if is_occupied:
            status = "occupied"
            color = (0, 0, 255)  # Red
            occupied_count += 1
        else:
            status = "available"
            color = (0, 255, 0)  # Green
            available_count += 1
        
        # Update the slot data
        slot["status"] = status
        slot["last_updated"] = datetime.now().isoformat()
        parking_status[slot_id]["occupied"] = is_occupied
        parking_status[slot_id]["last_updated"] = datetime.now().isoformat()
        
        # Draw rectangle on the frame
        cv2.rectangle(frame, (x, y), (x+width, y+height), color, 3)
        cv2.putText(frame, f"{slot_id}", (x+5, y+20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        cv2.putText(frame, f"{count}", (x+5, y+45), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    
    # Update global parking data
    parking_data["available_spaces"] = available_count
    parking_data["occupied_spaces"] = occupied_count
    
    # Add total count text to frame
    cv2.putText(frame, f"Available: {available_count}/{len(parking_data['slots'])}", 
                (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 200, 0), 2)
    
    return frame

def video_processing_thread():
    """Background thread for video processing"""
    global global_frame, global_processed_frame
    
    print("Starting video processing thread...")
    cap = cv2.VideoCapture(VIDEO_PATH)
    
    if not cap.isOpened():
        print(f"Error: Could not open video file at {VIDEO_PATH}")
        return
    
    print(f"Video opened successfully: {cap.isOpened()}")
    
    while True:
        try:
            # Reset video if it reaches the end
            if cap.get(cv2.CAP_PROP_POS_FRAMES) == cap.get(cv2.CAP_PROP_FRAME_COUNT):
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            
            success, frame = cap.read()
            if not success:
                print("Failed to read frame")
                time.sleep(0.1)
                continue
            
            # Process the frame and update parking status
            with video_lock:
                processed_frame = process_frame(frame.copy())
                global_frame = frame.copy()
                global_processed_frame = processed_frame
            
            # Process at a reduced rate to avoid overloading
            time.sleep(0.1)
            
        except Exception as e:
            print(f"Error in video processing: {e}")
            time.sleep(0.5)

def generate_video_frames():
    """Generator for video streaming"""
    while True:
        if global_processed_frame is None:
            time.sleep(0.1)
            continue
        
        with video_lock:
            frame = global_processed_frame.copy()
        
        # Encode as JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        
        # Yield for streaming
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/parking/status', methods=['GET'])
def get_parking_status():
    """Get overall parking status"""
    return jsonify(parking_data)

@app.route('/api/parking/spaces', methods=['GET'])
def get_parking_spaces():
    """Get all parking spaces with availability status"""
    # Get the parking ID from query parameters if provided
    parking_id = request.args.get('parkingId', '1')  # Default to '1' if not provided
    
    # Create a spaces object compatible with frontend expectations
    spaces = {}
    for slot in parking_data["slots"]:
        spaces[slot["id"]] = {
            "id": slot["id"],
            "status": slot["status"],
            "position": slot["position"],
            "last_updated": slot["last_updated"]
        }
    
    # Return both the count and detailed space information
    return jsonify({
        "total": parking_data["total_spaces"],
        "available": parking_data["available_spaces"],
        "occupied": parking_data["occupied_spaces"],
        "spaces": spaces
    })

@app.route('/api/parking/<parking_id>/slots', methods=['GET'])
def get_parking_slots(parking_id):
    """Get status of all slots in a parking area"""
    # Currently we only support one parking area
    return jsonify({"slots": parking_data["slots"]})

@app.route('/api/parking/slots/<slot_id>', methods=['GET'])
def get_slot_status(slot_id):
    """Get status of a specific slot"""
    slot = next((slot for slot in parking_data["slots"] if slot["id"] == slot_id), None)
    if not slot:
        return jsonify({"error": "Slot not found"}), 404
    return jsonify(slot)

@app.route('/api/parking/slots/<slot_id>/status', methods=['PUT'])
def update_slot_status(slot_id):
    """Update status of a specific slot"""
    data = request.get_json()
    if not data or "status" not in data:
        return jsonify({"error": "Invalid request data"}), 400
    
    slot = next((slot for slot in parking_data["slots"] if slot["id"] == slot_id), None)
    if not slot:
        return jsonify({"error": "Slot not found"}), 404
    
    new_status = data["status"]
    if new_status not in ["available", "occupied"]:
        return jsonify({"error": "Invalid status"}), 400
    
    # Update slot status
    old_status = slot["status"]
    slot["status"] = new_status
    slot["last_updated"] = datetime.now().isoformat()
    
    # Update counters
    if old_status != new_status:
        if new_status == "occupied":
            parking_data["available_spaces"] -= 1
            parking_data["occupied_spaces"] += 1
        else:
            parking_data["available_spaces"] += 1
            parking_data["occupied_spaces"] -= 1
    
    return jsonify(slot)

@app.route('/api/parking/reset', methods=['POST'])
def reset_parking():
    """Reset all parking data to initial state"""
    success = load_parking_configuration()
    if not success:
        return jsonify({"error": "Failed to reset parking data"}), 500
    return jsonify({"message": "Parking data reset successfully"})

@app.route('/api/parking/video', methods=['GET'])
def video_feed():
    """Stream processed video frames"""
    return Response(generate_video_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    # Initialize parking data
    if not load_parking_configuration():
        print("Warning: Failed to load initial parking configuration")
    
    # Start video processing in a background thread
    video_thread = threading.Thread(target=video_processing_thread, daemon=True)
    video_thread.start()
    
    # Start Flask server
    print("Starting unified backend server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True) 