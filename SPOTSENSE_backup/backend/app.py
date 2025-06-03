from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import pickle
import json
from datetime import datetime
import threading
import time
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

# Constants
CARPARKPOS_PATH = os.path.join(os.path.dirname(__file__), 'CarParkPos')
UNIQUEID_PATH = os.path.join(os.path.dirname(__file__), 'UniqueID')
VIDEO_PATH = os.path.join(os.path.dirname(__file__), 'carPark.mp4')
REVERSE_VIDEO_PATH = os.path.join(os.path.dirname(__file__), 'carPark_Reverse.mp4')

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
global_grayscale_frame = None
global_threshold_frame = None
global_dilated_frame = None
video_lock = threading.Lock()
current_video_source = VIDEO_PATH
show_processing_steps = False
processing_mode = "full"  # "full" or "lite" mode for performance
skip_frames = 2  # Skip frames to reduce CPU load

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
        
        # Create slot data
        parking_data["slots"] = []  # Reset slots
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
                "x": pos[0],
                "y": pos[1],
                "last_updated": datetime.now().isoformat()
            }
        
        print(f"Loaded {len(positions)} parking spaces successfully")
        return True
    except Exception as e:
        print(f"Error loading parking configuration: {e}")
        return False

# API routes
@app.route('/api/parking/status', methods=['GET'])
def get_parking_status():
    """Return the current parking status"""
    return jsonify({
        "total": parking_data["total_spaces"],
        "available": parking_data["available_spaces"],
        "occupied": parking_data["occupied_spaces"],
        "last_updated": datetime.now().isoformat()
    })

@app.route('/api/parking/slots', methods=['GET'])
def get_parking_slots():
    """Return all parking slots with their status"""
    return jsonify(parking_data["slots"])

@app.route('/api/parking/spaces', methods=['GET'])
def get_parking_spaces():
    """Return data for all parking spaces in a format compatible with the frontend"""
    spaces = {}
    for slot in parking_data["slots"]:
        spaces[slot["id"]] = {
            "id": slot["id"],
            "status": slot["status"],
            "x": parking_status[slot["id"]]["x"],
            "y": parking_status[slot["id"]]["y"]
        }
    
    return jsonify({
        'total': parking_data["total_spaces"],
        'available': parking_data["available_spaces"],
        'lastUpdated': datetime.now().isoformat(),
        'spaces': spaces
    })

@app.route('/api/parking/slots/<slot_id>', methods=['GET'])
def get_slot_info(slot_id):
    """Return information about a specific parking slot"""
    for slot in parking_data["slots"]:
        if slot["id"] == slot_id:
            return jsonify(slot)
    return jsonify({"error": "Slot not found"}), 404

@app.route('/api/parking/slots/<slot_id>/status', methods=['PUT'])
def update_slot_status(slot_id):
    """Update the status of a specific parking slot"""
    data = request.json
    if not data or "status" not in data:
        return jsonify({"error": "Missing status in request"}), 400
    
    status = data["status"]
    if status not in ["available", "occupied", "reserved"]:
        return jsonify({"error": "Invalid status value"}), 400
    
    for slot in parking_data["slots"]:
        if slot["id"] == slot_id:
            old_status = slot["status"]
            slot["status"] = status
            slot["last_updated"] = datetime.now().isoformat()
            
            # Update counters
            if old_status == "available" and status != "available":
                parking_data["available_spaces"] -= 1
                if status == "occupied":
                    parking_data["occupied_spaces"] += 1
            elif old_status != "available" and status == "available":
                parking_data["available_spaces"] += 1
                if old_status == "occupied":
                    parking_data["occupied_spaces"] -= 1
            
            # Update parking status
            parking_status[slot_id]["occupied"] = (status == "occupied")
            parking_status[slot_id]["last_updated"] = datetime.now().isoformat()
            
            return jsonify({"success": True, "message": f"Slot {slot_id} status updated to {status}"})
    
    return jsonify({"error": "Slot not found"}), 404

@app.route('/api/parking/reset', methods=['POST'])
def reset_parking_data():
    """Reset all parking slots to available"""
    for slot in parking_data["slots"]:
        slot["status"] = "available"
        slot["last_updated"] = datetime.now().isoformat()
    
    # Reset counters
    parking_data["available_spaces"] = parking_data["total_spaces"]
    parking_data["occupied_spaces"] = 0
    
    # Reset status
    for slot_id in parking_status:
        parking_status[slot_id]["occupied"] = False
        parking_status[slot_id]["last_updated"] = datetime.now().isoformat()
    
    return jsonify({"success": True, "message": "All parking slots reset to available"})

