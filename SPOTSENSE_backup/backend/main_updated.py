import cv2
import pickle
import numpy as np
import os
import sys

print("Python version:", sys.version)
print("OpenCV version:", cv2.__version__)
print("NumPy version:", np.__version__)

def put_text_with_background(img, text, position, scale=1, thickness=1, text_color=(0, 0, 0), bg_color=(255, 255, 255)):
    # Get text size
    (text_width, text_height), baseline = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, scale, thickness)
    
    # Calculate background rectangle coordinates
    x, y = position
    bg_rect = [x, y - text_height, x + text_width, y + baseline]
    
    # Draw background rectangle
    cv2.rectangle(img, (bg_rect[0], bg_rect[1]), (bg_rect[2], bg_rect[3]), bg_color, -1)
    
    # Draw text
    cv2.putText(img, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX, scale, text_color, thickness)

# Video feed
print("Starting main script...")

# Define absolute paths for consistency
carparkpos_path = os.path.join(os.path.dirname(__file__), 'CarParkPos')
uniqueid_path = os.path.join(os.path.dirname(__file__), 'UniqueID')
video_path = os.path.join(os.path.dirname(__file__), 'carPark.mp4')

print(f"Looking for video at: {video_path}")
print(f"File exists: {os.path.exists(video_path)}")

# Set to False to use the uploaded video file instead of camera
use_camera = False
if use_camera:
    cap = cv2.VideoCapture(0)
    print("Using live camera feed")
else:
    cap = cv2.VideoCapture(video_path)
    print(f"Video path: {video_path}")
    print(f"Video opened successfully: {cap.isOpened()}")
    if not cap.isOpened():
        print("Error: Could not open video file")
        sys.exit(1)

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
    
    temps = {}
    for i, pos in enumerate(posList):
        if i < len(UniqueID):
            temps[pos] = UniqueID[i]
        else:
            temps[pos] = i
    print(f"Created mapping for {len(temps)} parking spaces")
except Exception as e:
    print(f"Error loading UniqueID, creating new mapping: {e}")
    temps = {}
    for i, pos in enumerate(posList):
        temps[pos] = i
    print(f"Created fallback mapping for {len(temps)} parking spaces")

width, height = 107, 48
counter = set()
li = list(range(69))
xi = [True] * len(li)
dicto = dict(zip(li, xi))

def checkParkingSpace(imgPro):
    spaceCounter = 0
    for pos in posList:
        x, y = pos
        imgCrop = imgPro[y:y + height, x:x + width]
        count = cv2.countNonZero(imgCrop)

        if count < 850:
            color = (0, 255, 0)  # GREEN
            thickness = 3
            spaceCounter += 1
            if temps[pos] not in counter:
                counter.add(temps[pos])
        else:
            color = (0, 0, 255)  # RED
            thickness = 3
            if temps[pos] in counter:
                counter.remove(temps[pos])

        # Draw rectangle
        cv2.rectangle(img, pos, (pos[0] + width, pos[1] + height), color, thickness)
        
        # Draw count
        put_text_with_background(img, str(count), (x, y + height - 3))
        
        # Draw ID
        put_text_with_background(img, str(temps[pos]), (x+1, y + height - 34), thickness=2)
        
        # Draw status
        if temps[pos] in counter:
            put_text_with_background(img, "Free", (x+width-40, y + height))
        else:
            put_text_with_background(img, "Parked", (x+width-60, y + height-3))

    # Draw space counter
    put_text_with_background(img, f'Free: {spaceCounter}/{len(posList)}', (100, 50), 
                           scale=3, thickness=5, text_color=(0, 200, 0))
    print(f"Free spaces: {spaceCounter}/{len(posList)}")

print("Starting main loop...")
while True:
    print("Processing frame...")
    if not use_camera:
        if cap.get(cv2.CAP_PROP_POS_FRAMES) == cap.get(cv2.CAP_PROP_FRAME_COUNT):
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    
    success, img = cap.read()
    if not success:
        print("Failed to read frame")
        break
        
    original_img = img.copy()
    imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    imgBlur = cv2.GaussianBlur(imgGray, (3, 3), 1)
    imgThreshold = cv2.adaptiveThreshold(
        imgBlur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
    imgMedian = cv2.medianBlur(imgThreshold, 5)
    kernel = np.ones((3, 3), np.uint8)
    imgDilate = cv2.dilate(imgMedian, kernel, iterations=1)

    checkParkingSpace(imgDilate)

    cv2.imshow("Original", original_img)
    cv2.imshow("Grayscale", imgGray)
    cv2.imshow("Threshold", imgThreshold)
    
    img_resized = cv2.resize(img, (800, 600))
    cv2.imshow("Processed Image", img_resized)
    
    key = cv2.waitKey(15)
    if key & 0xFF == ord('d'):
        print("Empty are :", counter, "Total=", len(counter))
        break
    elif key & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("Script completed successfully") 