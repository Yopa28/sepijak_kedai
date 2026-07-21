// ============================================
// Reset Mock Data Utility
// Kedai Sepijak Frontend
// ============================================

import mockStorage from './mockStorage'

// Function to reset all mock data with new structure
export const resetAllMockData = () => {
  mockStorage.resetPollingData()
}

// Auto-reset on import if needed
if (import.meta.env.DEV) {
  // Check if we need to reset data (version check)
  const currentVersion = '2.2.0' // Update version untuk force reset
  const storedVersion = localStorage.getItem('kedai_sepijak_data_version')
  
  if (storedVersion !== currentVersion) {
    resetAllMockData()
    localStorage.setItem('kedai_sepijak_data_version', currentVersion)
  }
}

export default { resetAllMockData }
