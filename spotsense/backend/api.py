from flask import Flask, jsonify, request, make_response, Response
from flask_cors import CORS
import json
import pickle
import os
import random
import datetime
from database import authenticate_user, create_user, UserAuth
import cv2
import numpy as np
from collections import defaultdict
import time
import math
import threading
import argparse

# Parse command line arguments
parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=5001, help='Port to run the server on')
args = parser.parse_args()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables to store parking data
parking_data = {
    'total_spaces': 0,
    'available_spaces': 0,
    'last_updated': None,
    'spaces': {}  # Will hold status for each individual space
}

# Define absolute paths for consistency
carparkpos_path = os.path.join(os.path.dirname(__file__), 'CarParkPos')
uniqueid_path = os.path.join(os.path.dirname(__file__), 'UniqueID')
video_path = os.path.join(os.path.dirname(__file__), 'carPark.mp4')

# Load position list
try:
    with open(carparkpos_path, 'rb') as f:
        posList = pickle.load(f)
    print(f"Loaded {len(posList)} parking spaces from {carparkpos_path}")
except Exception as e:
    print(f"Error loading CarParkPos: {e}")
    posList = []

# Load unique IDs if available
try:
    with open(uniqueid_path, 'rb') as f:
        UniqueID = pickle.load(f)
    print(f"Loaded {len(UniqueID)} unique IDs from {uniqueid_path}")
    
    # Create temps dictionary based on the UniqueID
    temps = {}
    for i, pos in enumerate(posList):
        if i < len(UniqueID):
            temps[pos] = UniqueID[i]
        else:
            temps[pos] = i
    print(f"Created mapping for {len(temps)} parking spaces")
except Exception as e:
    print(f"Error loading UniqueID, creating new mapping: {e}")
    # Create a temporary dictionary for IDs with fixed indices
    temps = {}
    for i, pos in enumerate(posList):
        temps[pos] = i
    print(f"Created fallback mapping for {len(temps)} parking spaces")

# Initialize parking data
parking_data['total_spaces'] = len(posList)
parking_data['spaces'] = {str(i): {"id": i, "status": "unknown", "x": 0, "y": 0} for i in range(len(posList))}

# Update coordinates in the spaces dictionary
for pos in posList:
    space_id = temps[pos]
    if str(space_id) in parking_data['spaces']:
        parking_data['spaces'][str(space_id)]['x'] = pos[0]
        parking_data['spaces'][str(space_id)]['y'] = pos[1]

# Parameters for space detection
width, height = 107, 48

