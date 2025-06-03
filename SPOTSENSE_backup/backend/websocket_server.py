from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import time
import threading
import json
import requests

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuration
API_BASE_URL = "http://localhost:5000"  # The Flask REST API server

# Global variables
connected_clients = {}  # {client_id: {parking_id: parking_id}}

def fetch_parking_data():
    """Continuously fetch parking data and broadcast to connected clients"""
    while True:
        try:
            # Group clients by parking_id for efficient broadcasting
            parking_clients = {}
            for client_id, data in connected_clients.items():
                parking_id = data.get('parking_id')
                if parking_id:
                    if parking_id not in parking_clients:
                        parking_clients[parking_id] = []
                    parking_clients[parking_id].append(client_id)
            
            # Fetch and broadcast data for each parking lot
            for parking_id, clients in parking_clients.items():
                try:
                    # Fetch data from API
                    response = requests.get(f"{API_BASE_URL}/api/parking/{parking_id}/slots")
                    if response.status_code == 200:
                        data = response.json()
                        
                        # Broadcast to all clients for this parking lot
                        for client_id in clients:
                            socketio.emit('parking_update', data, room=client_id)
                except Exception as e:
                    print(f"Error fetching data for parking {parking_id}: {e}")
        except Exception as e:
            print(f"Error in fetch loop: {e}")
        
        # Wait before next update
        time.sleep(1)

@socketio.on('connect')
def handle_connect():
    """Handle new client connection"""
    client_id = request.sid
    connected_clients[client_id] = {}
    print(f"Client connected: {client_id}")
    emit('connection_success', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    client_id = request.sid
    if client_id in connected_clients:
        del connected_clients[client_id]
    print(f"Client disconnected: {client_id}")

@socketio.on('subscribe')
def handle_subscribe(data):
    """Handle subscription to a specific parking lot"""
    client_id = request.sid
    parking_id = data.get('parking_id', '1')  # Default to parking_id 1
    
    # Update client data
    if client_id in connected_clients:
        connected_clients[client_id]['parking_id'] = parking_id
        print(f"Client {client_id} subscribed to parking {parking_id}")
        emit('subscription_success', {'parking_id': parking_id})
    else:
        print(f"Unknown client tried to subscribe: {client_id}")
        emit('subscription_error', {'message': 'Client not connected'})

if __name__ == '__main__':
    # Start data fetching thread
    data_thread = threading.Thread(target=fetch_parking_data)
    data_thread.daemon = True
    data_thread.start()
    
    # Start WebSocket server
    print("Starting WebSocket server on port 5001...")
    socketio.run(app, host='0.0.0.0', port=5001, debug=False) 