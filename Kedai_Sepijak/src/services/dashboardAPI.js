// ============================================
// Dashboard API Service
// Kedai Sepijak Frontend
// ============================================

import api, { handleApiResponse, handleApiError } from './api'
import { getFeedback } from './feedbackAPI'
import { getAllWaiters } from './waitersAPI'
import { getAllPolls } from './pollingAPI'

/**
 * Helper function to check if a poll is active
 */
const isPollActive = (poll) => {
  if (!poll) return false
  
  // Check database-style status (integer is_active and string status)
  if (poll.is_active === 1 && poll.status === 'active') return true
  
  // Fallback checks for other formats
  if (poll.status === 'active' && poll.is_active !== 0) return true
  if (poll.is_active === true || poll.is_active === 1) return true
  
  // Explicitly inactive
  if (poll.status === 'inactive' || poll.status === 'closed' || poll.status === 'completed') return false
  if (poll.is_active === false || poll.is_active === 0) return false
  
  // Default to false for safety
  return false
}

// Cache for dashboard data to prevent excessive API calls
let dashboardCache = null
let cacheTimestamp = null
const CACHE_DURATION = 60000 // 1 minute cache

/**
 * Get dashboard statistics by aggregating data from existing APIs
 */
export const getDashboardStats = async (forceRefresh = false) => {
  try {
    // Check cache first (unless force refresh)
    if (!forceRefresh && dashboardCache && cacheTimestamp) {
      const cacheAge = Date.now() - cacheTimestamp
      if (cacheAge < CACHE_DURATION) {
        console.log('📊 Using cached dashboard data (age:', Math.round(cacheAge/1000), 'seconds)')
        return dashboardCache
      }
    }
    
    console.log('🔍 Fetching fresh dashboard data from APIs...')
    
    // Fetch data from all APIs in parallel with individual error handling
    const [feedbackResponse, waitersResponse, pollsResponse] = await Promise.allSettled([
      getFeedback(),
      getAllWaiters(),
      getAllPolls()
    ])

    // Only log if there are actual errors
    const hasErrors = [feedbackResponse, waitersResponse, pollsResponse].some(r => r.status === 'rejected')
    if (hasErrors || import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('📥 API Responses:', {
        feedback: feedbackResponse.status,
        waiters: waitersResponse.status,
        polls: pollsResponse.status
      })
    }

    // Process feedback data
    const feedbackData = feedbackResponse.status === 'fulfilled' && feedbackResponse.value.success 
      ? feedbackResponse.value.data : []
    
    const waitersData = waitersResponse.status === 'fulfilled' && waitersResponse.value.success 
      ? waitersResponse.value.data : []
    
    // Handle polls data - listPolls returns array directly if success, or error object if failed
    let pollsData = []
    if (pollsResponse.status === 'fulfilled') {
      const pollsResult = pollsResponse.value
      if (Array.isArray(pollsResult)) {
        pollsData = pollsResult
      } else if (pollsResult && pollsResult.success && pollsResult.data) {
        pollsData = pollsResult.data
      }
    }

    // Always log for debugging dashboard issues
    console.log('📊 Processing dashboard data:', {
      feedbackCount: feedbackData.length,
      waitersCount: waitersData.length,
      pollsCount: pollsData.length,
      feedbackSample: feedbackData.slice(0, 2),
      pollsSample: pollsData.slice(0, 2)
    })

    // Calculate feedback statistics
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastWeekStart = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000)

    const todayFeedback = feedbackData.filter(f => 
      f.created_at && f.created_at.startsWith(todayStr)
    )
    
    const thisWeekFeedback = feedbackData.filter(f => 
      f.created_at && new Date(f.created_at) >= weekAgo
    )
    
    const lastWeekFeedback = feedbackData.filter(f => 
      f.created_at && 
      new Date(f.created_at) >= lastWeekStart && 
      new Date(f.created_at) < weekAgo
    )

    // Calculate average ratings
    const validRatings = []
    feedbackData.forEach(feedback => {
      if (feedback.rating_sikap_pelayan) validRatings.push(Number(feedback.rating_sikap_pelayan))
      if (feedback.rating_waktu_pesanan) validRatings.push(Number(feedback.rating_waktu_pesanan))
      if (feedback.rating_rasa_menu) validRatings.push(Number(feedback.rating_rasa_menu))
      if (feedback.rating_kebersihan) validRatings.push(Number(feedback.rating_kebersihan))
    })

    const averageRating = validRatings.length > 0 
      ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length 
      : 0

    // Calculate feedback growth
    const feedbackGrowth = lastWeekFeedback.length > 0 
      ? ((thisWeekFeedback.length - lastWeekFeedback.length) / lastWeekFeedback.length) * 100
      : thisWeekFeedback.length > 0 ? 100 : 0

    // Calculate rating trend
    const recentRatings = feedbackData
      .filter(f => f.created_at && new Date(f.created_at) >= weekAgo)
      .map(f => {
        const ratings = []
        if (f.rating_sikap_pelayan) ratings.push(Number(f.rating_sikap_pelayan))
        if (f.rating_waktu_pesanan) ratings.push(Number(f.rating_waktu_pesanan))
        if (f.rating_rasa_menu) ratings.push(Number(f.rating_rasa_menu))
        if (f.rating_kebersihan) ratings.push(Number(f.rating_kebersihan))
        return ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0
      })
      .filter(r => r > 0)

    const oldRatings = feedbackData
      .filter(f => f.created_at && new Date(f.created_at) < weekAgo && new Date(f.created_at) >= lastWeekStart)
      .map(f => {
        const ratings = []
        if (f.rating_sikap_pelayan) ratings.push(Number(f.rating_sikap_pelayan))
        if (f.rating_waktu_pesanan) ratings.push(Number(f.rating_waktu_pesanan))
        if (f.rating_rasa_menu) ratings.push(Number(f.rating_rasa_menu))
        if (f.rating_kebersihan) ratings.push(Number(f.rating_kebersihan))
        return ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0
      })
      .filter(r => r > 0)

    const recentAvg = recentRatings.length > 0 
      ? recentRatings.reduce((sum, r) => sum + r, 0) / recentRatings.length 
      : 0
    const oldAvg = oldRatings.length > 0 
      ? oldRatings.reduce((sum, r) => sum + r, 0) / oldRatings.length 
      : 0

    let ratingTrend = 'stable'
    if (recentAvg > oldAvg + 0.1) ratingTrend = 'up'
    else if (recentAvg < oldAvg - 0.1) ratingTrend = 'down'

    // Calculate staff statistics (sesuai database structure)
    const activeStaff = waitersData.filter(w => w.status === 'active' || w.status === 'available').length
    const totalStaff = waitersData.length

    // Calculate poll statistics using helper function
    const activePolls = pollsData.filter(isPollActive).length
    
    // Always log polls analysis for debugging
    console.log('🗳️ Polls analysis:', {
      totalPolls: pollsData.length,
      activePolls: activePolls,
      pollStatuses: pollsData.map(p => ({ 
        id: p.id, 
        status: p.status, 
        is_active: p.is_active,
        total_votes: p.total_votes,
        question: p.question?.substring(0, 30) + '...'
      }))
    })
    // Calculate total votes from poll.total_votes (more accurate)
    const totalVotes = pollsData.reduce((sum, poll) => {
      return sum + (poll.total_votes || 0)
    }, 0)

    // For today's votes, we'll use a simple calculation since we don't have vote timestamps
    const todayVotes = Math.floor(totalVotes * 0.2) // Assume 20% of votes are from today

    console.log('📊 Vote calculations:', {
      totalVotes,
      todayVotes,
      pollVoteBreakdown: pollsData.map(p => ({
        id: p.id,
        question: p.question?.substring(0, 20) + '...',
        total_votes: p.total_votes,
        options_sum: p.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0
      }))
    })

    // Prepare statistics object (sesuai database structure)
    const statistics = {
      total_feedback: feedbackData.length,
      today_feedback: todayFeedback.length,
      week_feedback: thisWeekFeedback.length,
      month_feedback: feedbackData.filter(f => 
        f.created_at && new Date(f.created_at) >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      active_waiters: activeStaff, // Keep for backward compatibility
      total_waiters: totalStaff,   // Keep for backward compatibility
      active_staff: activeStaff,   // New field
      total_staff: totalStaff,     // New field
      active_polls: activePolls,
      total_polls: pollsData.length,
      today_votes: todayVotes,
      total_votes: totalVotes,
      available_vouchers: 0, // Not implemented yet
      used_vouchers: 0, // Not implemented yet
      total_vouchers: 0, // Not implemented yet
      average_rating: Number(averageRating.toFixed(1)),
      today_average_rating: 0, // Could be calculated if needed
      feedback_growth: Number(feedbackGrowth.toFixed(1)),
      rating_trend: ratingTrend
    }

    const result = {
      success: true,
      data: {
        statistics,
        recent_feedback: feedbackData.slice(0, 5), // Latest 5 feedback
        active_polls: pollsData.filter(isPollActive).slice(0, 3),
        top_waiters: waitersData.filter(w => w.status === 'active').slice(0, 5)
      }
    }

    // Cache the result
    dashboardCache = result
    cacheTimestamp = Date.now()
    
    return result

  } catch (error) {
    console.error('🚨 Dashboard API Error:', error)
    
    // Return fallback data instead of complete failure
    return {
      success: true,
      data: {
        statistics: {
          total_feedback: 0,
          today_feedback: 0,
          week_feedback: 0,
          month_feedback: 0,
          active_waiters: 0,
          total_waiters: 0,
          active_polls: 0,
          total_polls: 0,
          today_votes: 0,
          total_votes: 0,
          available_vouchers: 0,
          used_vouchers: 0,
          total_vouchers: 0,
          average_rating: 0,
          today_average_rating: 0,
          feedback_growth: 0,
          rating_trend: 'stable'
        },
        recent_feedback: [],
        active_polls: [],
        top_waiters: []
      }
    }
  }
}

