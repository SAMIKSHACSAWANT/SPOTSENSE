from flask import Flask, jsonify, request, Response, render_template, redirect, url_for
import cv2
import cvzone
import numpy as np
import pickle
import os
import json
import threading
import time

app = Flask(__name__)

# Define paths
carparkpos_path = os.path.join(os.path.dirname(__file__), 'CarParkPos')
video_path = os.path.join(os.path.dirname(__file__), 'carPark.mp4')

# Static directory for storing images and data
static_dir = os.path.join(os.path.dirname(__file__), 'static')
templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
data_file = os.path.join(static_dir, 'parking_data.json')

# Create directories if they don't exist
os.makedirs(static_dir, exist_ok=True)
os.makedirs(templates_dir, exist_ok=True)
os.makedirs(os.path.join(static_dir, 'img'), exist_ok=True)

# Global variables
width, height = 107, 48
colorBlack = (0, 0, 0)
global_frame = None
global_processed_frame = None
parking_slots = []
slots_lock = threading.Lock()  # For thread-safe operations on parking_slots

# Load parking positions
try:
    with open(carparkpos_path, 'rb') as f:
        posList = pickle.load(f)
    print(f"Loaded {len(posList)} parking spaces from {carparkpos_path}")
    
    # Initialize parking slots data
    for i, pos in enumerate(posList):
        parking_slots.append({
            'id': i,
            'x': pos[0],
            'y': pos[1],
            'width': width,
            'height': height,
            'status': 'free'  # Initially all slots are free
        })
    
    # Save to JSON file
    with open(data_file, 'w') as f:
        json.dump(parking_slots, f)
    print(f"Saved parking data to {data_file}")
    
except Exception as e:
    print(f"Error loading parking data: {e}")
    posList = []

