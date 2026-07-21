// ============================================
// Backend Connection Helper
// Kedai Sepijak Frontend
// ============================================

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:5000/api"
const BACKEND_AVAILABLE = import.meta.env.VITE_BACKEND_AVAILABLE === 'true'

/**
 * Check if backend is available and responsive
 */
export const checkBackendHealth = async () => {
  if (!BACKEND_AVAILABLE) {
    return { available: false, status: 'disabled', message: 'Backend is disabled in configuration' }
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })

    return {
      available: true,
      status: 'connected',
      message: response.data?.message || 'Backend is healthy',
      data: response.data
    }
  } catch (error) {
    console.error('Backend health check failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      return { available: false, status: 'refused', message: 'Backend server is not running' }
    } else if (error.code === 'ENOTFOUND') {
      return { available: false, status: 'not_found', message: 'Backend server not found' }
    } else if (error.response) {
      return { 
        available: false, 
        status: 'error', 
        message: `Backend error: ${error.response.status}`,
        statusCode: error.response.status
      }
    } else {
      return { available: false, status: 'timeout', message: 'Backend connection timeout' }
    }
  }
}

/**
 * Test specific endpoint availability
 */
export const testEndpoint = async (endpoint) => {
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      timeout: 3000
    })
    
    return {
      success: true,
      status: response.status,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status || null
    }
  }
}

/**
 * Get backend configuration status
 */
export const getBackendConfig = () => {
  return {
    baseURL: API_BASE_URL,
    available: BACKEND_AVAILABLE,
    fallbackMode: import.meta.env.VITE_FALLBACK_MODE === 'true',
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
  }
}

/**
 * Initialize backend connection
 */
export const initializeBackendConnection = async () => {
  const config = getBackendConfig()
  console.log('🔧 Backend Configuration:', config)
  
  if (!config.available) {
    console.warn('⚠️ Backend is disabled in configuration')
    return { success: false, reason: 'disabled' }
  }

  const health = await checkBackendHealth()
  console.log('🏥 Backend Health Check:', health)
  
  return health
}

export default {
  checkBackendHealth,
  testEndpoint,
  getBackendConfig,
  initializeBackendConnection
}
