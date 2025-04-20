import axios from 'axios';

// Primary API configuration
const API_CONFIG = {
  // Try multiple base URLs in case localhost doesn't work
  BASE_URLS: [
    '/api',                     // Default relative URL with proxy
    'http://localhost:5000',    // Direct localhost URL
    'http://127.0.0.1:5000',    // IP address fallback
  ],
  TIMEOUT: 10000,               // 10 seconds timeout
  RETRY_DELAY: 1000,            // 1 second between retries
  MAX_RETRIES: 2                // Maximum number of retries
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URLS[0],
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Keep track of which base URL is currently working
let currentUrlIndex = 0;

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry if we've already retried or it's not a connection error
    if (
      originalRequest._retry || 
      !error.message.includes('Network Error') && 
      error.response && 
      error.response.status !== 0
    ) {
      return Promise.reject(error);
    }
    
    // Mark that we're retrying this request
    originalRequest._retry = true;
    
    // Check if we have more URLs to try
    if (currentUrlIndex < API_CONFIG.BASE_URLS.length - 1) {
      currentUrlIndex++;
      
      // Log the fallback attempt
      console.log(`Connection failed. Trying fallback URL: ${API_CONFIG.BASE_URLS[currentUrlIndex]}`);
      
      // Update base URL and retry
      api.defaults.baseURL = API_CONFIG.BASE_URLS[currentUrlIndex];
      originalRequest.baseURL = API_CONFIG.BASE_URLS[currentUrlIndex];
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      
      // Retry the request with the new base URL
      return api(originalRequest);
    }
    
    // If we've tried all URLs, reset to the first one for future requests
    currentUrlIndex = 0;
    api.defaults.baseURL = API_CONFIG.BASE_URLS[0];
    
    return Promise.reject(error);
  }
);

// API endpoints
const endpoints = {
  health: () => api.get('/health'),
  apiHealth: () => api.get('/api/health'),
  status: () => api.get('/parking/status'),
  spaces: () => api.get('/parking/spaces'),
  slots: (parkingId) => api.get(`/parking/${parkingId}/slots`),
  videoFeed: () => `${api.defaults.baseURL}/parking/video`,
  bookSlot: (parkingId, slotId, data) => api.post(`/parking/${parkingId}/slots/${slotId}/book`, data),
};

export { api, endpoints }; 