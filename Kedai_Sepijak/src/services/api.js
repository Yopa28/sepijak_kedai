// ============================================
// API Configuration
// Kedai Sepijak Frontend
// ============================================

import axios from "axios";
import mockStorage from "@/utils/mockStorage";
import { triggerDashboardRefresh } from "@/utils/eventBus";
// Temporarily disable security imports to fix network errors
// import { csrf, securityHeaders, rateLimiter } from "@/utils/security";

// Base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

// Development fallback mode
const DEVELOPMENT_FALLBACK = import.meta.env.DEV && import.meta.env.VITE_FALLBACK_MODE === 'true';

// Backend availability check
let BACKEND_AVAILABLE = import.meta.env.VITE_BACKEND_AVAILABLE === 'true';

// Backend health check variables
let LAST_BACKEND_CHECK = 0;
let CONSECUTIVE_FAILURES = 0;
const BACKEND_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_CONSECUTIVE_FAILURES = 3;

// Security utilities
const generateApiKey = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  const userAgent = navigator.userAgent.substring(0, 10)
  return btoa(`${timestamp}-${random}-${userAgent}`).substring(0, 32)
}

// Rate limiting
const requestCounts = new Map()
const RATE_LIMIT = 100 // requests per minute
const RATE_WINDOW = 60000 // 1 minute

const checkRateLimit = () => {
  const now = Date.now()
  const clientId = 'frontend-client'
  
  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, [])
  }
  
  const requests = requestCounts.get(clientId)
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < RATE_WINDOW)
  
  if (validRequests.length >= RATE_LIMIT) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }
  
  validRequests.push(now)
  requestCounts.set(clientId, validRequests)
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Enhanced request interceptor with security
api.interceptors.request.use(
  (config) => {
    // Rate limiting check
    checkRateLimit();
    
    // Add timestamp to request
    config.metadata = { startTime: new Date() };

    // Enhanced security headers
    config.headers = {
      ...config.headers,
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'",
      'X-API-Key': generateApiKey(),
      'X-Client-Version': '1.0.0',
      'X-Request-Source': 'kedai-sepijak-frontend'
    };

    // Minimal logging only for debugging
    if (import.meta.env.VITE_DEBUG_MODE === 'true' && !config.url.includes('/health') && !config.url.includes('/status')) {
      console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    }

    // Add auth token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID()

    return config;
  },
  (error) => {
    console.error("🚨 Request error:", error);
    return Promise.reject(error);
  },
);

// Error handler with fallback to mock data
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Check backend availability
    if (Date.now() - LAST_BACKEND_CHECK > BACKEND_CHECK_INTERVAL) {
      LAST_BACKEND_CHECK = Date.now();
      try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        if (response.status === 200) {
          BACKEND_AVAILABLE = true;
          CONSECUTIVE_FAILURES = 0;
        } else {
          BACKEND_AVAILABLE = false;
          CONSECUTIVE_FAILURES++;
        }
      } catch (error) {
        BACKEND_AVAILABLE = false;
        CONSECUTIVE_FAILURES++;
      }
    }

    if (!BACKEND_AVAILABLE && CONSECUTIVE_FAILURES >= MAX_CONSECUTIVE_FAILURES) {
      console.warn('⚠️ Backend is not available, but fallback mode is disabled');
      return Promise.reject(error);
    }
    
    // Only use fallback in development mode
    if (!DEVELOPMENT_FALLBACK) {
      // Silent error handling - no console spam
      return Promise.reject(error);
    }

    // Development fallback logic
    const url = error.config?.url || '';
    const method = error.config?.method || 'get';
    
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.warn("🔄 Backend server not available. Using fallback mode for development.");
    }

    // Handle different endpoints
    if (url.includes('/feedback')) {
      // Handle feedback endpoints
      if (method === 'get') {
        const feedback = mockStorage.getFeedback();
        return Promise.resolve({
          data: { 
            success: true, 
            data: feedback
          },
          status: 200,
          config: error.config
        });
      } else if (method === 'post') {
        const newFeedback = mockStorage.addFeedback(error.config.data);
        return Promise.resolve({
          data: { 
            success: true, 
            data: newFeedback
          },
          status: 201,
          config: error.config
        });
      }
    } else if (url.includes('/waiters')) {
      // Handle waiter endpoints
      if (method === 'get') {
        const waiters = mockStorage.getWaiters();
        return Promise.resolve({
          data: { 
            success: true, 
            data: waiters
          },
          status: 200,
          config: error.config
        });
      }
    } else if (url.includes('/polling')) {
      // Handle polling endpoints
      if (method === 'get') {
        const polls = mockStorage.getPolls();
        
        if (url === '/polling') {
          // Admin polls list - return all polls
          return Promise.resolve({
            data: { 
              success: true, 
              data: polls
            },
            status: 200,
            config: error.config
          });
        } else if (url.includes('/polling/active')) {
          // Public active poll - return single active poll
          const activePoll = polls.find(p => p.is_active === 1 && p.status === 'active');
          
          return Promise.resolve({
            data: { 
              success: true, 
              data: activePoll || null
            },
            status: 200,
            config: error.config
          });
        }
      } else if (method === 'post') {
        // Create new poll
        const newPoll = mockStorage.addPoll(error.config.data);
        return Promise.resolve({
          data: { 
            success: true, 
            data: newPoll
          },
          status: 201,
          config: error.config
        });
      } else if (method === 'patch' && url.includes('/toggle')) {
        // Toggle poll status
        const pollId = url.split('/')[2];
        const updatedPoll = mockStorage.togglePoll(pollId);
        return Promise.resolve({
          data: { 
            success: true, 
            data: updatedPoll
          },
          status: 200,
          config: error.config
        });
      }
    } else if (url.includes('/vote')) {
      // Handle vote endpoint
      if (method === 'post') {
        const pollId = url.split('/')[2];
        const { option_id, ...voterData } = error.config.data;
        const voteResult = mockStorage.votePoll(pollId, option_id, voterData);
        
        if (voteResult) {
          return Promise.resolve({
            data: { 
              success: true, 
              message: 'Vote recorded successfully',
              data: voteResult
            },
            status: 200,
            config: error.config
          });
        } else {
          return Promise.resolve({
            data: { 
              success: false, 
              message: 'Failed to record vote'
            },
            status: 400,
            config: error.config
          });
        }
      }
    }
        
    // Return fallback data for common endpoints
    if (url.includes('/health')) {
      return Promise.resolve({
        data: { success: true, message: 'Fallback mode active', status: 'development' },
        status: 200,
        config: error.config
      });
    } else {
      // Error in request configuration
      console.error("Request configuration error:", error.message);
    }

    return Promise.reject(error);
  }
);


// Helper function to handle API responses
export const handleApiResponse = (response) => {
  if (response.data.success) {
    return response.data;
  }
  throw new Error(response.data.message || "API request failed");
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return {
      success: false,
      message: error.response.data.message,
      error: error.response.data,
    };
  }

  return {
    success: false,
    message: error.message || "An unexpected error occurred",
    error: error,
  };
};

export default api;