@app.route('/api/parking/video/select', methods=['POST'])
def select_video_source():
    """Select a different video source"""
    global current_video_source
    data = request.json
    if not data or "source" not in data:
        return jsonify({"error": "Missing source in request"}), 400
    
    source = data["source"]
    if source == "main":
        current_video_source = VIDEO_PATH
    elif source == "reverse":
        current_video_source = REVERSE_VIDEO_PATH
    else:
        return jsonify({"error": "Invalid source value"}), 400
    
    # Restart video thread to use new source
    restart_video_thread()
    
    return jsonify({
        "success": True,
        "message": f"Video source changed to {source}",
        "current_source": source
    })

@app.route('/api/parking/video/mode', methods=['POST'])
def set_processing_mode():
    """Set processing mode for performance vs quality"""
    global processing_mode, skip_frames
    data = request.json
    if not data:
        return jsonify({"error": "Missing data in request"}), 400
    
    if "mode" in data:
        mode = data["mode"]
        if mode in ["full", "lite"]:
            processing_mode = mode
        else:
            return jsonify({"error": "Invalid mode value"}), 400
    
    if "skip_frames" in data:
        try:
            frames = int(data["skip_frames"])
            if 0 <= frames <= 10:  # Limit to reasonable values
                skip_frames = frames
            else:
                return jsonify({"error": "skip_frames must be between 0 and 10"}), 400
        except ValueError:
            return jsonify({"error": "skip_frames must be an integer"}), 400
    
    return jsonify({
        "success": True,
        "processing_mode": processing_mode,
        "skip_frames": skip_frames
    })

@app.route('/api/parking/video/debug', methods=['POST'])
def toggle_debug_mode():
    """Toggle showing processing steps"""
    global show_processing_steps
    data = request.json
    if not data or "enabled" not in data:
        return jsonify({"error": "Missing enabled flag in request"}), 400
    
    show_processing_steps = bool(data["enabled"])
    
    return jsonify({
        "success": True,
        "debug_mode": show_processing_steps
    })

@app.route('/api/parking/video/sources', methods=['GET'])
def get_video_sources():
    """Return available video sources"""
    sources = [
        {"id": "main", "name": "Main Parking", "path": VIDEO_PATH},
        {"id": "reverse", "name": "Reverse Angle", "path": REVERSE_VIDEO_PATH}
    ]
    
    return jsonify({
        "current": "main" if current_video_source == VIDEO_PATH else "reverse",
        "available": sources
    })

@app.route('/api/parking/video/status', methods=['GET'])
def video_status():
    """Check video processing status"""
    return jsonify({
        "running": video_thread.is_alive(),
        "current_source": "main" if current_video_source == VIDEO_PATH else "reverse",
        "processing_mode": processing_mode,
        "skip_frames": skip_frames,
        "debug_mode": show_processing_steps
    })

def restart_video_thread():
    """Restart the video processing thread"""
    global video_thread
    # Create a new thread - the old one will terminate naturally
    new_thread = threading.Thread(target=video_processing_thread)
    new_thread.daemon = True
    new_thread.start()
    video_thread = new_thread

