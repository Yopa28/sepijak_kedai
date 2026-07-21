<template>
  <div class="fixed bottom-4 right-4 z-50" v-if="showDebugger">
    <div class="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-sm">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-gray-800">API Debugger</h3>
        <button 
          @click="showDebugger = false"
          class="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <div class="space-y-2 text-sm">
        <div class="flex items-center gap-2">
          <div :class="connectionStatus.success ? 'bg-green-500' : 'bg-red-500'" 
               class="w-2 h-2 rounded-full"></div>
          <span>API Connection: {{ connectionStatus.success ? 'OK' : 'Failed' }}</span>
        </div>
        
        <div v-if="!connectionStatus.success" class="text-red-600 text-xs">
          {{ connectionStatus.message }}
        </div>
        
        <button 
          @click="testConnection"
          :disabled="testing"
          class="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
        >
          {{ testing ? 'Testing...' : 'Test Connection' }}
        </button>
        
        <button 
          @click="testAllEndpoints"
          :disabled="testing"
          class="w-full bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
        >
          Test All Endpoints
        </button>
      </div>
      
      <div v-if="endpointResults.length > 0" class="mt-3 border-t pt-3">
        <h4 class="text-xs font-semibold mb-2">Endpoint Status:</h4>
        <div class="space-y-1">
          <div v-for="result in endpointResults" :key="result.name" 
               class="flex items-center gap-2 text-xs">
            <div :class="result.success ? 'bg-green-500' : 'bg-red-500'" 
                 class="w-1.5 h-1.5 rounded-full"></div>
            <span>{{ result.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Toggle Button -->
  <button 
    v-if="!showDebugger"
    @click="showDebugger = true"
    class="fixed bottom-4 right-4 z-50 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600"
    title="Open API Debugger"
  >
    🔧
  </button>
</template>

<script>
import { testApiConnection, testEndpoints } from '@/utils/apiTest'

export default {
  name: 'ApiDebugger',
  data() {
    return {
      showDebugger: false,
      testing: false,
      connectionStatus: { success: null, message: '' },
      endpointResults: []
    }
  },
  methods: {
    async testConnection() {
      this.testing = true
      try {
        this.connectionStatus = await testApiConnection()
      } catch (error) {
        this.connectionStatus = {
          success: false,
          message: error.message
        }
      } finally {
        this.testing = false
      }
    },
    
    async testAllEndpoints() {
      this.testing = true
      try {
        this.endpointResults = await testEndpoints()
      } catch (error) {
        console.error('Endpoint testing failed:', error)
      } finally {
        this.testing = false
      }
    }
  },
  async mounted() {
    // Auto-test connection on mount in development
    if (import.meta.env.DEV) {
      await this.testConnection()
    }
  }
}
</script>

<style scoped>
/* Component styles are handled by Tailwind */
</style>
