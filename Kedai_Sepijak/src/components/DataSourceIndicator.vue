<template>
  <div v-if="showIndicator" class="fixed bottom-4 right-4 z-40">
    <div class="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <div :class="indicatorClass" class="w-3 h-3 rounded-full"></div>
          <span class="text-sm font-medium text-gray-700">{{ dataSource }}</span>
        </div>
        <button @click="hideIndicator" class="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>
      <div class="mt-2 text-xs text-gray-500">
        {{ statusMessage }}
      </div>
      <div v-if="!isRealData" class="mt-2">
        <button @click="showApiSpec" class="text-xs text-blue-600 hover:text-blue-800 underline">
          View API Specification
        </button>
      </div>
    </div>
  </div>

  <!-- API Spec Modal -->
  <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Backend API Requirements</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div class="space-y-4 text-sm">
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Current Status:</h4>
            <p class="text-gray-600">Frontend is using mock data. Backend API endpoints need to be implemented.</p>
          </div>
          
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Required Endpoints:</h4>
            <ul class="list-disc list-inside text-gray-600 space-y-1">
              <li><code class="bg-gray-100 px-1 rounded">GET /api/feedback</code> - Retrieve all feedback</li>
              <li><code class="bg-gray-100 px-1 rounded">POST /api/feedback</code> - Submit new feedback</li>
              <li><code class="bg-gray-100 px-1 rounded">GET /api/polling</code> - Get polling data</li>
              <li><code class="bg-gray-100 px-1 rounded">GET /api/waiters</code> - Get waiters data</li>
            </ul>
          </div>
          
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Database Fields Expected:</h4>
            <div class="bg-gray-50 p-3 rounded text-xs font-mono">
              <div>rating_sikap_pelayan (1-5)</div>
              <div>rating_waktu_pesanan (1-5)</div>
              <div>rating_rasa_menu (1-5)</div>
              <div>rating_kebersihan (1-5)</div>
              <div>role, employee_name, contact</div>
              <div>date_of_visit, time_of_visit</div>
              <div>message, category, voluntary_consent</div>
            </div>
          </div>
          
          <div>
            <p class="text-xs text-gray-500">
              See <code>BACKEND_API_SPEC.md</code> for complete specification.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataSourceIndicator',
  data() {
    return {
      showIndicator: true,
      showModal: false,
      isRealData: false // Will be true when backend is connected
    }
  },
  computed: {
    dataSource() {
      return this.isRealData ? 'Real Database' : 'Mock Data'
    },
    indicatorClass() {
      return this.isRealData 
        ? 'bg-green-500 animate-pulse' 
        : 'bg-yellow-500 animate-pulse'
    },
    statusMessage() {
      return this.isRealData 
        ? 'Connected to backend database'
        : 'Using fallback data - Backend API needed'
    }
  },
  methods: {
    hideIndicator() {
      this.showIndicator = false
    },
    showApiSpec() {
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
    },
    checkDataSource() {
      // Check if we're getting real data or mock data
      // This could be enhanced to actually test API responses
      this.isRealData = import.meta.env.VITE_BACKEND_AVAILABLE === 'true'
    }
  },
  mounted() {
    this.checkDataSource()
    
    // Auto-hide after 10 seconds if real data
    if (this.isRealData) {
      setTimeout(() => {
        this.showIndicator = false
      }, 10000)
    }
  }
}
</script>

<style scoped>
/* Component styles handled by Tailwind */
</style>