def process_frame(frame):
    """Process a video frame and update parking status"""
    global parking_data, parking_status, global_grayscale_frame, global_threshold_frame, global_dilated_frame

    # Create copies for different visualization stages
    original_frame = frame.copy()
    
    # Convert to grayscale and apply image processing
    imgGray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    imgBlur = cv2.GaussianBlur(imgGray, (3, 3), 1)
    imgThreshold = cv2.adaptiveThreshold(
        imgBlur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
    imgMedian = cv2.medianBlur(imgThreshold, 5)
    kernel = np.ones((3, 3), np.uint8)
    imgDilate = cv2.dilate(imgMedian, kernel, iterations=1)
    
    # Save the processing steps for debug visualization
    global_grayscale_frame = imgGray.copy()
    global_threshold_frame = imgThreshold.copy()
    global_dilated_frame = imgDilate.copy()
    
    # Create colored versions of grayscale images for visualization
    imgGrayColored = cv2.cvtColor(imgGray, cv2.COLOR_GRAY2BGR)
    imgThresholdColored = cv2.cvtColor(imgThreshold, cv2.COLOR_GRAY2BGR)
    imgDilateColored = cv2.cvtColor(imgDilate, cv2.COLOR_GRAY2BGR)
    
    # Count available spots
    available_count = 0
    occupied_count = 0
    
    # Draw rectangles and update status for each parking spot
    for slot in parking_data["slots"]:
        slot_id = slot["id"]
        x = parking_status[slot_id]["x"]
        y = parking_status[slot_id]["y"]
        
        # Extract the region of interest
        if y+height <= imgDilate.shape[0] and x+width <= imgDilate.shape[1]:
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
            
            # Draw rectangle on all visualization frames
            cv2.rectangle(frame, (x, y), (x+width, y+height), color, 3)
            cv2.rectangle(imgGrayColored, (x, y), (x+width, y+height), color, 2)
            cv2.rectangle(imgThresholdColored, (x, y), (x+width, y+height), color, 2)
            cv2.rectangle(imgDilateColored, (x, y), (x+width, y+height), color, 2)
            
            # Add text - only in full processing mode to save CPU
            if processing_mode == "full":
                cv2.putText(frame, f"{slot_id}:{count}", (x+5, y+20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
    
    # Update parking data counts
    parking_data["available_spaces"] = available_count
    parking_data["occupied_spaces"] = occupied_count
    
    # If debug mode is on, show all processing steps
    if show_processing_steps:
        # Combine all visualizations into a single frame
        # Resize all frames to the same size for consistent layout
        h, w = frame.shape[:2]
        imgGrayColored = cv2.resize(imgGrayColored, (w//2, h//2))
        imgThresholdColored = cv2.resize(imgThresholdColored, (w//2, h//2))
        imgDilateColored = cv2.resize(imgDilateColored, (w//2, h//2))
        frame_resized = cv2.resize(frame, (w//2, h//2))
        
        # Create a 2x2 grid of images
        top_row = np.hstack((frame_resized, imgGrayColored))
        bottom_row = np.hstack((imgThresholdColored, imgDilateColored))
        combined_frame = np.vstack((top_row, bottom_row))
        
        # Add labels to each quadrant
        cv2.putText(combined_frame, "Original with Detection", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        cv2.putText(combined_frame, "Grayscale", (w//2 + 10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        cv2.putText(combined_frame, "Threshold", (10, h//2 + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        cv2.putText(combined_frame, "Dilated", (w//2 + 10, h//2 + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        
        # Add status overlay
        status_text = f"Available: {available_count}/{available_count + occupied_count}"
        cv2.putText(combined_frame, status_text, (10, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        
        return combined_frame
    else:
        # Just return the main frame with detection rectangles
        # Add status overlay to main view
        status_text = f"Available: {available_count}/{available_count + occupied_count}"
        cv2.putText(frame, status_text, (10, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        return frame

def video_processing_thread():
    """Background thread for video processing"""
    global global_frame, global_processed_frame, current_video_source
    
    print(f"Starting video processing thread with source: {current_video_source}...")
    cap = cv2.VideoCapture(current_video_source)
    
    if not cap.isOpened():
        print(f"Error: Could not open video file at {current_video_source}")
        # Try alternate path or camera
        alternate_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), os.path.basename(current_video_source))
        print(f"Trying alternate path: {alternate_path}")
        cap = cv2.VideoCapture(alternate_path)
        if not cap.isOpened():
            print("Still couldn't open video. Trying camera...")
            cap = cv2.VideoCapture(0)  # Try default camera
            if not cap.isOpened():
                print("Could not open any video source. Video feed will not be available.")
                return
    
    print(f"Video opened successfully: {cap.isOpened()}")
    
    # Optimize video settings
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)  # Increase buffer slightly for smoother playback
    
    # Initial frame processing to avoid cold start lag
    success, frame = cap.read()
    if success:
        # Reduce frame size for faster processing
        frame = cv2.resize(frame, (640, 480))
        
        with video_lock:
            processed_frame = process_frame(frame.copy())
            global_frame = frame.copy()
            global_processed_frame = processed_frame
    
    frame_count = 0
    current_skip_frames = skip_frames  # Use the global setting
    
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
            
            # Check if the video source has changed
            if current_video_source != cap.get(cv2.CAP_PROP_POS_AVI_RATIO):
                print("Video source changed, restarting thread...")
                break
                
            # Skip frames to improve performance
            frame_count += 1
            if frame_count % (current_skip_frames + 1) != 0:
                continue
                
            # Reduce frame size for faster processing
            frame = cv2.resize(frame, (640, 480))
                
            # Process the frame and update parking status
            start_time = time.time()
            with video_lock:
                processed_frame = process_frame(frame.copy())
                global_frame = frame.copy()
                global_processed_frame = processed_frame
            
            # Adaptive frame skipping based on processing time
            process_time = time.time() - start_time
            if process_time > 0.1 and current_skip_frames < 4:
                current_skip_frames += 1
                print(f"Processing too slow ({process_time:.3f}s), increasing skip frames to {current_skip_frames}")
            elif process_time < 0.05 and current_skip_frames > 0:
                current_skip_frames -= 1
                print(f"Processing faster ({process_time:.3f}s), decreasing skip frames to {current_skip_frames}")
            
            # Dynamic sleep time based on processing time
            sleep_time = max(0.01, 0.1 - process_time)
            time.sleep(sleep_time)
            
        except Exception as e:
            print(f"Error in video processing: {e}")
            time.sleep(0.5)

@app.route('/api/parking/video', methods=['GET'])
def video_feed():
    """Stream the processed video as MJPEG"""
    def generate_frames():
        while True:
            with video_lock:
                if global_processed_frame is None:
                    time.sleep(0.1)
                    continue
                
                # Make a copy of the frame to avoid lock contention
                current_frame = global_processed_frame.copy()
            
            try:
                # No need to resize again as we've already done this in the processing thread
                
                # Add timestamp to frame
                cv2.putText(
                    current_frame,
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 255),
                    2
                )
                
                # Encode frame with lower quality to improve performance
                encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 80]
                _, buffer = cv2.imencode('.jpg', current_frame, encode_param)
                frame = buffer.tobytes()
                
                # Yield frame in multipart response format
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                
                # Shorter delay for more responsive streaming
                time.sleep(0.03)  # Slightly faster rate
            except Exception as e:
                print(f"Error generating frame: {e}")
                time.sleep(0.1)
    
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/parking/video/raw', methods=['GET'])
def raw_video_feed():
    """Stream the original unprocessed video"""
    def generate_raw_frames():
        while True:
            with video_lock:
                if global_frame is None:
                    time.sleep(0.1)
                    continue
                
                # Make a copy of the frame to avoid lock contention
                current_frame = global_frame.copy()
            
            try:
                # Encode frame with better quality
                encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
                _, buffer = cv2.imencode('.jpg', current_frame, encode_param)
                frame = buffer.tobytes()
                
                # Yield frame in multipart response format
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                
                time.sleep(0.03)
            except Exception as e:
                print(f"Error generating raw frame: {e}")
                time.sleep(0.1)
    
    return Response(generate_raw_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/parking/video/grayscale', methods=['GET'])
def grayscale_video_feed():
    """Stream the grayscale processed video"""
    def generate_grayscale_frames():
        while True:
            with video_lock:
                if global_grayscale_frame is None:
                    time.sleep(0.1)
                    continue
                
                # Make a copy of the frame to avoid lock contention
                current_frame = global_grayscale_frame.copy()
            
            try:
                # Convert to color for display consistency
                current_frame = cv2.cvtColor(current_frame, cv2.COLOR_GRAY2BGR)
                
                # Encode frame
                encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 80]
                _, buffer = cv2.imencode('.jpg', current_frame, encode_param)
                frame = buffer.tobytes()
                
                # Yield frame in multipart response format
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                
                time.sleep(0.03)
            except Exception as e:
                print(f"Error generating grayscale frame: {e}")
                time.sleep(0.1)
    
    return Response(generate_grayscale_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/parking/video/threshold', methods=['GET'])
def threshold_video_feed():
    """Stream the threshold processed video"""
    def generate_threshold_frames():
        while True:
            with video_lock:
                if global_threshold_frame is None:
                    time.sleep(0.1)
                    continue
                
                # Make a copy of the frame to avoid lock contention
                current_frame = global_threshold_frame.copy()
            
            try:
                # Convert to color for display consistency
                current_frame = cv2.cvtColor(current_frame, cv2.COLOR_GRAY2BGR)
                
                # Encode frame
                encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 80]
                _, buffer = cv2.imencode('.jpg', current_frame, encode_param)
                frame = buffer.tobytes()
                
                # Yield frame in multipart response format
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                
                time.sleep(0.03)
            except Exception as e:
                print(f"Error generating threshold frame: {e}")
                time.sleep(0.1)
    
    return Response(generate_threshold_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })

# Also add the same endpoint under /api for consistency
@app.route('/api/health', methods=['GET'])
def api_health_check():
    """API health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })

# Initialize parking data on startup
if not load_parking_configuration():
    print("Warning: Failed to load initial parking configuration")

# Start video processing thread
video_thread = threading.Thread(target=video_processing_thread)
video_thread.daemon = True  # Thread will exit when main program exits
video_thread.start()

if __name__ == '__main__':
    try:
        print("="*50)
        print("Starting unified backend server on port 5000...")
        print("Server URL: http://localhost:5000")
        print("Health endpoint: http://localhost:5000/health")
        print("API Health endpoint: http://localhost:5000/api/health")
        print("Video Feed: http://localhost:5000/api/parking/video")
        print("Video Sources: http://localhost:5000/api/parking/video/sources")
        print("Processing Debug Mode: http://localhost:5000/api/parking/video/debug")
        print("="*50)
        
        # Update CORS configuration to be more permissive
        CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
        
        # Run with host set to 0.0.0.0 to allow external connections
        app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
    except Exception as e:
        print(f"ERROR STARTING SERVER: {e}")
        import traceback
        traceback.print_exc() 