// ============================================
// Mock Storage Utility
// Kedai Sepijak Frontend
// ============================================

/**
 * Mock storage system that persists data in localStorage
 * for development when backend is not available
 */
class MockStorage {
  constructor() {
    this.storageKey = 'kedai_sepijak_mock_data'
    this.initializeStorage()
  }

  // Calculate total votes for a poll
  calculateTotalVotes(poll) {
    if (!poll.options || !Array.isArray(poll.options)) return 0
    return poll.options.reduce((sum, option) => sum + (option.votes || 0), 0)
  }

  initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      const initialData = {
        feedback: [
          // Initial feedback will be empty, user akan submit feedback sendiri
        ],
        polls: [
          {
            id: 1,
            question: "Acara apa yang paling Anda inginkan di Kedai Sepijak?",
            description: "Pilih acara favorit Anda untuk bulan ini",
            is_active: 0, // Nonaktifkan poll ini
            status: 'completed',
            start_date: '2025-11-13',
            end_date: '2025-11-20',
            total_votes: 0, // Will be calculated from options
            created_at: '2025-11-13 10:00:00',
            updated_at: '2025-11-13 10:00:00',
            admin_id: 1, // Sesuai dengan database field
            options: [
              { 
                id: 1, 
                poll_id: 1, // Sesuai dengan database field name
                option_text: "Live Music Acoustic", 
                votes: 23,
                created_at: '2025-11-13 10:00:00',
                updated_at: '2025-11-13 10:00:00'
              },
              { 
                id: 2, 
                poll_id: 1,
                option_text: "Workshop Barista", 
                votes: 18,
                created_at: '2025-11-13 10:00:00',
                updated_at: '2025-11-13 10:00:00'
              },
              { 
                id: 3, 
                poll_id: 1,
                option_text: "Pameran Seni Lokal", 
                votes: 15,
                created_at: '2025-11-13 10:00:00',
                updated_at: '2025-11-13 10:00:00'
              },
              { 
                id: 4, 
                poll_id: 1,
                option_text: "Book Reading Club", 
                votes: 12,
                created_at: '2025-11-13 10:00:00',
                updated_at: '2025-11-13 10:00:00'
              }
            ]
          },
          {
            id: 2,
            question: "Jam berapa Anda paling suka minum kopi?",
            description: "Survey waktu favorit pelanggan",
            is_active: 0,
            status: 'completed',
            start_date: '2025-11-06',
            end_date: '2025-11-12',
            total_votes: 0,
            created_at: '2025-11-06 09:00:00',
            updated_at: '2025-11-12 18:00:00',
            admin_id: 1,
            options: [
              { 
                id: 5, 
                poll_id: 2,
                option_text: "Pagi (06:00-10:00)", 
                votes: 45,
                created_at: '2025-11-06 09:00:00',
                updated_at: '2025-11-12 18:00:00'
              },
              { 
                id: 6, 
                poll_id: 2,
                option_text: "Siang (10:00-15:00)", 
                votes: 28,
                created_at: '2025-11-06 09:00:00',
                updated_at: '2025-11-12 18:00:00'
              },
              { 
                id: 7, 
                poll_id: 2,
                option_text: "Sore (15:00-18:00)", 
                votes: 19,
                created_at: '2025-11-06 09:00:00',
                updated_at: '2025-11-12 18:00:00'
              },
              { 
                id: 8, 
                poll_id: 2,
                option_text: "Malam (18:00-21:00)", 
                votes: 8,
                created_at: '2025-11-06 09:00:00',
                updated_at: '2025-11-12 18:00:00'
              }
            ]
          },
          {
            id: 3,
            question: "Menu minuman baru apa yang ingin ditambahkan?",
            description: "Usulan menu dari pelanggan setia",
            is_active: 1, // Aktifkan poll ini
            status: 'active',
            start_date: '2025-11-13',
            end_date: '2025-11-20',
            total_votes: 0,
            created_at: '2025-11-13 14:30:00',
            updated_at: '2025-11-13 14:30:00',
            admin_id: 1,
            options: [
              { 
                id: 9, 
                poll_id: 3,
                option_text: "Matcha Latte Premium", 
                votes: 0,
                created_at: '2025-11-10 14:30:00',
                updated_at: '2025-11-10 14:30:00'
              },
              { 
                id: 10, 
                poll_id: 3,
                option_text: "Teh Tarik Signature", 
                votes: 0,
                created_at: '2025-11-10 14:30:00',
                updated_at: '2025-11-10 14:30:00'
              },
              { 
                id: 11, 
                poll_id: 3,
                option_text: "Cold Brew Vanilla", 
                votes: 0,
                created_at: '2025-11-10 14:30:00',
                updated_at: '2025-11-10 14:30:00'
              }
            ]
          }
        ],
        waiters: [
          { id: 1, name: 'Demo Waiter', status: 'active' },
          { id: 2, name: 'Test Server', status: 'available' }
        ]
      }
      
      // Calculate and set total_votes for each poll
      initialData.polls.forEach(poll => {
        poll.total_votes = this.calculateTotalVotes(poll)
      })
      
