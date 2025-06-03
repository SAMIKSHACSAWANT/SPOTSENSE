from flask import Flask, jsonify, request, make_response, Response
from flask_cors import CORS
import json
import pickle
import os
import random
import datetime
import threading
import time
from database import authenticate_user, create_user, UserAuth
import cv2
import cvzone
import numpy as np
from collections import defaultdict

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Define absolute paths for consistency
carparkpos_path = os.path.join(os.path.dirname(__file__), 'CarParkPos')
uniqueid_path = os.path.join(os.path.dirname(__file__), 'UniqueID')
video_path = os.path.join(os.path.dirname(__file__), 'carPark.mp4')

# Global variables for computer vision
posList = []
UniqueID = []
temps = {}
counter = set()
width, height = 107, 48
colorBlack = (0, 0, 0)
global_frame = None
global_processed_frame = None
available_spots = 0
total_spots = 0
parking_data = {}  # Store parking slot data

# Load parking data
try:
    with open(carparkpos_path, 'rb') as f:
        posList = pickle.load(f)
    print(f"Loaded {len(posList)} parking spaces from {carparkpos_path}")

    with open(uniqueid_path, 'rb') as f:
        UniqueID = pickle.load(f)
    print(f"Loaded {len(UniqueID)} unique IDs from {uniqueid_path}")
    
    # Create temps dictionary based on the UniqueID
    temps = {}  # Use regular dict instead of defaultdict to avoid creating new entries
    for i, pos in enumerate(posList):
        if i < len(UniqueID):
            temps[pos] = UniqueID[i]
        else:
            temps[pos] = i
    print(f"Created mapping for {len(temps)} parking spaces")
    
    # Initialize total spots
    total_spots = len(posList)
    
except Exception as e:
    print(f"Error loading parking data: {e}")
    posList = []
    temps = {}

# Function to check parking spaces (adapted from main.py)
def checkParkingSpace(imgPro, img):
    global counter, parking_data, available_spots, total_spots
    
    spaceCounter = 0
    slot_status = {}  # Store status of each slot
    
    for pos in posList:
        x, y = pos
        slot_id = temps[pos]
        
        imgCrop = imgPro[y:y + height, x:x + width]
        count = cv2.countNonZero(imgCrop)
        
        is_available = count < 850
        if is_available:
            color = (0, 255, 0)  # GREEN
            thickness = 3
            spaceCounter += 1
            # This is for Adding when Space is not Vacant
            if slot_id not in counter:
                counter.add(slot_id)
        else:
            color = (0, 0, 255)  # RED
            thickness = 3
            # This is for Removing when Space is Vacant
            if slot_id in counter:   
                counter.remove(slot_id)

        # Store slot data
        slot_type = 'standard'
        if slot_id % 10 == 0 or slot_id % 10 == 9:
            slot_type = 'handicapped'
        elif slot_id % 15 == 0:
            slot_type = 'electric'
        elif slot_id % 7 == 0:
            slot_type = 'large'
            
        # Calculate floor and row information
        floor = (slot_id % 3) + 1
        row_index = (slot_id % 4)
        row = chr(65 + row_index)  # A, B, C, D
        position = (slot_id % 8) + 1
        
        slot_number = f"{row}{position}"
        
        # Store in parking data
        slot_key = f"1-{floor}-{slot_number}"
        parking_data[slot_key] = {
            "id": slot_key,
            "number": slot_number,
            "floor": floor,
            "row": row,
            "position": position,
            "isAvailable": is_available,
            "type": slot_type
        }
        
        # Draw on image
        ID = str(slot_id)
        cv2.rectangle(img, pos, (pos[0] + width, pos[1] + height), color, thickness)
        cvzone.putTextRect(img, str(count), (x, y + height - 3), scale=1,
                           thickness=1, offset=0, colorR=colorBlack)
        cvzone.putTextRect(img, ID, (x+1, y + height - 34), scale=1,
                           thickness=2, offset=0, colorR=colorBlack)
        if is_available:
            cvzone.putTextRect(img, "Free", (x+width-40, y + height), scale=1,
                               thickness=1, offset=0, colorR=colorBlack)
        else:
            cvzone.putTextRect(img, "Parked", (x+width-60, y + height-3), scale=1,
                               thickness=1, offset=0, colorR=colorBlack)

    cvzone.putTextRect(img, f'Free: {spaceCounter}/{len(posList)}', (100, 50), scale=3,
                       thickness=5, offset=20, colorR=(0, 200, 0))
    
    available_spots = spaceCounter
    total_spots = len(posList)
    return img

