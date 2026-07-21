// ============================================
// Authentication Middleware
// Kedai Sepijak Frontend
// ============================================

import { useAuthStore } from '@/stores/auth'
import { rateLimiter } from '@/utils/security'

/**
 * Route guard for admin pages
 */
export const requireAuth = (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    console.warn('🚫 Unauthorized access attempt to:', to.path)
    
    // Log suspicious activity
    logSecurityEvent('unauthorized_access', {
      path: to.path,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    })
    
    next({
      path: '/admin/login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // Check session validity
  if (authStore.isSessionExpired()) {
    console.warn('🕐 Session expired for user:', authStore.userName)
    authStore.logout()
    
    next({
      path: '/admin/login',
      query: { 
        redirect: to.fullPath,
        message: 'Session expired. Please login again.'
      }
    })
    return
  }
  
  // Rate limiting for admin actions
  const userId = authStore.userId || 'anonymous'
  if (rateLimiter.isLimited(`admin_${userId}`, 100, 60000)) { // 100 requests per minute
    console.warn('🚫 Rate limit exceeded for admin user:', userId)
    
    next({
      path: '/admin/login',
      query: { message: 'Too many requests. Please try again later.' }
    })
    return
  }
  
  next()
}

/**
 * Route guard for guest pages (login)
 */
export const requireGuest = (to, from, next) => {
  const authStore = useAuthStore()
  
  if (authStore.isAuthenticated && !authStore.isSessionExpired()) {
    next('/admin/dashboard')
    return
  }
  
  next()
}

/**
 * Log security events
 */
const logSecurityEvent = (event, data) => {
  const securityLog = {
    event,
    data,
    timestamp: new Date().toISOString(),
    sessionId: sessionStorage.getItem('session_id') || 'unknown'
  }
  
  // Store in localStorage for admin review
  const logs = JSON.parse(localStorage.getItem('security_logs') || '[]')
  logs.push(securityLog)
  
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.splice(0, logs.length - 100)
  }
  
  localStorage.setItem('security_logs', JSON.stringify(logs))
  
  // In production, send to backend
  if (import.meta.env.PROD) {
    fetch('/api/security/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(securityLog)
    }).catch(err => console.error('Failed to log security event:', err))
  }
}

/**
 * Check for suspicious activity patterns
 */
export const detectSuspiciousActivity = () => {
  const logs = JSON.parse(localStorage.getItem('security_logs') || '[]')
  const recentLogs = logs.filter(log => 
    new Date() - new Date(log.timestamp) < 300000 // Last 5 minutes
  )
  
  // Multiple failed login attempts
  const failedLogins = recentLogs.filter(log => log.event === 'login_failed').length
  if (failedLogins >= 5) {
    return {
      suspicious: true,
      reason: 'Multiple failed login attempts',
      action: 'temporary_lockout'
    }
  }
  
  // Multiple unauthorized access attempts
  const unauthorizedAttempts = recentLogs.filter(log => log.event === 'unauthorized_access').length
  if (unauthorizedAttempts >= 10) {
    return {
      suspicious: true,
      reason: 'Multiple unauthorized access attempts',
      action: 'ip_monitoring'
    }
  }
  
  return { suspicious: false }
}

/**
 * Enhanced session management
 */
export const sessionManager = {
  /**
   * Create secure session
   */
  create: (userData) => {
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
    
    const session = {
      id: sessionId,
      userId: userData.id,
      userName: userData.name,
      role: userData.role,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastActivity: new Date().toISOString()
    }
    
    sessionStorage.setItem('session_id', sessionId)
    sessionStorage.setItem('session_data', JSON.stringify(session))
    
    return session
  },
  
  /**
   * Validate session
   */
  validate: () => {
    const sessionData = sessionStorage.getItem('session_data')
    if (!sessionData) return null
    
    try {
      const session = JSON.parse(sessionData)
      
      // Check expiration
      if (new Date() > new Date(session.expiresAt)) {
        sessionManager.destroy()
        return null
      }
      
      // Update last activity
      session.lastActivity = new Date().toISOString()
      sessionStorage.setItem('session_data', JSON.stringify(session))
      
      return session
    } catch (error) {
      console.error('Invalid session data:', error)
      sessionManager.destroy()
      return null
    }
  },
  
  /**
   * Destroy session
   */
  destroy: () => {
    sessionStorage.removeItem('session_id')
    sessionStorage.removeItem('session_data')
    localStorage.removeItem('auth_token')
  },
  
  /**
   * Check if session is expired
   */
  isExpired: () => {
    const session = sessionManager.validate()
    return !session
  }
}

export default {
  requireAuth,
  requireGuest,
  logSecurityEvent,
  detectSuspiciousActivity,
  sessionManager
}