      localStorage.setItem(this.storageKey, JSON.stringify(initialData))
    }
  }

  getData() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '{}')
    } catch (error) {
      console.error('Error parsing mock data:', error)
      this.initializeStorage()
      return JSON.parse(localStorage.getItem(this.storageKey) || '{}')
    }
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  // Feedback methods
  getFeedback() {
    return this.getData().feedback || []
  }

  addFeedback(feedbackData) {
    const data = this.getData()
    const newId = Math.max(...data.feedback.map(f => f.id), 0) + 1
    
    const newFeedback = {
      id: newId,
      ...feedbackData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    data.feedback.unshift(newFeedback) // Add to beginning for latest first
    this.saveData(data)
    
    return newFeedback
  }

  // Polls methods
  getPolls() {
    const data = this.getData()
    const polls = data.polls || []
    
    console.log('📊 MockStorage.getPolls() returning:', {
      totalPolls: polls.length,
      activePolls: polls.filter(p => p.is_active === 1 && p.status === 'active').length,
      pollDetails: polls.map(p => ({
        id: p.id,
        question: p.question?.substring(0, 30) + '...',
        is_active: p.is_active,
        status: p.status,
        optionsCount: p.options?.length || 0,
        totalVotes: p.total_votes
      }))
    })
    
    return polls
  }

  addPoll(pollData) {
    const data = this.getData()
    const newId = Math.max(...data.polls.map(p => p.id), 0) + 1
    
    const newPoll = {
      id: newId,
      ...pollData,
      total_votes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 1 // default admin user
    }
    
    // Add option IDs if not provided
    if (newPoll.options && Array.isArray(newPoll.options)) {
      const maxOptionId = Math.max(
        ...data.polls.flatMap(p => p.options?.map(o => o.id) || []), 
        0
      )
      
      newPoll.options = newPoll.options.map((option, index) => ({
        id: maxOptionId + index + 1,
        poll_id: newId, // Fix field name
        option_text: option.option_text || option.text,
        votes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    }
    
    data.polls.unshift(newPoll) // Add to beginning
    this.saveData(data)
    
    return newPoll
  }

  updatePoll(pollId, updates) {
    const data = this.getData()
    const pollIndex = data.polls.findIndex(p => p.id === parseInt(pollId))
    
    if (pollIndex !== -1) {
      data.polls[pollIndex] = {
        ...data.polls[pollIndex],
        ...updates,
        updated_at: new Date().toISOString()
      }
      this.saveData(data)
      return data.polls[pollIndex]
    }
    
    return null
  }

  deletePoll(pollId) {
    const data = this.getData()
    const pollIndex = data.polls.findIndex(p => p.id === parseInt(pollId))
    
    if (pollIndex !== -1) {
      const deletedPoll = data.polls.splice(pollIndex, 1)[0]
      this.saveData(data)
      return deletedPoll
    }
    
    return null
  }

  votePoll(pollId, optionId, voterData = {}) {
    const data = this.getData()
    const poll = data.polls.find(p => p.id === parseInt(pollId))
    
    if (!poll) {
      console.error('Poll not found:', pollId)
      return null
    }
    
    if (!poll.is_active || poll.status !== 'active') {
      console.error('Poll is not active:', { 
        pollId, 
        is_active: poll.is_active, 
        status: poll.status,
        question: poll.question 
      })
      return null
    }
    
    console.log('✅ Poll is active, processing vote:', {
      pollId,
      question: poll.question,
      is_active: poll.is_active,
      status: poll.status
    })
    
    if (poll.options) {
      const option = poll.options.find(o => o.id === parseInt(optionId))
      if (option) {
        // Check for duplicate vote (simple phone number check)
        if (!data.poll_votes) {
          data.poll_votes = []
        }
        
        const existingVote = data.poll_votes.find(v => 
          v.poll_id === parseInt(pollId) && 
          v.voter_phone === voterData.phone
        )
        
        if (existingVote && voterData.phone) {
          console.error('Duplicate vote detected for phone:', voterData.phone)
          return { error: 'duplicate_vote', message: 'Nomor ini sudah melakukan vote.' }
        }
        
        // Record the vote
        option.votes += 1
        poll.total_votes = this.calculateTotalVotes(poll) // Recalculate total
        poll.updated_at = new Date().toISOString()
        
        // Save vote record
        data.poll_votes.push({
          id: Date.now(),
          poll_id: parseInt(pollId),
          option_id: parseInt(optionId),
          voter_name: voterData.name || '',
          voter_phone: voterData.phone || '',
          voter_email: voterData.email || '',
          created_at: new Date().toISOString()
        })
        
        this.saveData(data)
        
        console.log('🗳️ Vote recorded:', { 
          pollId, 
          optionId, 
          voterPhone: voterData.phone,
          newVoteCount: option.votes,
          totalVotes: poll.total_votes
        })
        
        return poll
      } else {
        console.error('Option not found:', optionId)
      }
    }
    
    return null
  }

  // Waiters methods
  getWaiters() {
    return this.getData().waiters || []
  }

  // Force refresh data (trigger change event)
  forceRefresh() {
    const data = this.getData()
    // Add a timestamp to force reactivity
    data._lastUpdated = Date.now()
    this.saveData(data)
    console.log('🔄 Mock storage force refreshed at:', new Date().toLocaleTimeString())
  }

  // Clear all mock data
  clearData() {
    localStorage.removeItem(this.storageKey)
    this.initializeStorage()
    console.log('🗑️ Mock data cleared and reinitialized')
  }

  // Reset polling data specifically
  resetPollingData() {
    localStorage.removeItem(this.storageKey)
    this.initializeStorage()
    this.forceRefresh()
    console.log('🔄 Polling data reset with new structure')
  }
}

// Create singleton instance
const mockStorage = new MockStorage()

export default mockStorage
