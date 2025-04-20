// Fetch-based API client
import fetch from 'node-fetch';

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

// Keep track of which base URL is currently working
let currentUrlIndex = 0;

// Default fetch options
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json'
  },
};

/**
 * Helper function to handle timeouts with fetch
 */
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeout = setTimeout(() => {
    controller.abort();
  }, API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
};

/**
 * Main fetch request function with retry logic
 */
const request = async (endpoint, options = {}) => {
  const fetchOptions = {
    ...defaultOptions,
    ...options,
  };
  
  let retries = 0;
  let lastError;
  
  while (retries <= API_CONFIG.MAX_RETRIES) {
    try {
      const url = `${API_CONFIG.BASE_URLS[currentUrlIndex]}${endpoint}`;
      const response = await fetchWithTimeout(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Check if it's a network error or timeout (abort)
      const isNetworkError = 
        error.name === 'AbortError' || 
        error.name === 'TypeError' && error.message.includes('fetch');
      
      // If not a network error, don't retry
      if (!isNetworkError) {
        break;
      }
      
      // Try the next base URL if available
      if (currentUrlIndex < API_CONFIG.BASE_URLS.length - 1) {
        currentUrlIndex++;
        console.log(`Connection failed. Trying fallback URL: ${API_CONFIG.BASE_URLS[currentUrlIndex]}`);
      } else {
        // If we've tried all URLs, reset to the first one
        currentUrlIndex = 0;
        
        // If we've hit max retries, give up
        if (retries >= API_CONFIG.MAX_RETRIES) {
          break;
        }
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
      retries++;
    }
  }
  
  throw lastError;
};

// HTTP method helpers
const fetchClient = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, data) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: (endpoint, data) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

// API endpoints
const endpoints = {
  health: () => fetchClient.get('/health'),
  apiHealth: () => fetchClient.get('/api/health'),
  status: () => fetchClient.get('/parking/status'),
  spaces: () => fetchClient.get('/parking/spaces'),
  slots: (parkingId) => fetchClient.get(`/parking/${parkingId}/slots`),
  videoFeed: () => `${API_CONFIG.BASE_URLS[currentUrlIndex]}/parking/video`,
  bookSlot: (parkingId, slotId, data) => fetchClient.post(`/parking/${parkingId}/slots/${slotId}/book`, data),
};

export { fetchClient, endpoints }; 