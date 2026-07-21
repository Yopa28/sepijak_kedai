// ============================================
// Security Middleware
// Kedai Sepijak Frontend
// ============================================

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createHash } from 'crypto';
import express from 'express';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX || '100', 10), // Limit each IP to 100 requests per windowMs
  keyGenerator: (req) => {
    // Create a unique key based on IP and user agent
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    return createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
    });
  },
  // Use in-memory store (consider Redis for production)
  store: {
    incr: (key, cb) => {
      const current = rateLimitStore.get(key) || { count: 0, resetTime: Date.now() + 900000 };
      current.count += 1;
      rateLimitStore.set(key, current);
      return cb(null, current);
    },
    resetKey: (key) => {
      rateLimitStore.delete(key);
    },
  },
});

// Security middleware
export default function securityMiddleware(req, res, next) {
  // Skip security in development if explicitly disabled
  if (import.meta.env.VITE_ENABLE_SECURITY !== 'true') {
    return next();
  }

  // 1. Set security headers using helmet
  const app = express();
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  }));

  // 2. Rate limiting for API routes
  if (req.path.startsWith('/api/')) {
    return apiLimiter(req, res, next);
  }

  // 3. CSRF protection for non-GET requests
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
    if (!csrfToken || !validateCsrfToken(csrfToken, req)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid CSRF token' 
      });
    }
  }

  // 4. Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', "camera=(), microphone=(), geolocation=()");
  
  // 5. Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // 6. Disable caching for sensitive data
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

// Simple CSRF token validation (implement proper validation in production)
function validateCsrfToken(token, req) {
  if (import.meta.env.VITE_CSRF_ENABLED !== 'true') return true;
  
  const sessionToken = req.session.csrfToken;
  if (!sessionToken) return false;
  
  return token === sessionToken;
}

// Security middleware for API routes
export const apiSecurity = [
  // Apply rate limiting
  apiLimiter,
  
  // Body parsing with size limit
  express.json({ limit: '10kb' }),
  express.urlencoded({ extended: true, limit: '10kb' }),
  
  // Security headers
  securityMiddleware,
  
  // Input sanitization
  (req, res, next) => {
    // Sanitize request body, query, and params
    if (req.body) sanitizeInput(req.body);
    if (req.query) sanitizeInput(req.query);
    if (req.params) sanitizeInput(req.params);
    next();
  }
];

// Helper function to sanitize input data
function sanitizeInput(obj) {
  if (!obj) return;
  
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      // Basic XSS prevention
      obj[key] = obj[key].replace(/</g, '&lt;').replace(/>/g, '&gt;');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeInput(obj[key]);
    }
  });
}

// ============================================
// Security Middleware
// Kedai Sepijak Frontend
// ============================================

// import { sanitize, validate, rateLimiter } from '@/utils/security' // Temporarily disabled

/**
 * Security middleware for form submissions
 */
export const securityMiddleware = {
  /**
   * Validate and sanitize feedback form data
   */
  validateFeedback: (formData) => {
    // Rate limiting check
    const clientKey = 'feedback-submission'
    if (rateLimiter.isLimited(clientKey, 5, 300000)) { // 5 attempts per 5 minutes
      throw new Error('Too many submissions. Please wait 5 minutes before trying again.')
    }

    // Sanitize inputs
    const sanitized = {
      role: sanitize.text(formData.role, 50),
      employee_name: sanitize.name(formData.employee_name),
      contact: sanitize.phone(formData.contact),
      date_of_visit: formData.date_of_visit,
      time_of_visit: formData.time_of_visit,
      message: sanitize.text(formData.message, 1000),
      voluntary_consent: Boolean(formData.voluntary_consent),
      ratings: {
        pelayanan: {
          sikap_pelayan: Number(formData.ratings?.pelayanan?.sikap_pelayan || 0),
          waktu_pesanan: Number(formData.ratings?.pelayanan?.waktu_pesanan || 0)
        },
        menu: {
          rasa_menu: Number(formData.ratings?.menu?.rasa_menu || 0)
        },
        kebersihan: Number(formData.ratings?.kebersihan || 0)
      }
    }

    // Validate inputs
    const errors = []

    if (!sanitized.role) errors.push('Role is required')
    if (!sanitized.employee_name) errors.push('Employee name is required')
    if (!validate.phone(sanitized.contact)) errors.push('Valid phone number is required')
    if (!sanitized.message || sanitized.message.length < 5) errors.push('Message must be at least 5 characters')
    if (!sanitized.voluntary_consent) errors.push('Consent is required')

    // Validate ratings
    const ratings = [
      sanitized.ratings.pelayanan.sikap_pelayan,
      sanitized.ratings.pelayanan.waktu_pesanan,
      sanitized.ratings.menu.rasa_menu,
      sanitized.ratings.kebersihan
    ]

    if (!ratings.every(rating => validate.rating(rating))) {
      errors.push('All ratings must be between 1-5')
    }

    // Security checks
    const textFields = [sanitized.employee_name, sanitized.message]
    for (const field of textFields) {
      if (validate.sqlInjection(field)) {
        errors.push('Invalid characters detected')
        break
      }
      if (validate.xss(field)) {
        errors.push('Invalid characters detected')
        break
      }
    }

    return {
      isValid: errors.length === 0,
      data: sanitized,
      errors
    }
  },

  /**
   * Validate polling vote data
   */
  validateVote: (voteData) => {
    const clientKey = `vote-${voteData.phone || 'anonymous'}`
    if (rateLimiter.isLimited(clientKey, 3, 60000)) { // 3 votes per minute
      throw new Error('Too many votes. Please wait before voting again.')
    }

    const sanitized = {
      name: sanitize.name(voteData.name),
      phone: sanitize.phone(voteData.phone),
      email: voteData.email ? sanitize.email(voteData.email) : '',
      option_id: Number(voteData.option_id)
    }

    const errors = []

    if (!sanitized.name) errors.push('Name is required')
    if (!validate.phone(sanitized.phone)) errors.push('Valid phone number is required')
    if (sanitized.email && !validate.email(sanitized.email)) errors.push('Valid email format required')
    if (!sanitized.option_id || sanitized.option_id < 1) errors.push('Valid option selection required')

    // Security checks
    if (validate.sqlInjection(sanitized.name)) {
      errors.push('Invalid characters in name')
    }

    return {
      isValid: errors.length === 0,
      data: sanitized,
      errors
    }
  }
}

export default securityMiddleware
