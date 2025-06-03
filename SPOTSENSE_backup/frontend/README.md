# SpotSense Smart Parking System - Frontend

A modern React application for finding and booking parking spaces in real-time.

## Features

- 🚗 Real-time parking slot availability monitoring
- 📍 Interactive map with nearby parking locations
- 📱 Mobile-responsive UI built with Tailwind CSS
- 🎫 Booking system with digital ticket generation
- 🧭 Navigation assistance with Google Maps integration

## Prerequisites

- [Node.js](https://nodejs.org/) (v14.x or higher)
- [npm](https://www.npmjs.com/) (v6.x or higher) or [yarn](https://yarnpkg.com/) (v1.22.x or higher)

## Getting Started

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd smart-parking-frontend
   ```

2. Install dependencies
   ```bash
   npm install
   # or with yarn
   yarn install
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Update the variables as needed
   ```bash
   cp .env.example .env
   ```

### Running the Development Server

```bash
npm start
# or with yarn
yarn start
```

The application will start on [http://localhost:3000](http://localhost:3000) and automatically open in your default browser.

### Building for Production

```bash
npm run build
# or with yarn
yarn build
```

The optimized build will be created in the `build` directory.

## Backend Integration

This frontend application integrates with a Flask backend. By default, it connects to:
- The API server at `http://localhost:5000` 
- The WebSocket server at `http://localhost:5001`

You can modify these settings in the `.env` file.

## Tech Stack

- **React** - Frontend library
- **React Router** - Navigation and routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API requests
- **React-Toastify** - Toast notifications
- **Google Maps API** - Maps and location services
- **HTML2Canvas & jsPDF** - PDF ticket generation

## Folder Structure

```
smart-parking-frontend/
├── public/                 # Static files
├── src/                    # Source code
│   ├── components/         # Reusable components
│   │   ├── common/         # UI components
│   │   └── ...
│   ├── pages/              # Page components
│   ├── App.js              # Main application component
│   └── index.js            # Application entry point
├── .env                    # Environment variables
├── .env.example            # Example environment variables
├── package.json            # Dependencies and scripts
└── tailwind.config.js      # Tailwind CSS configuration
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm run eject` - Ejects the create-react-app configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details. 