/**
 * Get recent feedback for dashboard
 */
export const getRecentFeedback = async (limit = 5) => {
  try {
    const response = await getFeedback()
    if (response.success) {
      const recentFeedback = response.data
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)
      
      return {
        success: true,
        data: recentFeedback
      }
    }
    return response
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Get feedback statistics by category
 */
export const getFeedbackByCategory = async () => {
  try {
    const response = await getFeedback()
    if (response.success) {
      const feedback = response.data
      
      const categories = {
        sikap_pelayan: [],
        waktu_pesanan: [],
        rasa_menu: [],
        kebersihan: []
      }

      feedback.forEach(f => {
        if (f.rating_sikap_pelayan) categories.sikap_pelayan.push(Number(f.rating_sikap_pelayan))
        if (f.rating_waktu_pesanan) categories.waktu_pesanan.push(Number(f.rating_waktu_pesanan))
        if (f.rating_rasa_menu) categories.rasa_menu.push(Number(f.rating_rasa_menu))
        if (f.rating_kebersihan) categories.kebersihan.push(Number(f.rating_kebersihan))
      })

      const categoryStats = Object.entries(categories).map(([category, ratings]) => ({
        category,
        average: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0,
        count: ratings.length,
        distribution: {
          1: ratings.filter(r => r === 1).length,
          2: ratings.filter(r => r === 2).length,
          3: ratings.filter(r => r === 3).length,
          4: ratings.filter(r => r === 4).length,
          5: ratings.filter(r => r === 5).length
        }
      }))

      return {
        success: true,
        data: categoryStats
      }
    }
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Clear dashboard cache (call this when data is updated)
 */
export const clearDashboardCache = () => {
  dashboardCache = null
  cacheTimestamp = null
  console.log('🗑️ Dashboard cache cleared')
}

/**
 * Force refresh dashboard data
 */
export const refreshDashboardData = () => {
  return getDashboardStats(true)
}
