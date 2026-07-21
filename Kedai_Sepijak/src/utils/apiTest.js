// ============================================
// API Test Utility
// Kedai Sepijak Frontend
// ============================================

import api from '@/services/api'

// Cache for API test results
let lastTestResult = null
let lastTestTime = 0
const TEST_CACHE_DURATION = 60000 // 1 minute

/**
 * Test API connectivity (with caching to reduce excessive calls)
 */
export const testApiConnection = async (forceTest = false) => {
  // Return cached result if available and recent
  if (!forceTest && lastTestResult && (Date.now() - lastTestTime) < TEST_CACHE_DURATION) {
    return lastTestResult
  }

  try {
    // Test basic connectivity (silent for health checks)
    const response = await api.get('/health', { timeout: 3000 })
    
    const result = { success: true, data: response.data }
    
    // Only log if it's real backend, not fallback
    if (response.data.status !== 'development') {
      console.log('✅ Real API connection successful:', response.data)
    }
    
    // Cache successful result
    lastTestResult = result
    lastTestTime = Date.now()
    
    return result
    
  } catch (error) {
    const result = {
      success: false,
      error: 'network',
      message: error.message || 'Cannot connect to server. Please check if the backend is running.'
    }
    
    // Silent error handling - no console spam
    
    // Cache failed result for shorter time
    lastTestResult = result
    lastTestTime = Date.now()
    
    return result
  }
}

// Cache for endpoint test results
let lastEndpointTestResult = null
let lastEndpointTestTime = 0

/**
 * Test specific endpoints (with caching to reduce calls)
 */
export const testEndpoints = async (forceTest = false) => {
  // Return cached result if available and recent
  if (!forceTest && lastEndpointTestResult && (Date.now() - lastEndpointTestTime) < TEST_CACHE_DURATION) {
    return lastEndpointTestResult
  }

  const endpoints = [
    { name: 'Health Check', url: '/health', method: 'get' },
    { name: 'Polling Data', url: '/polling', method: 'get' },
    { name: 'Feedback', url: '/feedback', method: 'get' },
    { name: 'Waiters', url: '/waiters', method: 'get' }
  ]
  
  const results = []
  
  // First check if basic connection works
  const connectionTest = await testApiConnection()
  if (!connectionTest.success) {
    console.warn('⚠️ Skipping endpoint tests - no connection')
    return { success: false, error: 'No connection', results: [] }
  }
  
  for (const endpoint of endpoints) {
    try {
      if (import.meta.env.VITE_DEBUG_MODE === 'true') {
        console.log(`🔍 Testing ${endpoint.name}...`)
      }
      
      const response = await api[endpoint.method](endpoint.url, { timeout: 2000 })
      
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        success: true,
        status: response.status,
        data: response.data
      })
      
      if (import.meta.env.VITE_DEBUG_MODE === 'true') {
        console.log(`✅ ${endpoint.name} - OK`)
      }
      
    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        success: false,
        error: error.message,
        status: error.response?.status || 'No Response'
      })
      
      if (import.meta.env.VITE_DEBUG_MODE === 'true') {
        console.log(`❌ ${endpoint.name} - ${error.message}`)
      }
    }
  }
  
  const result = {
    success: results.every(r => r.success),
    results,
    timestamp: Date.now()
  }
  
  // Cache the result
  lastEndpointTestResult = result
  lastEndpointTestTime = Date.now()
  
  return result
}

/**
 * Test authentication endpoints
 */
export const testAuthEndpoints = async () => {
  const authEndpoints = [
    { name: 'Login Check', url: '/auth/session', method: 'get' },
  ]
  
  const results = []
  
  for (const endpoint of authEndpoints) {
    try {
      console.log(`🔍 Testing ${endpoint.name}...`)
      
      const response = await api[endpoint.method](endpoint.url, { 
        timeout: 3000,
        withCredentials: true 
      })
      
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        success: true,
        status: response.status,
        data: response.data
      })
      
      console.log(`✅ ${endpoint.name} - OK`)
      
    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        success: false,
        error: error.message,
        status: error.response?.status || 'No Response'
      })
      
      console.log(`❌ ${endpoint.name} - ${error.message}`)
    }
  }
  
  return results
}

export default {
  testApiConnection,
  testEndpoints,
  testAuthEndpoints
}
