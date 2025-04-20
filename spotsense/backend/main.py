import cv2
import pickle
import cvzone
import numpy as np
from collections import defaultdict
# from database import CarInfo
import json
import os
import requests
import time
from datetime import datetime

# Video feed
print("main")

# Define absolute paths for consistency
carparkpos_path = os.path.join(os.path.dirname(__file__), 'CarParkPos')
uniqueid_path = os.path.join(os.path.dirname(__file__), 'UniqueID')

# API configuration
API_BASE_URL = "http://localhost:5000/api"
last_api_update = {}  # Track last update time for each slot

# Use relative path to the video file
video_path = os.path.join(os.path.dirname(__file__), 'carPark.mp4')

# Set to False to use the uploaded video file instead of camera
use_camera = False  # Changed to False to use the uploaded video project
if use_camera:
    cap = cv2.VideoCapture(0)  # Use default camera (change index if needed)
    print("Using live camera feed")
else:
    cap = cv2.VideoCapture(video_path)
    print(f"Video path: {video_path}")
    print(f"Video opened successfully: {cap.isOpened()}")

# Load position list - use exact same file as saved by ParkingSpacePicker
try:
    with open(carparkpos_path, 'rb') as f:
        posList = pickle.load(f)
    print(f"Loaded {len(posList)} parking spaces from {carparkpos_path}")
except Exception as e:
    print(f"Error loading CarParkPos: {e}")
    posList = []

# Load unique IDs if available - use exact same file as saved by ParkingSpacePicker
try:
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
except Exception as e:
    print(f"Error loading UniqueID, creating new mapping: {e}")
    # Create a temporary dictionary for IDs with fixed indices
    temps = {}
    for i, pos in enumerate(posList):
        temps[pos] = i
    print(f"Created fallback mapping for {len(temps)} parking spaces")

width, height = 107, 48

counter = set()  # Creating a Set in Python , Now Counter is a Set
# counterprev = set()  # Creating a Set in Python , Now Counter is a Set
li=[]
xi=[]
for i in range(69):
    li.append(i)
for i in range(len(li)):
    xi.append(True)
dicto=dict(zip(li,xi))
colorBlack = (0, 0, 0)

# flag = false
####################################################################################################################

def update_slot_status(slot_id, is_occupied):
    """Send slot status update to API"""
    global last_api_update
    
    # Only update API if status changed or hasn't been updated in 5 seconds
    current_time = time.time()
    if slot_id not in last_api_update or \
       current_time - last_api_update.get(slot_id, 0) > 5:
        
        try:
            status = "occupied" if is_occupied else "available"
            response = requests.put(
                f"{API_BASE_URL}/parking/slots/{slot_id}/status",
                json={"status": status},
                timeout=1  # 1 second timeout
            )
            if response.status_code == 200:
                last_api_update[slot_id] = current_time
                print(f"Updated slot {slot_id} status to {status}")
            else:
                print(f"Failed to update slot {slot_id}: {response.status_code}")
        except Exception as e:
            print(f"Error updating slot {slot_id}: {e}")

def checkParkingSpace(imgPro):
    spaceCounter = 0
    for pos in posList:
        x, y = pos
        slot_id = str(temps[pos])

        imgCrop = imgPro[y:y + height, x:x + width]
        # cv2.imshow(str(x * y), imgCrop)
        count = cv2.countNonZero(imgCrop)
        is_occupied = count >= 850
        flag = False
        if not is_occupied:
            color = (0, 255, 0)  # GREEN
            thickness = 3
            spaceCounter += 1
            # This is for Adding when Space is not Vacant
            if temps[pos] not in counter:
                counter.add(temps[pos])
                update_slot_status(slot_id, False)
                
                # Commenting out database operations
                # CarInfo.drop()
                # strCounter = []
                # bools = []
                # for i in range(69):
                #     if(i in counter):
                #         bools.append(True)
                #         strCounter.append(str(i))
                #     else:
                #         bools.append(False)
                #         strCounter.append(str(i))
                # di = dict(zip(strCounter, bools))
                # CarInfo.insert_one(di)

        else:
            color = (0, 0, 255)  # RED
            thickness = 3

          # This is for Removing when Space is Vacant
            if temps[pos] in counter:   
                counter.remove(temps[pos])
                update_slot_status(slot_id, True)

                # Commenting out database operations
                # CarInfo.drop()
                # strCounter = []
                # bools = []
                # for i in range(69):
                #     if(i in counter):
                #         bools.append(True)
                #         strCounter.append(str(i))
                #     else:
                #         bools.append(False)
                #         strCounter.append(str(i))
                # di = dict(zip(strCounter, bools))
                # CarInfo.insert_one(di)

        ID = slot_id
        cv2.rectangle(img, pos, (pos[0] + width,
                      pos[1] + height), color, thickness)
        cvzone.putTextRect(img, str(count), (x, y + height - 3), scale=1,
                           thickness=1, offset=0, colorR=colorBlack)
        cvzone.putTextRect(img, ID, (x+1, y + height - 34), scale=1,
                           thickness=2, offset=0, colorR=colorBlack)
        if temps[pos] in counter:
            cvzone.putTextRect(img, "Free", (x+width-40, y + height), scale=1,
                               thickness=1, offset=0, colorR=colorBlack)
        else:
            cvzone.putTextRect(img, "Parked", (x+width-60, y + height-3), scale=1,
                               thickness=1, offset=0, colorR=colorBlack)

    cvzone.putTextRect(img, f'Free: {spaceCounter}/{len(posList)}', (100, 50), scale=3,
                       thickness=5, offset=20, colorR=(0, 200, 0))
    print(f"Free spaces: {spaceCounter}/{len(posList)}")
####################################################################################################################

# Reset parking data at startup
try:
    response = requests.post(f"{API_BASE_URL}/parking/reset")
    if response.status_code == 200:
        print("Reset parking data successfully")
    else:
        print(f"Failed to reset parking data: {response.status_code}")
except Exception as e:
    print(f"Error resetting parking data: {e}")

while True:
    print("inside while")
    if not use_camera:  # Only reset frame position for video files
        if cap.get(cv2.CAP_PROP_POS_FRAMES) == cap.get(cv2.CAP_PROP_FRAME_COUNT):
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    
    success, img = cap.read()
    if not success:
        print("Failed to read frame")
        break
        
    # Create copies for different displays
    original_img = img.copy()
    
    imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    imgBlur = cv2.GaussianBlur(imgGray, (3, 3), 1)
    imgThreshold = cv2.adaptiveThreshold(
        imgBlur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
    imgMedian = cv2.medianBlur(imgThreshold, 5)
    kernel = np.ones((3, 3), np.uint8)

    imgDilate = cv2.dilate(imgMedian, kernel, iterations=1)

    checkParkingSpace(imgDilate)

    # Display multiple views
    cv2.imshow("Original", original_img)
    cv2.imshow("Grayscale", imgGray)
    cv2.imshow("Threshold", imgThreshold)
    
    # Resize the main processed image for better visibility
    img_resized = cv2.resize(img, (800, 600))
    cv2.imshow("Processed Image", img_resized)
    
    key = cv2.waitKey(15)
    if key & 0xFF == ord('d'):
        print("Empty are :", counter, "Total=", len(counter))
        break
    elif key & 0xFF == ord('q'):
        break

# Clean up
cap.release()
cv2.destroyAllWindows()
        