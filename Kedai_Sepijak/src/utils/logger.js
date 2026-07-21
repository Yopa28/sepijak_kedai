// ============================================
// Console Logger Utility
// Kedai Sepijak Frontend
// ============================================

/**
 * Centralized logging utility that respects environment variables
 */
class Logger {
  constructor() {
    this.debugMode = import.meta.env.VITE_DEBUG_MODE === 'true'
    this.consoleLogsEnabled = import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true'
    this.isDev = import.meta.env.DEV
  }

  /**
   * Log debug messages (only in debug mode)
   */
  debug(...args) {
    if (this.debugMode) {
      console.log(...args)
    }
  }

  /**
   * Log info messages (only if console logs enabled)
   */
  info(...args) {
    if (this.consoleLogsEnabled || this.debugMode) {
      console.log(...args)
    }
  }

  /**
   * Log warnings (always shown in development)
   */
  warn(...args) {
    if (this.isDev) {
      console.warn(...args)
    }
  }

  /**
   * Log errors (always shown)
   */
  error(...args) {
    console.error(...args)
  }

  /**
   * Log success messages (only if console logs enabled)
   */
  success(...args) {
    if (this.consoleLogsEnabled || this.debugMode) {
      console.log(...args)
    }
  }

  /**
   * Log API calls (only in debug mode)
   */
  api(...args) {
    if (this.debugMode) {
      console.log(...args)
    }
  }

  /**
   * Silent mode - no logs at all
   */
  silent() {
    // Do nothing
  }
}

// Create singleton instance
const logger = new Logger()

export default logger

// Named exports for convenience
export const { debug, info, warn, error, success, api, silent } = logger
