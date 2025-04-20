import cv2
import pickle
import os
from ParkingSpacePicker import temps

# Load the parking spaces and IDs
with open('CarParkPos', 'rb') as f:
    posList = pickle.load(f)

with open('UniqueID', 'rb') as f:
    UniqueID = pickle.load(f)

# Define the parameters for display
width, height = 107, 48

# Create a dictionary mapping position to ID
pos_to_id = {}
for pos in posList:
    pos_to_id[pos] = temps[pos]

# Function to remove a space by its ID
def remove_space_by_id(space_id):
    for pos, id_num in pos_to_id.items():
        if id_num == space_id:
            if pos in posList:
                posList.remove(pos)
                print(f"Removed space with ID {space_id}")
                
                # Save the updated positions
                with open('CarParkPos', 'wb') as f:
                    pickle.dump(posList, f)
                
                # Update the UniqueID as well
                new_uniqueid = [temps[pos] for pos in posList]
                with open('UniqueID', 'wb') as f:
                    pickle.dump(new_uniqueid, f)
                
                return True
    print(f"Space with ID {space_id} not found")
    return False

# Display all spaces with their IDs
def display_spaces():
    # Use absolute path for the image
    img_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'carParkImg.png')
    img = cv2.imread(img_path)
    
    if img is None:
        print(f"Error: Could not load image at {img_path}")
        return
    
    # Draw all spaces with their IDs
    for pos in posList:
        x, y = pos
        id_num = temps[pos]
        cv2.rectangle(img, pos, (pos[0] + width, pos[1] + height), (255, 0, 255), 2)
        cv2.putText(img, str(id_num), (x+5, y+height-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    
    cv2.imshow("Parking Spaces", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

# Main execution
print("Current parking spaces:")
print(f"Total spaces: {len(posList)}")

# Display current spaces
display_spaces()

# Ask for space ID to remove
space_id = int(input("Enter the ID of the space you want to remove (or -1 to cancel): "))

if space_id != -1:
    remove_space_by_id(space_id)
    print(f"Updated parking spaces: {len(posList)}")
    
    # Display updated spaces
    display_spaces()
else:
    print("Operation cancelled") 