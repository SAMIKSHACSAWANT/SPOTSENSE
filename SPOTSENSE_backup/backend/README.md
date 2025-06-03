# Parking Detection Backend

This backend provides the following features:
- Real-time parking slot detection using computer vision
- REST API for slot status and bookings
- WebSocket support for real-time updates
- Video streaming of parking lot with slot overlays

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure you have the following files:
- `CarParkPos`: Contains parking space positions
- `UniqueID`: Contains unique IDs for parking spaces
- `carPark.mp4`: Video file for processing (or a webcam)

## Running the Backend

To start both the main API server and the WebSocket server:

```bash
python run_backend.py
```

### Available Endpoints

- **Main API**: http://localhost:5000
  - `/api/video_feed/<parking_id>`: MJPEG stream of the parking lot
  - `/api/parking/<parking_id>/slots`: Current status of all parking slots
  - `/api/parking/<parking_id>/slots/<slot_id>/book`: Book a specific slot (POST)

- **WebSocket**: ws://localhost:5001
  - Connect to get real-time updates
  - Send `subscribe` event with `{ parking_id: "1" }` to subscribe to updates

## Manually Running Components

If you want to run components separately:

1. For the API server:
```bash
python server.py
```

2. For the WebSocket server:
```bash
python websocket_server.py
```

3. For parking space detection setup (first-time setup):
```bash
python ParkingSpacePicker.py
```

## Integrating with Frontend

The frontend should be configured to:
1. Connect to the API at `http://localhost:5000`
2. Connect to WebSocket at `ws://localhost:5001`
3. Subscribe to parking updates after WebSocket connection 