def check_parking_space(img_pro):
    """Process image and update parking data"""
    space_counter = 0
    available_spaces = []
    
    for pos in posList:
        x, y = pos
        space_id = str(temps[pos])
        
        # Image cropping and counting non-zero pixels
        img_crop = img_pro[y:y + height, x:x + width]
        count = cv2.countNonZero(img_crop)
        
        # Update space status
        if count < 850:  # Space is available
            space_counter += 1
            available_spaces.append(space_id)
            parking_data['spaces'][space_id]['status'] = 'available'
        else:  # Space is occupied
            parking_data['spaces'][space_id]['status'] = 'occupied'

    # Update global parking data
    parking_data['available_spaces'] = space_counter
    parking_data['last_updated'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    return space_counter

def process_video_frame():
    """Process a single frame from the video source"""
    # Use video file for now
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"Error: Could not open video source {video_path}")
        return
    
    # Read a frame
    success, img = cap.read()
    if not success:
        print("Failed to read frame")
        cap.release()
        return
    
    # Process the frame
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img_blur = cv2.GaussianBlur(img_gray, (3, 3), 1)
    img_threshold = cv2.adaptiveThreshold(
        img_blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
    img_median = cv2.medianBlur(img_threshold, 5)
    kernel = np.ones((3, 3), np.uint8)
    img_dilate = cv2.dilate(img_median, kernel, iterations=1)
    
    # Check parking spaces
    check_parking_space(img_dilate)
    
    # Clean up
    cap.release()

# Background thread for continuous processing
def background_processing():
    """Background thread to continuously update parking data"""
    while True:
        process_video_frame()
        time.sleep(5)  # Update every 5 seconds

# Start the background thread when the app starts
bg_thread = threading.Thread(target=background_processing)
bg_thread.daemon = True  # Thread will close when main program exits
bg_thread.start()

@app.route('/api/parking/spaces', methods=['GET'])
def get_parking_spaces():
    """Return data for all parking spaces"""
    return jsonify({
        'total': parking_data['total_spaces'],
        'available': parking_data['available_spaces'],
        'lastUpdated': parking_data['last_updated'],
        'spaces': parking_data['spaces']
    })

@app.route('/api/parking/space/<space_id>', methods=['GET'])
def get_parking_space(space_id):
    """Return data for a specific parking space"""
    if space_id in parking_data['spaces']:
        return jsonify(parking_data['spaces'][space_id])
    else:
        return jsonify({'error': 'Space not found'}), 404

@app.route('/api/parking/status', methods=['GET'])
def get_parking_status():
    """Return summary status of parking lot"""
    return jsonify({
        'total': parking_data['total_spaces'],
        'available': parking_data['available_spaces'],
        'lastUpdated': parking_data['last_updated'],
        'occupancyRate': round((1 - parking_data['available_spaces'] / max(parking_data['total_spaces'], 1)) * 100, 1)
    })

@app.route('/api/parking/refresh', methods=['POST'])
def refresh_parking_data():
    """Force refresh of parking data"""
    process_video_frame()
    return jsonify({'status': 'success', 'message': 'Parking data refreshed'})

# Mock data
parking_spots = [
    {
        "id": "1",
        "name": "Central Parking",
        "address": "123 Main Street, City Center",
        "latitude": 18.9902,
        "longitude": 72.8127,
        "totalSpots": 50,
        "availableSpots": 15,
        "hourlyRate": 50,
        "openingHours": "24/7",
        "ratings": 4.5,
        "amenities": ["CCTV", "EV Charging", "24/7 Security"]
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
        "ratings": 4.8,
        "amenities": ["CCTV", "Car Wash", "Valet", "EV Charging"]
    }
]

# Mock bookings data
bookings = {}

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

# Parking API endpoints
@app.route('/api/parking', methods=['GET'])
def get_all_parking_spots():
    return jsonify(parking_spots)

@app.route('/api/parking/nearby', methods=['GET'])
def get_nearby_parking_spots():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', default=5, type=float)
    
    # In a real app, you would filter based on location
    # For the demo, just return all spots
    return jsonify(parking_spots)

@app.route('/api/parking/<parking_id>/availability', methods=['GET'])
def get_parking_availability(parking_id):
    # In a real app, you would check real-time availability
    # For the demo, return random availability
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
    # Create mock slots data for the parking location
    slots = []
    
    # If we have real data from the computer vision system, use it
    if posList and temps:
        # In a real integration, we would map the computer vision data to slots
        # For now, create simulated data based on the posList
        floor_count = 3  # Simulate 3 floors
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
    else:
        # Fallback mock data
        floors = [1, 2, 3]
        rows = ['A', 'B', 'C', 'D']
        slots_per_row = 8
        
        for floor in floors:
            for row in rows:
                for i in range(1, slots_per_row + 1):
                    # Create a pattern of availability
                    is_available = (floor * 10 + i) % 3 != 0
                    
                    # Determine special slot types based on position
                    slot_type = 'standard'
                    if i == 1 or i == slots_per_row:
                        slot_type = 'handicapped'
                    elif row == 'A' and (i == 3 or i == 4):
                        slot_type = 'large'
                    elif row == 'C' and (i == 5 or i == 6):
                        slot_type = 'electric'
                    
                    slots.append({
                        "id": f"{parking_id}-{floor}-{row}{i}",
                        "number": f"{row}{i}",
                        "isAvailable": is_available,
                        "type": slot_type,
                        "floor": floor,
                        "row": row,
                        "position": i
                    })
    
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

# Route to serve video feed
@app.route('/api/video_feed/<video_name>', methods=['GET'])
def video_feed(video_name):
    def generate_frames(video_path):
        cap = cv2.VideoCapture(video_path)
        frame_count = 0
        
        while True:
            success, frame = cap.read()
            if not success:
                # If the video ends, reset to beginning
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            
            # Only process every 15 frames (approximately 0.5 seconds at 30fps)
            frame_count += 1
            if frame_count % 15 != 0:
                continue
                
            # Process the frame to detect parking slots
            processed_frame = process_frame_for_slots(frame)
            
            # Convert frame to JPEG image
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            frame_bytes = buffer.tobytes()
            
            # Yield the frame in multipart response format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            # Add a delay to slow down processing (0.5-1 second)
            time.sleep(0.5)  # Adjust this value between 0.5-1 for desired speed

    if video_name == 'parking':
        video_path = os.path.join(os.path.dirname(__file__), 'carPark.mp4')
    elif video_name == 'parking_reverse':
        video_path = os.path.join(os.path.dirname(__file__), 'carPark_Reverse.mp4')
    else:
        return jsonify({"error": "Video not found"}), 404
    
    return Response(generate_frames(video_path),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

def process_frame_for_slots(frame):
    """Process a video frame to detect and highlight parking slots."""
    # Create a copy to draw on
    processed_frame = frame.copy()
    
    # Convert to grayscale for processing
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 1)
    threshold = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                    cv2.THRESH_BINARY_INV, 25, 16)
    median = cv2.medianBlur(threshold, 5)
    dilated = cv2.dilate(median, np.ones((3, 3), np.uint8), iterations=1)
    
    # Draw slots based on posList with status
    width, height = 107, 48
    
    for i, pos in enumerate(posList):
        x, y = pos
        slot_id = temps.get(pos, i)
        
        # Extract the region of interest
        slot_img = dilated[y:y + height, x:x + width]
        
        # Check if the slot is empty or occupied
        if slot_img.size > 0:  # Make sure the slot is within the frame
            count = cv2.countNonZero(slot_img)
            is_free = count < 850  # Threshold for determining if slot is free
            
            # Draw rectangle with appropriate color
            color = (0, 255, 0) if is_free else (0, 0, 255)  # Green for free, Red for occupied
            cv2.rectangle(processed_frame, (x, y), (x + width, y + height), color, 2)
            
            # Add slot ID
            cv2.putText(processed_frame, str(slot_id), (x + 5, y + 20), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Add status text
            status_text = "FREE" if is_free else "OCCUPIED"
            cv2.putText(processed_frame, status_text, (x + 5, y + height - 5), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
    
    # Add frame metadata
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(processed_frame, f"LIVE: {timestamp}", (10, 30), 
              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    
    # Add location metadata for Mumbai
    cv2.putText(processed_frame, "Mumbai, Andheri East", (10, 60), 
              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    
    return processed_frame

# Route to get list of available video feeds
@app.route('/api/video_feeds', methods=['GET'])
def get_video_feeds():
    return jsonify([
        {
            "id": "parking",
            "name": "Main Parking Lot",
            "url": "/api/video_feed/parking"
        },
        {
            "id": "parking_reverse",
            "name": "Secondary Parking Lot",
            "url": "/api/video_feed/parking_reverse"
        }
    ])

# Route to get slots with video feed integrated
@app.route('/slots', methods=['GET'])
def get_slots():
    """Get all parking slots with their status based on the computer vision system."""
    # Generate mock slot data based on posList
    slots = []
    # Use base dimensions of a slot
    w, h = 107, 48
    
    for i, pos in enumerate(posList):
        x, y = pos
        slot_id = temps.get(pos, i)
        # Generate a deterministic status so it doesn't change on every request
        random.seed(slot_id)  # Use slot_id as seed for reproducibility
        status = "free" if random.random() > 0.5 else "occupied"
        
        slots.append({
            "id": str(slot_id),
            "x": x,
            "y": y,
            "width": w,
            "height": h,
            "status": status
        })
    
    return jsonify(slots)

@app.route('/api/parking/nearbyMumbai', methods=['GET'])
def get_nearby_parking_spots_mumbai():
    """Get parking spots in Mumbai filtered by distance to user location."""
    lat = request.args.get('lat', default=19.1136, type=float)  # Default to Andheri East
    lng = request.args.get('lng', default=72.8697, type=float)
    radius = request.args.get('radius', default=5, type=float)
    
    # Mumbai parking data with actual geolocation
    mumbai_parking_spots = [
        {
            "id": "1",
            "name": "Andheri East Station Parking",
            "address": "Andheri East Station, Mumbai 400069",
            "latitude": 19.1191,
            "longitude": 72.8476,
            "totalSpots": 50,
            "availableSpots": random.randint(10, 30),
            "hourlyRate": 50,
            "openingHours": "24/7",
            "ratings": 4.2,
            "amenities": ["CCTV", "Security Guard"]
        },
        {
            "id": "2",
            "name": "Infiniti Mall Parking",
            "address": "Infiniti Mall, Andheri West, Mumbai 400053",
            "latitude": 19.1362,
            "longitude": 72.8337,
            "totalSpots": 200,
            "availableSpots": random.randint(20, 100),
            "hourlyRate": 80,
            "openingHours": "10:00 AM - 10:00 PM",
            "ratings": 4.5,
            "amenities": ["CCTV", "EV Charging", "Car Wash"]
        },
        {
            "id": "3",
            "name": "JVLR Metro Parking",
            "address": "JVLR Metro Station, Andheri East, Mumbai 400093",
            "latitude": 19.1097,
            "longitude": 72.8794,
            "totalSpots": 80,
            "availableSpots": random.randint(5, 40),
            "hourlyRate": 40,
            "openingHours": "6:00 AM - 11:00 PM",
            "ratings": 3.8,
            "amenities": ["CCTV"]
        },
        {
            "id": "4",
            "name": "Juhu Beach Parking",
            "address": "Juhu Beach, Mumbai 400049",
            "latitude": 19.0883,
            "longitude": 72.8264,
            "totalSpots": 100,
            "availableSpots": random.randint(10, 50),
            "hourlyRate": 60,
            "openingHours": "24/7",
            "ratings": 3.5,
            "amenities": ["Beach Access", "Security"]
        }
    ]
    
    # Calculate distance for each spot from user location
    for spot in mumbai_parking_spots:
        # Calculate Haversine distance between two points
        dlat = math.radians(spot['latitude'] - lat)
        dlon = math.radians(spot['longitude'] - lng)
        a = (math.sin(dlat/2)**2 + 
             math.cos(math.radians(lat)) * math.cos(math.radians(spot['latitude'])) * math.sin(dlon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = 6371 * c  # Earth radius in km
        
        spot['distance'] = round(distance, 2)  # Distance in km
    
    # Filter spots within radius
    nearby_spots = [spot for spot in mumbai_parking_spots if spot['distance'] <= radius]
    
    # Sort by distance
    nearby_spots.sort(key=lambda spot: spot['distance'])
    
    return jsonify(nearby_spots)

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    })

if __name__ == '__main__':
    # Process an initial frame to have data ready
    process_video_frame()
    # Run the Flask app
    app.run(host='0.0.0.0', port=args.port, debug=True) 