# Video processing thread
def process_video():
    global global_frame, global_processed_frame, available_spots, total_spots
    
    # Initialize video capture
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video file {video_path}")
        return
    
    print(f"Video opened successfully: {cap.isOpened()}")
    
    while True:
        # Reset video to beginning when it ends
        if cap.get(cv2.CAP_PROP_POS_FRAMES) == cap.get(cv2.CAP_PROP_FRAME_COUNT):
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        
        success, img = cap.read()
        if not success:
            print("Failed to read frame")
            time.sleep(0.1)
            continue
        
        # Process frame for parking detection
        imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        imgBlur = cv2.GaussianBlur(imgGray, (3, 3), 1)
        imgThreshold = cv2.adaptiveThreshold(
            imgBlur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
        imgMedian = cv2.medianBlur(imgThreshold, 5)
        kernel = np.ones((3, 3), np.uint8)
        imgDilate = cv2.dilate(imgMedian, kernel, iterations=1)
        
        # Check parking spaces and draw on image
        processed_img = checkParkingSpace(imgDilate, img.copy())
        
        # Store frames for streaming
        global_frame = img.copy()
        global_processed_frame = processed_img
        
        # Slow down processing a bit to simulate real-time
        time.sleep(0.1)

# Generate video frames
def generate_frames():
    while True:
        if global_processed_frame is None:
            time.sleep(0.1)
            continue
            
        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', global_processed_frame)
        if not ret:
            continue
            
        # Yield the output frame in bytes
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

# Mock parking spots data
parking_spots = [
    {
        "id": "1",
        "name": "Computer Vision Parking",
        "address": "123 Tech Street, CV Center",
        "latitude": 18.9902,
        "longitude": 72.8127,
        "totalSpots": 0,  # Will be updated with real data
        "availableSpots": 0,  # Will be updated with real data
        "hourlyRate": 50,
        "openingHours": "24/7",
        "ratings": 4.8,
        "amenities": ["CCTV", "EV Charging", "Smart Parking", "24/7 Security"]
    },
    {
        "id": "2",
        "name": "Plaza Parking",
        "address": "789 Market Street, Business District",
        "latitude": 18.9900,
        "longitude": 72.8200,
        "totalSpots": 80,
        "availableSpots": 42,
        "hourlyRate": 40,
        "openingHours": "6:00 AM - 11:00 PM",
        "ratings": 4.2,
        "amenities": ["Roof Cover", "Car Wash", "Security Guards"]
    },
    {
        "id": "3",
        "name": "City Center Parking",
        "address": "456 Park Avenue, Downtown",
        "latitude": 18.9880,
        "longitude": 72.8180,
        "totalSpots": 120,
        "availableSpots": 35,
        "hourlyRate": 60,
        "openingHours": "24/7",
        "ratings": 4.5,
        "amenities": ["CCTV", "Car Wash", "Valet", "EV Charging"]
    }
]

# Mock bookings data
bookings = {}

# Video streaming route
@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# API Routes
@app.route('/api/parking', methods=['GET'])
def get_all_parking_spots():
    # Update real-time data for the first parking spot
    parking_spots[0]["totalSpots"] = total_spots
    parking_spots[0]["availableSpots"] = available_spots
    return jsonify(parking_spots)

@app.route('/api/parking/nearby', methods=['GET'])
def get_nearby_parking_spots():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', default=5, type=float)
    
    # Update real-time data for the first parking spot
    parking_spots[0]["totalSpots"] = total_spots
    parking_spots[0]["availableSpots"] = available_spots
    
    # In a real app, you would filter based on location
    # For the demo, just return all spots
    return jsonify(parking_spots)

@app.route('/api/parking/<parking_id>/availability', methods=['GET'])
def get_parking_availability(parking_id):
    if parking_id == "1":
        # Return real-time CV data for the first parking lot
        return jsonify({
            "availableSpots": available_spots,
            "totalSpots": total_spots,
            "lastUpdated": datetime.datetime.now().isoformat()
        })
    else:
        # For other parking lots, return mock data
        for spot in parking_spots:
            if spot['id'] == parking_id:
                spot['availableSpots'] = random.randint(0, spot['totalSpots'])
                return jsonify({
                    "availableSpots": spot['availableSpots'],
                    "totalSpots": spot['totalSpots'],
                    "lastUpdated": datetime.datetime.now().isoformat()
                })
    
    return jsonify({"error": "Parking spot not found"}), 404

@app.route('/api/parking/<parking_id>/slots', methods=['GET'])
def get_parking_slots(parking_id):
    if parking_id == "1" and parking_data:
        # Return real slot data from computer vision
        return jsonify(list(parking_data.values()))
    
    # Create mock slots data for the parking location
    slots = []
    floor_count = 3
    rows = ['A', 'B', 'C', 'D']
    
    slot_id = 0
    for floor in range(1, floor_count + 1):
        for row in rows:
            for i in range(1, 9):  # 8 slots per row
                # Determine if the slot is available based on a pattern
                is_available = ((slot_id * 3) % 7) != 0  # Random-like pattern
                
                # Determine special slot types based on position
                slot_type = 'standard'
                if i == 1 or i == 8:
                    slot_type = 'handicapped'
                elif row == 'A' and (i == 3 or i == 4):
                    slot_type = 'large'
                elif row == 'C' and (i == 5 or i == 6):
                    slot_type = 'electric'
                
                slots.append({
                    "id": f"{parking_id}-{floor}-{row}{i}",
                    "number": f"{row}{i}",
                    "floor": floor,
                    "row": row,
                    "position": i,
                    "isAvailable": is_available,
                    "type": slot_type
                })
                
                slot_id += 1
    
    return jsonify(slots)

@app.route('/api/parking/<parking_id>/slots/<slot_id>/book', methods=['POST'])
def book_parking_slot(parking_id, slot_id):
    data = request.json
    booking_id = f"BK{random.randint(100000, 999999)}"
    
    # Save booking details
    bookings[booking_id] = {
        "bookingId": booking_id,
        "parkingId": parking_id,
        "parkingName": next((spot['name'] for spot in parking_spots if spot['id'] == parking_id), "Unknown Parking"),
        "slotId": slot_id,
        "slotNumber": data.get('slotNumber', 'Unknown'),
        "slotType": data.get('slotType', 'standard'),
        "floor": data.get('floor', 1),
        "duration": data.get('duration', 1),
        "rate": data.get('rate', 50),
        "totalCost": data.get('totalCost', 50),
        "bookingTime": datetime.datetime.now().isoformat(),
        "startTime": data.get('startTime', datetime.datetime.now().isoformat()),
        "endTime": data.get('endTime', (datetime.datetime.now() + datetime.timedelta(hours=data.get('duration', 1))).isoformat())
    }
    
    return jsonify({
        "success": True,
        "bookingId": booking_id,
        "message": "Booking confirmed"
    })

# Authentication endpoints
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    # Accept any email and password combination
    return jsonify({
        "success": True,
        "token": f"demo_{email}_{datetime.datetime.now().timestamp()}",
        "user": {
            "email": email,
            "username": email.split('@')[0]
        }
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    # Accept any registration without validation
    return jsonify({
        "success": True,
        "message": "User registered successfully (demo mode)"
    })

@app.route('/api/bookings', methods=['GET'])
def get_user_bookings():
    # In a real app, you would filter by user ID
    return jsonify(list(bookings.values()))

@app.route('/api/bookings/<booking_id>', methods=['GET'])
def get_booking_by_id(booking_id):
    if booking_id in bookings:
        return jsonify(bookings[booking_id])
    
    # For demo, generate a mock booking if it doesn't exist
    mock_booking = {
        "bookingId": booking_id,
        "parkingName": "Demo Parking Center",
        "slotNumber": "A12",
        "slotType": "standard",
        "floor": 1,
        "duration": 2,
        "rate": 50,
        "totalCost": 100,
        "bookingTime": datetime.datetime.now().isoformat(),
        "startTime": datetime.datetime.now().isoformat(),
        "endTime": (datetime.datetime.now() + datetime.timedelta(hours=2)).isoformat()
    }
    
    return jsonify(mock_booking)

@app.route('/api/bookings/<booking_id>', methods=['DELETE'])
def cancel_booking(booking_id):
    if booking_id in bookings:
        del bookings[booking_id]
    
    return jsonify({
        "success": True,
        "message": "Booking cancelled successfully"
    })

@app.route('/api/bookings/<booking_id>/ticket', methods=['GET'])
def get_ticket(booking_id):
    if booking_id in bookings:
        return jsonify({
            "ticketId": f"T{booking_id[2:]}",
            **bookings[booking_id]
        })
    
    # For demo, generate a mock ticket if it doesn't exist
    mock_ticket = {
        "ticketId": f"T{booking_id[2:] if booking_id.startswith('BK') else booking_id}",
        "bookingId": booking_id,
        "parkingName": "Demo Parking Center",
        "slotNumber": "A12",
        "slotType": "standard",
        "floor": 1,
        "duration": 2,
        "rate": 50,
        "totalCost": 100,
        "bookingTime": datetime.datetime.now().isoformat(),
        "startTime": datetime.datetime.now().isoformat(),
        "endTime": (datetime.datetime.now() + datetime.timedelta(hours=2)).isoformat()
    }
    
    return jsonify(mock_ticket)

# Simple web UI for video feed
@app.route('/')
def index():
    return """
    <html>
      <head>
        <title>Parking CV System</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f2f5;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563eb;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .video-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
          }
          h1 {
            margin: 0;
            font-size: 24px;
          }
          h2 {
            color: #2563eb;
            margin-top: 0;
          }
          .status {
            font-size: 16px;
            background-color: rgba(255,255,255,0.2);
            padding: 8px 15px;
            border-radius: 20px;
          }
          .video-feed {
            width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          .api-info {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
          }
          .api-link {
            display: block;
            margin: 10px 0;
            color: #2563eb;
            text-decoration: none;
          }
          .api-link:hover {
            text-decoration: underline;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Parking Computer Vision System</h1>
            <div class="status">Streaming Live</div>
          </div>
          
          <div class="video-container">
            <h2>Real-time Parking Detection</h2>
            <img src="/video_feed" class="video-feed">
          </div>
          
          <div class="api-info">
            <h2>API Endpoints</h2>
            <p>The following REST API endpoints are available:</p>
            <a href="/api/parking" class="api-link" target="_blank">GET /api/parking - List all parking spots</a>
            <a href="/api/parking/1/slots" class="api-link" target="_blank">GET /api/parking/1/slots - Get slots for parking ID 1 (CV based)</a>
            <a href="/api/parking/1/availability" class="api-link" target="_blank">GET /api/parking/1/availability - Get availability for parking ID 1</a>
            
            <p>Frontend is available at: <a href="http://localhost:3001" target="_blank">http://localhost:3001</a></p>
          </div>
          
          <div class="footer">
            <p>Parking Management System with Computer Vision</p>
          </div>
        </div>
      </body>
    </html>
    """

if __name__ == '__main__':
    # Start the video processing in a separate thread
    video_thread = threading.Thread(target=process_video)
    video_thread.daemon = True
    video_thread.start()
    
    # Wait a bit for the thread to start
    time.sleep(1)
    
    # Run the Flask app
    app.run(debug=True, port=5000, threaded=True) 