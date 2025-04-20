const { execSync } = require('child_process');
const open = require('open');
const fs = require('fs');
const path = require('path');
// Fix: node-fetch v3 is ESM only, we need to use a different approach for CommonJS
// Let's use a dynamic import for fetch

// Configuration
const DEFAULT_PORT = 3001;
const FALLBACK_PORT = 3002;
const BACKEND_PORT = 5000;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m', 
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Print welcome message
console.log(`
${colors.bright}${colors.cyan}==================================================${colors.reset}
${colors.bright}${colors.blue}           SpotSense Smart Parking System${colors.reset}
${colors.bright}${colors.cyan}==================================================${colors.reset}
`);

// Check if a port is in use
function isPortInUse(port) {
  try {
    execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

// Check if backend is running
async function checkBackendConnection() {
  try {
    console.log(`${colors.yellow}Checking backend connection at ${BACKEND_URL}...${colors.reset}`);
    
    // Use http module for the request instead of fetch
    const http = require('http');
    
    return new Promise((resolve) => {
      const req = http.get(`${BACKEND_URL}/health`, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`${colors.green}✅ Backend server is running.${colors.reset}`);
          resolve(true);
        } else {
          console.log(`${colors.yellow}⚠️ Backend server responded with status: ${res.statusCode}${colors.reset}`);
          resolve(false);
        }
      });
      
      req.on('error', (error) => {
        console.log(`${colors.yellow}⚠️ Backend server is not responding. Starting frontend anyway...${colors.reset}`);
        console.log(`${colors.yellow}Connection error: ${error.message}${colors.reset}`);
        
        // Try an alternative endpoint
        const req2 = http.get(`${BACKEND_URL}/api/health`, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`${colors.green}✅ Backend server is running on alternate endpoint.${colors.reset}`);
            resolve(true);
          } else {
            resolve(false);
          }
        });
        
        req2.on('error', () => {
          resolve(false);
        });
        
        req2.setTimeout(2000, () => {
          req2.destroy();
          resolve(false);
        });
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        console.log(`${colors.yellow}Backend connection timed out${colors.reset}`);
        resolve(false);
      });
    });
  } catch (error) {
    console.log(`${colors.yellow}⚠️ Backend server check failed: ${error.message}${colors.reset}`);
    return false;
  }
}

// Update package.json proxy if needed
function updateProxyConfig(backendUrl) {
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.proxy !== backendUrl) {
      console.log(`${colors.yellow}Updating proxy configuration to ${backendUrl}${colors.reset}`);
      packageJson.proxy = backendUrl;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  } catch (error) {
    console.log(`${colors.yellow}Warning: Could not update proxy configuration: ${error.message}${colors.reset}`);
  }
}

// Start the frontend server
async function startFrontend() {
  // Check backend connection first
  await checkBackendConnection();
  
  // Update proxy configuration
  updateProxyConfig(BACKEND_URL);
  
  let port = DEFAULT_PORT;
  
  // Check if the default port is in use
  if (isPortInUse(port)) {
    console.log(`${colors.yellow}Port ${port} is already in use. Trying ${FALLBACK_PORT}...${colors.reset}`);
    port = FALLBACK_PORT;
    
    // Check if the fallback port is also in use
    if (isPortInUse(port)) {
      console.log(`${colors.yellow}Port ${port} is also in use. Trying to find an available port...${colors.reset}`);
      port++; // Try next port
      while (isPortInUse(port) && port < 4000) {
        port++;
      }
      
      if (port >= 4000) {
        console.error(`${colors.red}Could not find an available port. Please free up port 3001 or 3002 and try again.${colors.reset}`);
        process.exit(1);
      }
    }
  }
  
  console.log(`${colors.green}Starting frontend server on port ${port}...${colors.reset}`);
  
  try {
    // Kill any existing processes on the port just to be safe
    try {
      const result = execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe', encoding: 'utf8' });
      if (result && result.trim()) {
        const lines = result.split('\n');
        for (const line of lines) {
          if (line.includes('LISTENING')) {
            const pid = line.trim().split(/\s+/).pop();
            if (pid) {
              console.log(`${colors.yellow}Killing process with PID ${pid} on port ${port}${colors.reset}`);
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
            }
          }
        }
      }
    } catch (e) {
      // Ignore errors, this is just a precaution
    }
    
    // Set environment variables for the process
    const env = { 
      ...process.env,
      PORT: port.toString(),
      REACT_APP_BACKEND_URL: BACKEND_URL,
      NODE_OPTIONS: '--dns-result-order=ipv4first'
    };
    
    console.log(`${colors.green}Using environment: PORT=${port}, BACKEND=${BACKEND_URL}${colors.reset}`);
    
    // Change the approach to spawn to ensure we don't block
    const { spawn } = require('child_process');
    const startProcess = spawn(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['start'],
      { 
        env: env,
        stdio: 'inherit',
        shell: true
      }
    );
    
    startProcess.on('error', (err) => {
      console.error(`${colors.red}Failed to start development server: ${err.message}${colors.reset}`);
      process.exit(1);
    });
    
    // Open the browser after a delay
    setTimeout(() => {
      console.log(`${colors.green}Opening browser to http://localhost:${port}${colors.reset}`);
      open(`http://localhost:${port}`).catch(() => {
        console.log(`${colors.yellow}Could not open browser automatically.${colors.reset}`);
        console.log(`${colors.yellow}Please manually navigate to:${colors.reset}`);
        console.log(`${colors.cyan}http://localhost:${port}${colors.reset}`);
        console.log(`${colors.yellow}Or try:${colors.reset}`);
        console.log(`${colors.cyan}http://127.0.0.1:${port}${colors.reset}`);
      });
    }, 5000);
  } catch (error) {
    console.error(`${colors.red}Failed to start server: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the app
startFrontend(); 