# Process the video frame and update parking slots
def process_frame(img):
    global parking_slots
    
    imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    imgBlur = cv2.GaussianBlur(imgGray, (3, 3), 1)
    imgThreshold = cv2.adaptiveThreshold(
        imgBlur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
    imgMedian = cv2.medianBlur(imgThreshold, 5)
    kernel = np.ones((3, 3), np.uint8)
    imgDilate = cv2.dilate(imgMedian, kernel, iterations=1)
    
    # Count free slots
    free_count = 0
    
    # Update each slot status based on image processing
    with slots_lock:
        for slot in parking_slots:
            x, y = slot['x'], slot['y']
            
            # Skip if manually booked
            if slot.get('booked', False):
                status = 'booked'
                color = (0, 0, 255)  # RED
            else:
                # Check if car is present using computer vision
                imgCrop = imgDilate[y:y + height, x:x + width]
                count = cv2.countNonZero(imgCrop)
                
                if count < 850:
                    status = 'free'
                    color = (0, 255, 0)  # GREEN
                    free_count += 1
                else:
                    status = 'parked'
                    color = (0, 0, 255)  # RED
            
            # Update slot status
            slot['status'] = status
            
            # Draw rectangle on image
            cv2.rectangle(img, (x, y), (x + width, y + height), color, 3)
            cvzone.putTextRect(img, str(slot['id']), (x+1, y + height - 25), scale=1.5,
                             thickness=2, offset=0, colorR=colorBlack)
            cvzone.putTextRect(img, status, (x+1, y + height - 5), scale=1,
                             thickness=1, offset=0, colorR=colorBlack)
    
    # Add count text
    total_slots = len(parking_slots)
    cvzone.putTextRect(img, f'Free: {free_count}/{total_slots}', (100, 50), scale=3,
                     thickness=5, offset=20, colorR=(0, 200, 0))
    
    # Save to JSON periodically
    save_data_to_json()
    
    return img, free_count, total_slots

# Save parking data to JSON file
def save_data_to_json():
    with slots_lock:
        with open(data_file, 'w') as f:
            json.dump(parking_slots, f)

# Video processing thread
def process_video():
    global global_frame, global_processed_frame
    
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
        
        # Process frame and update parking slots
        processed_img, _, _ = process_frame(img.copy())
        
        # Save current frame for streaming
        global_frame = img.copy()
        global_processed_frame = processed_img
        
        # Save a static image for the frontend every few seconds
        static_img_path = os.path.join(static_dir, 'img', 'current_frame.jpg')
        cv2.imwrite(static_img_path, processed_img)
        
        # Process at reduced rate to not overload the system
        time.sleep(0.1)

# Generate video frames for streaming
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

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/slots', methods=['GET'])
def get_slots():
    with slots_lock:
        return jsonify(parking_slots)

@app.route('/book/<int:slot_id>', methods=['POST'])
def book_slot(slot_id):
    with slots_lock:
        # Find the slot by ID
        for slot in parking_slots:
            if slot['id'] == slot_id:
                # Check if slot is already booked or parked
                if slot['status'] != 'free':
                    return jsonify({'success': False, 'message': f'Slot {slot_id} is not available'})
                
                # Mark as booked
                slot['status'] = 'booked'
                slot['booked'] = True
                save_data_to_json()
                return jsonify({'success': True, 'message': f'Slot {slot_id} booked successfully'})
        
        return jsonify({'success': False, 'message': f'Slot {slot_id} not found'}), 404

@app.route('/unbook/<int:slot_id>', methods=['POST'])
def unbook_slot(slot_id):
    with slots_lock:
        # Find the slot by ID
        for slot in parking_slots:
            if slot['id'] == slot_id:
                # Only unbook if it was booked
                if slot.get('booked', False):
                    slot['booked'] = False
                    slot['status'] = 'free'  # Will be updated by CV in next frame
                    save_data_to_json()
                    return jsonify({'success': True, 'message': f'Slot {slot_id} unbooked successfully'})
                
                return jsonify({'success': False, 'message': f'Slot {slot_id} was not booked'})
        
        return jsonify({'success': False, 'message': f'Slot {slot_id} not found'}), 404

if __name__ == '__main__':
    # Create HTML template
    with open(os.path.join(templates_dir, 'index.html'), 'w') as f:
        f.write('''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Parking System</title>
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
        h1 {
            color: #2563eb;
            text-align: center;
        }
        .status-bar {
            background-color: #2563eb;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .video-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
            position: relative;
        }
        .video-stream {
            width: 100%;
            border-radius: 5px;
            cursor: pointer;
        }
        .slots-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
        }
        .slot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
        }
        .slot {
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .slot-free {
            background-color: #d1fae5;
            color: #047857;
            border: 1px solid #047857;
        }
        .slot-parked, .slot-booked {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 1px solid #b91c1c;
        }
        .slot:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .booking-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            justify-content: center;
            align-items: center;
            z-index: 100;
        }
        .modal-content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            width: 350px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-right: 10px;
        }
        .btn-primary {
            background-color: #2563eb;
            color: white;
        }
        .btn-secondary {
            background-color: #9ca3af;
            color: white;
        }
        .btn-danger {
            background-color: #dc2626;
            color: white;
        }
        .modal-buttons {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
        }
        .legend {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
        }
        .legend-item {
            display: flex;
            align-items: center;
        }
        .legend-color {
            width: 20px;
            height: 20px;
            margin-right: 5px;
            border-radius: 3px;
        }
        .refresh-button {
            padding: 5px 10px;
            background-color: #2563eb;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Smart Parking System</h1>
        
        <div class="status-bar">
            <div id="status-count">Loading...</div>
            <div id="current-time"></div>
        </div>
        
        <div class="video-container">
            <img src="{{ url_for('video_feed') }}" class="video-stream" id="parking-video">
        </div>
        
        <div class="slots-container">
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #d1fae5; border: 1px solid #047857;"></div>
                    <span>Free</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #fee2e2; border: 1px solid #b91c1c;"></div>
                    <span>Occupied/Booked</span>
                </div>
            </div>
            
            <button class="refresh-button" onclick="loadSlots()">Refresh Slots</button>
            
            <div class="slot-grid" id="slot-grid">
                <!-- Slots will be loaded here -->
                <div class="loading">Loading slots...</div>
            </div>
        </div>
    </div>
    
    <!-- Booking Modal -->
    <div class="booking-modal" id="booking-modal">
        <div class="modal-content">
            <h2 id="modal-title">Book Parking Slot</h2>
            <p id="modal-message">Are you sure you want to book this slot?</p>
            <div class="modal-buttons">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" id="confirm-button" onclick="confirmAction()">Book Now</button>
            </div>
        </div>
    </div>
    
    <script>
        // Global variables
        let selectedSlot = null;
        let actionType = null; // 'book' or 'unbook'
        
        // Update current time
        function updateTime() {
            const now = new Date();
            document.getElementById('current-time').textContent = now.toLocaleTimeString();
        }
        setInterval(updateTime, 1000);
        updateTime();
        
        // Load slots from API
        function loadSlots() {
            fetch('/slots')
                .then(response => response.json())
                .then(data => {
                    const slotGrid = document.getElementById('slot-grid');
                    slotGrid.innerHTML = '';
                    
                    // Count free slots
                    const freeSlots = data.filter(slot => slot.status === 'free').length;
                    document.getElementById('status-count').textContent = `Free: ${freeSlots}/${data.length}`;
                    
                    // Create slot elements
                    data.forEach(slot => {
                        const slotElement = document.createElement('div');
                        slotElement.className = `slot slot-${slot.status}`;
                        slotElement.innerHTML = `
                            <h3>Slot ${slot.id}</h3>
                            <p>Status: ${slot.status}</p>
                        `;
                        
                        // Add click handler for booking/unbooking
                        slotElement.addEventListener('click', () => {
                            selectedSlot = slot;
                            if (slot.status === 'free') {
                                openBookingModal(slot);
                            } else if (slot.status === 'booked') {
                                openUnbookingModal(slot);
                            }
                        });
                        
                        slotGrid.appendChild(slotElement);
                    });
                })
                .catch(error => {
                    console.error('Error loading slots:', error);
                });
        }
        
        // Open booking modal
        function openBookingModal(slot) {
            document.getElementById('modal-title').textContent = `Book Slot ${slot.id}`;
            document.getElementById('modal-message').textContent = `Are you sure you want to book slot ${slot.id}?`;
            document.getElementById('confirm-button').textContent = 'Book Now';
            document.getElementById('confirm-button').className = 'btn btn-primary';
            actionType = 'book';
            document.getElementById('booking-modal').style.display = 'flex';
        }
        
        // Open unbooking modal
        function openUnbookingModal(slot) {
            document.getElementById('modal-title').textContent = `Unbook Slot ${slot.id}`;
            document.getElementById('modal-message').textContent = `Are you sure you want to unbook slot ${slot.id}?`;
            document.getElementById('confirm-button').textContent = 'Unbook';
            document.getElementById('confirm-button').className = 'btn btn-danger';
            actionType = 'unbook';
            document.getElementById('booking-modal').style.display = 'flex';
        }
        
        // Close modal
        function closeModal() {
            document.getElementById('booking-modal').style.display = 'none';
        }
        
        // Confirm booking/unbooking
        function confirmAction() {
            if (!selectedSlot) return;
            
            let url, successMessage;
            
            if (actionType === 'book') {
                url = `/book/${selectedSlot.id}`;
                successMessage = `Slot ${selectedSlot.id} booked successfully!`;
            } else if (actionType === 'unbook') {
                url = `/unbook/${selectedSlot.id}`;
                successMessage = `Slot ${selectedSlot.id} unbooked successfully!`;
            }
            
            fetch(url, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(successMessage);
                    loadSlots(); // Refresh the slots
                } else {
                    alert(`Error: ${data.message}`);
                }
                closeModal();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
                closeModal();
            });
        }
        
        // Initial load
        document.addEventListener('DOMContentLoaded', () => {
            loadSlots();
            // Refresh slots every few seconds
            setInterval(loadSlots, 5000);
        });
    </script>
</body>
</html>
        ''')
    
    # Start video processing thread
    video_thread = threading.Thread(target=process_video)
    video_thread.daemon = True
    video_thread.start()
    
    # Wait for thread to initialize
    time.sleep(1)
    
    # Start Flask app
    app.run(debug=True, port=5000, threaded=True) 