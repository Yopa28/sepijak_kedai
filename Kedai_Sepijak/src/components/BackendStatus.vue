<template>
  <!-- Development mode banner removed - not useful for production -->
</template>

<script>
import { testApiConnection } from '@/utils/apiTest'

export default {
  name: 'BackendStatus',
  data() {
    return {
      backendAvailable: true,
      showStatus: true,
      checkInterval: null
    }
  },
  methods: {
    async checkBackendStatus() {
      try {
        const result = await testApiConnection()
        this.backendAvailable = result.success
        
        if (!result.success && import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
          console.warn('🔄 Backend not available, using fallback mode')
        }
      } catch (error) {
        this.backendAvailable = false
      }
    },
    
    hideStatus() {
      this.showStatus = false
    },
    
    startStatusCheck() {
      // Check immediately
      this.checkBackendStatus()
      
      // Then check every 2 minutes to reduce spam
      this.checkInterval = setInterval(() => {
        this.checkBackendStatus()
      }, 120000)
    },
    
    stopStatusCheck() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval)
        this.checkInterval = null
      }
    }
  },
  
  mounted() {
    if (import.meta.env.DEV) {
      this.startStatusCheck()
    }
  },
  
  beforeUnmount() {
    this.stopStatusCheck()
  }
}
</script>

<style scoped>
/* Component styles handled by Tailwind */
</style>
