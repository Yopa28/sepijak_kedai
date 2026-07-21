<template>
  <div class="fixed bottom-4 right-4 z-50">
    <div 
      class="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-xs font-medium transition-all duration-300"
      :class="statusClass"
    >
      <div class="w-2 h-2 rounded-full animate-pulse" :class="indicatorClass"></div>
      <span>{{ statusText }}</span>
      <span v-if="isFallbackMode" class="ml-1 opacity-75">(Mock)</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

const isFallbackMode = ref(import.meta.env.DEV && import.meta.env.VITE_FALLBACK_MODE === 'true')
const isBackendAvailable = ref(import.meta.env.VITE_BACKEND_AVAILABLE === 'true')
const connectionStatus = ref('disconnected') // connected, disconnected, fallback

const statusClass = computed(() => {
  switch (connectionStatus.value) {
    case 'connected':
      return 'bg-green-100 text-green-800 border border-green-200'
    case 'fallback':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    case 'disconnected':
      return 'bg-red-100 text-red-800 border border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200'
  }
})

const indicatorClass = computed(() => {
  switch (connectionStatus.value) {
    case 'connected':
      return 'bg-green-500'
    case 'fallback':
      return 'bg-yellow-500'
    case 'disconnected':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
})

const statusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected':
      return 'Database Connected'
    case 'fallback':
      return 'Using Mock Data'
    case 'disconnected':
      return 'Database Offline'
    default:
      return 'Checking...'
  }
})

onMounted(() => {
  if (isFallbackMode.value) {
    connectionStatus.value = 'fallback'
  } else if (isBackendAvailable.value) {
    // Check real database connection
    checkDatabaseConnection()
  } else {
    connectionStatus.value = 'disconnected'
  }
})

async function checkDatabaseConnection() {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:5000/api"
    const response = await fetch(`${API_BASE_URL}/health`)
    if (response.ok) {
      connectionStatus.value = 'connected'
      console.log('✅ Backend database connected successfully')
    } else {
      connectionStatus.value = 'disconnected'
      console.warn('⚠️ Backend database responded with error:', response.status)
    }
  } catch (error) {
    connectionStatus.value = 'disconnected'
    console.error('❌ Backend database connection failed:', error.message)
  }
}
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
