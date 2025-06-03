# SpotSense Smart Parking System

SpotSense is a modern smart parking management system that combines computer vision and web technologies to deliver a seamless parking experience. It detects parking spot availability in real-time and provides an intuitive interface for users to find and book parking slots.

## Features

- **Real-time Parking Detection**: Uses computer vision to track parking spot availability
- **Interactive UI**: Modern React-based frontend for easy navigation and booking
- **Seamless Booking**: Book parking spots with just a few clicks
- **Payment Integration**: Support for multiple payment methods
- **PDF Ticket Generation**: Download booking confirmations as PDF tickets
- **Google Maps Integration**: Get directions to your parking spot

## Project Structure

```
spotsense/
├── frontend/           # React frontend application
│   ├── src/            # Frontend source code
│   ├── public/         # Static assets
│   └── start.js        # Frontend startup script
├── backend/            # Python backend services
│   ├── app.py          # Main REST API server
│   ├── cv_api.py       # Computer vision API
│   └── ...             # Other backend services
└── start-all.bat       # Single script to start the entire system
```

## Installation

### Prerequisites

- Node.js 14+ (for frontend)
- Python 3.8+ (for backend)
- Web browser with JavaScript enabled

### Setup

1. Clone this repository:
   ```
   git clone <repository-url>
   cd spotsense
   ```

2. Run the start-all.bat script to set up and run the system:
   ```
   start-all.bat
   ```

   This script will:
   - Check for required dependencies
   - Create a Python virtual environment if needed
   - Install all required dependencies
   - Start both backend and frontend servers

3. Access the application at:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:5000

## Manual Setup (if needed)

### Backend Setup

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend Setup

```
cd frontend
npm install
node start.js
```

## Usage

1. Open http://localhost:3001 in your browser
2. Browse available parking locations
3. Select a parking spot
4. Fill out the booking form
5. Complete payment
6. Download your parking ticket

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Original projects: smart-parking-frontend and smart-parking-system
- Contributors to the computer vision components
- React and Python communities 