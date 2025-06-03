from enum import unique
import cv2
import pickle
from collections import defaultdict
import os
import subprocess
import sys
import numpy as np

# Constants
WIDTH, HEIGHT = 107, 48
IMAGE_PATH = 'carParkImg.png'
POSITIONS_FILE = 'CarParkPos'
UNIQUE_ID_FILE = 'UniqueID'

# Ensure files exist with correct permissions
def ensure_file(filename):
    if not os.path.exists(filename):
        try:
            with open(filename, 'wb') as f:
                pickle.dump([], f)
            print(f"Created empty file: {filename}")
        except Exception as e:
            print(f"Error creating {filename}: {e}")
    return os.path.abspath(filename)

# Main function
def run_picker():
    # Print header and instructions
    print("===============================================")
    print("Starting ParkingSpacePicker.py")
    print("Instructions:")
    print("- Left click to add a parking space")
    print("- Right click to remove a parking space")
    print("- Press 'd' to save and exit, then run main.py")
    
    # Ensure files exist and are writable
    positions_file = ensure_file(POSITIONS_FILE)
    unique_id_file = ensure_file(UNIQUE_ID_FILE)
    
    # Try to load existing positions
    try:
        with open(positions_file, 'rb') as f:
            posList = pickle.load(f)
        print(f"Loaded {len(posList)} existing parking spaces from {positions_file}")
    except Exception as e:
        print(f"Could not load positions file: {e}")
        posList = []
    
    # Try to load unique IDs
    try:
        with open(unique_id_file, 'rb') as f:
            uniqueIDs = pickle.load(f)
        print(f"Loaded {len(uniqueIDs)} unique IDs")
    except Exception as e:
        print(f"Could not load unique IDs file: {e}")
        uniqueIDs = [i for i in range(len(posList))]
        
    # Check if image file exists, if not try to find any image file
    img_path = IMAGE_PATH
    if not os.path.exists(img_path):
        # Try to find any image file
        for ext in ['.png', '.jpg', '.jpeg']:
            if os.path.exists('carPark' + ext):
                img_path = 'carPark' + ext
                break
        if img_path == IMAGE_PATH and not os.path.exists(img_path):
            # No image file found, check if there's a video to extract a frame
            if os.path.exists('carPark.mp4'):
                print("No image found. Extracting first frame from video...")
                cap = cv2.VideoCapture('carPark.mp4')
                success, img = cap.read()
                if success:
                    cv2.imwrite(img_path, img)
                    print(f"Created image file from video: {img_path}")
                else:
                    print("Could not extract frame from video")
                    return
            else:
                print("No image or video file found. Please provide an image file.")
                return

    print(f"Loading image from: {os.path.abspath(img_path)}")
    img = cv2.imread(img_path)
    
    # Create resizable window
    cv2.namedWindow('ParkingSpacePicker', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('ParkingSpacePicker', 1200, 800)
    
    # Also create a window for the processed image
    cv2.namedWindow('Processed View', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('Processed View', 1200, 800)

    # Mouse callback function
    def mouseClick(events, x, y, flags, params):
        if events == cv2.EVENT_LBUTTONDOWN:
            posList.append((x, y))
            uniqueIDs.append(len(uniqueIDs))
        if events == cv2.EVENT_RBUTTONDOWN:
            for i, pos in enumerate(posList):
                x1, y1 = pos
                if x1 < x < x1 + WIDTH and y1 < y < y1 + HEIGHT:
                    posList.pop(i)
                    if i < len(uniqueIDs):
                        uniqueIDs.pop(i)
                    break

        # Save after each change
        with open(positions_file, 'wb') as f:
            pickle.dump(posList, f)
        with open(unique_id_file, 'wb') as f:
            pickle.dump(uniqueIDs, f)
        print(f"Saved {len(posList)} parking spaces to {positions_file}")

    # Set the mouse callback
    cv2.setMouseCallback('ParkingSpacePicker', mouseClick)

    # Main loop
    while True:
        # Make a fresh copy of the image
        imgCopy = img.copy()
        
        # Create a processed view
        imgGray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        imgBlur = cv2.GaussianBlur(imgGray, (3, 3), 1)
        imgThreshold = cv2.adaptiveThreshold(
            imgBlur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 16)
        imgMedian = cv2.medianBlur(imgThreshold, 5)
        kernel = np.ones((3, 3), np.uint8)
        imgDilate = cv2.dilate(imgMedian, kernel, iterations=1)
        
        # Convert back to BGR for visualization
        processedView = cv2.cvtColor(imgDilate, cv2.COLOR_GRAY2BGR)
        
        # Draw rectangles on both views
        for i, pos in enumerate(posList):
            cv2.rectangle(imgCopy, pos, (pos[0] + WIDTH, pos[1] + HEIGHT), (0, 255, 0), 2)
            
            # Add ID text
            id_num = uniqueIDs[i] if i < len(uniqueIDs) else i
            cv2.putText(imgCopy, str(id_num), (pos[0] + 5, pos[1] + 20), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
            
            # Draw on processed view too
            cv2.rectangle(processedView, pos, (pos[0] + WIDTH, pos[1] + HEIGHT), (0, 255, 0), 2)
            cv2.putText(processedView, str(id_num), (pos[0] + 5, pos[1] + 20), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)

        # Show space count
        cv2.putText(imgCopy, f"Total Spaces: {len(posList)}", (50, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        # Add instructions overlay
        instructions = [
            "Left Click: Add Space",
            "Right Click: Delete Space",
            "Press 'd': Save and Exit"
        ]
        y_pos = 90
        for instruction in instructions:
            cv2.putText(imgCopy, instruction, (50, y_pos), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            y_pos += 30

        # Display both images
        cv2.imshow('ParkingSpacePicker', imgCopy)
        cv2.imshow('Processed View', processedView)
        
        # Check for key press
        key = cv2.waitKey(1)
        if key == ord('d'):
            break
        elif key == 27:  # ESC key
            posList = []  # Clear all spaces
            print("Cleared all spaces")
            continue

    # Save final state
    with open(positions_file, 'wb') as f:
        pickle.dump(posList, f)
    with open(unique_id_file, 'wb') as f:
        pickle.dump(uniqueIDs, f)
    print(f"Final save: {len(posList)} parking spaces to {positions_file}")
    
    # Clean up
    cv2.destroyAllWindows()
    print("ParkingSpacePicker completed. Run app.py next.")

if __name__ == "__main__":
    run_picker()
