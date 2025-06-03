"""
Simple test server to verify that the Flask application can run and that
ports are accessible. This is a minimal version of the app.py server.
"""

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Test server is running'
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'message': 'Welcome to the test server',
        'endpoints': ['/health']
    })

if __name__ == '__main__':
    print("="*50)
    print("Starting TEST SERVER on port 5000...")
    print("Server URL: http://localhost:5000")
    print("Health endpoint: http://localhost:5000/health")
    print("="*50)
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
        print("Server started successfully!")
    except Exception as e:
        print(f"ERROR STARTING SERVER: {e}")
        print("Common issues:")
        print("1. Port 5000 is already in use")
        print("2. Firewall is blocking access")
        print("3. Python environment is missing dependencies")
        import traceback
        traceback.print_exc() 