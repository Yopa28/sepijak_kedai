// ============================================
// Backend Connection Testing Utility
// Kedai Sepijak Frontend
// ============================================

import api from '@/services/api'

/**
 * Test backend connection and polling functionality
 */
export const testBackendConnection = async () => {
  console.log('🧪 Starting Backend Connection Test...')
  
  const results = {
    healthCheck: null,
    activePoll: null,
    voteTest: null,
    pollsList: null,
    errors: []
  }

  try {
    // 1. Test Health Check
    console.log('1️⃣ Testing health check...')
    try {
      const healthResponse = await api.get('/health')
      results.healthCheck = {
        success: true,
        status: healthResponse.status,
        data: healthResponse.data
      }
      console.log('✅ Health check passed:', healthResponse.data)
    } catch (error) {
      results.healthCheck = {
        success: false,
        error: error.message
      }
      results.errors.push(`Health check failed: ${error.message}`)
      console.error('❌ Health check failed:', error.message)
    }

    // 2. Test Get Active Poll
    console.log('2️⃣ Testing get active poll...')
    try {
      const pollResponse = await api.get('/polling/active')
      results.activePoll = {
        success: true,
        status: pollResponse.status,
        data: pollResponse.data
      }
      console.log('✅ Active poll retrieved:', pollResponse.data)
    } catch (error) {
      results.activePoll = {
        success: false,
        error: error.message
      }
      results.errors.push(`Get active poll failed: ${error.message}`)
      console.error('❌ Get active poll failed:', error.message)
    }

    // 3. Test Vote Submission (if active poll exists)
    if (results.activePoll?.success && results.activePoll.data?.data?.id) {
      console.log('3️⃣ Testing vote submission...')
      try {
        const pollId = results.activePoll.data.data.id
        const voteData = {
          name: 'Test User',
          phone: '081234567890',
          email: 'test@example.com',
          option_id: pollId === 3 ? 9 : 1 // Matcha Latte for poll 3
        }

        const voteResponse = await api.post(`/polling/${pollId}/vote`, voteData)
        results.voteTest = {
          success: true,
          status: voteResponse.status,
          data: voteResponse.data
        }
        console.log('✅ Vote submitted successfully:', voteResponse.data)
      } catch (error) {
        results.voteTest = {
          success: false,
          error: error.message
        }
        results.errors.push(`Vote submission failed: ${error.message}`)
        console.error('❌ Vote submission failed:', error.message)
      }
    } else {
      results.voteTest = {
        success: false,
        error: 'No active poll available for voting test'
      }
      results.errors.push('No active poll available for voting test')
    }

    // 4. Test Get All Polls
    console.log('4️⃣ Testing get all polls...')
    try {
      const pollsResponse = await api.get('/polling')
      results.pollsList = {
        success: true,
        status: pollsResponse.status,
        count: pollsResponse.data?.data?.length || 0,
        data: pollsResponse.data
      }
      console.log('✅ Polls list retrieved:', results.pollsList.count, 'polls')
    } catch (error) {
      results.pollsList = {
        success: false,
        error: error.message
      }
      results.errors.push(`Get polls list failed: ${error.message}`)
      console.error('❌ Get polls list failed:', error.message)
    }

  } catch (error) {
    results.errors.push(`General test error: ${error.message}`)
    console.error('❌ General test error:', error.message)
  }

  // Summary
  console.log('\n📊 Test Results Summary:')
  console.log('Health Check:', results.healthCheck?.success ? '✅ PASS' : '❌ FAIL')
  console.log('Active Poll:', results.activePoll?.success ? '✅ PASS' : '❌ FAIL')
  console.log('Vote Test:', results.voteTest?.success ? '✅ PASS' : '❌ FAIL')
  console.log('Polls List:', results.pollsList?.success ? '✅ PASS' : '❌ FAIL')
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:')
    results.errors.forEach(error => console.log('  -', error))
  }

  return results
}

/**
 * Quick connection test
 */
export const quickConnectionTest = async () => {
  try {
    const response = await api.get('/health')
    return {
      connected: true,
      message: 'Backend is running',
      data: response.data
    }
  } catch (error) {
    return {
      connected: false,
      message: error.message,
      suggestion: 'Make sure your backend server is running on http://localhost:5000'
    }
  }
}

export default {
  testBackendConnection,
  quickConnectionTest
}
