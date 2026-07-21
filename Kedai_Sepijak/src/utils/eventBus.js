// ============================================
// Event Bus for Real-time Updates
// Kedai Sepijak Frontend
// ============================================

import { reactive } from 'vue'

class EventBus {
  constructor() {
    this.events = {}
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (!this.events[event]) return
    
    const index = this.events[event].indexOf(callback)
    if (index > -1) {
      this.events[event].splice(index, 1)
    }
  }

  // Emit an event
  emit(event, data) {
    if (!this.events[event]) return
    
    console.log(`📡 Event emitted: ${event}`, data)
    this.events[event].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error)
      }
    })
  }
}

// Create singleton instance
const eventBus = new EventBus()

// Reactive state for global updates
export const globalState = reactive({
  lastUpdate: Date.now(),
  feedbackCount: 0,
  pollVotes: 0
})

// Helper functions
export const triggerDashboardRefresh = () => {
  globalState.lastUpdate = Date.now()
  eventBus.emit('dashboard:refresh', { timestamp: globalState.lastUpdate })
}

export const updateFeedbackCount = (count) => {
  globalState.feedbackCount = count
  eventBus.emit('feedback:updated', { count })
}

export const updatePollVotes = (votes) => {
  globalState.pollVotes = votes
  eventBus.emit('polls:updated', { votes })
}

export default eventBus
