# SpotSense Smart Parking System

SpotSense is a complete smart parking solution that combines modern React frontend with advanced computer vision backend to create a seamless parking management system.

## What We've Done

The SpotSense project is a consolidation of two separate projects:
- `smart-parking-frontend`: The React-based user interface
- `smart-parking-system`: Additional modules and legacy system
- `Pyt`: Python-based computer vision and backend API

These have been merged into a unified directory structure with a simplified setup process.

## Project Structure

```
spotsense/
├── frontend/                   # React frontend application
│   ├── src/                    # Frontend source code
│   │   ├── templates/legacy/   # Legacy HTML templates
│   │   └── utils/legacy/       # Legacy JavaScript utilities
│   ├── public/                 # Static assets
│   └── start.js                # Frontend startup script
├── backend/                    # Python backend services
│   ├── app.py                  # Main REST API server
│   ├── cv_api.py               # Computer vision API
│   └── ...                     # Other backend modules
├── start-all.bat               # Single script to start the entire system
├── setup.bat                   # Installs dependencies
├── optimize.bat                # Optimizes project size
└── cleanup.bat                 # Removes original directories
```

## Quick Start

1. Open a command prompt in this directory
2. Run `spotsense-start.bat` to start the application
3. Visit http://localhost:3001 in your browser

## Setup & Maintenance

### First-time Setup

Run `setup.bat` to install all required dependencies for both frontend and backend.

### Starting the Application

Run `start-all.bat` to start both frontend and backend services.

### Optimization

Run `optimize.bat` to reduce project size and optimize for production.

## Using the Application

1. Open http://localhost:3001 in your browser
2. Browse available parking locations
3. Select a parking spot
4. Fill out the booking form
5. Complete the payment process
6. Download your parking ticket as PDF

## Features

- **Real-time Parking Detection**: Computer vision for detecting available spots
- **User-friendly Interface**: Modern React-based UI
- **Booking System**: Reserve and pay for parking spaces
- **Multiple Payment Methods**: UPI, credit/debit cards, and cash
- **PDF Tickets**: Professional parking tickets with QR codes
- **Google Maps Integration**: Get directions to your parking space

## Technical Details

- Frontend: React.js with TailwindCSS
- Backend: Python with Flask
- Computer Vision: OpenCV with custom detection algorithms
- Database: SQLite (development), PostgreSQL (production-ready)

## Troubleshooting

If you encounter any issues:

1. Make sure both Node.js and Python are installed
2. Check that all dependencies are installed using `setup.bat`
3. Verify that both frontend and backend servers are running
4. Ensure ports 3001 (frontend) and 5000 (backend) are not in use
