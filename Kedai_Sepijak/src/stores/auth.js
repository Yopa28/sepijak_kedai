import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";

// Temporarily disable security imports to fix network errors
// import { sessionManager, detectSuspiciousActivity } from "@/middleware/auth";
// import { rateLimiter, sanitize, validate } from "@/utils/security";

// Simple fallback functions
const fallbackSanitize = {
  text: (input, maxLength = 1000) => {
    if (!input || typeof input !== 'string') return '';
    return input.trim().slice(0, maxLength);
  }
};

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const isAuthenticated = ref(false);
  const loading = ref(false);
  const error = ref(null);

  const isAdmin = computed(() =>
    ["super_admin", "admin"].includes(user.value?.role)
  );
  const userName = computed(() => user.value?.full_name || "Admin");
  const userRole = computed(() => user.value?.role || "");

  async function login(username, password) {
    loading.value = true; 
    error.value = null;
    
    try {
      // Simple input validation
      const cleanUsername = fallbackSanitize.text(username, 50);
      
      if (!cleanUsername || cleanUsername.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      const res = await api.post("/auth/login", { 
        username: cleanUsername, 
        password: password 
      }, { withCredentials: true });
      
      if (!res.data?.success) {
        // Log failed login attempt
        const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        logs.push({
          event: 'login_failed',
          data: { username: cleanUsername },
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('security_logs', JSON.stringify(logs));
        
        throw new Error(res.data?.message || "Login gagal");
      }

      user.value = res.data.data;
      isAuthenticated.value = true;
      
      // Store token securely with timestamp
      const token = res.data.token;
      localStorage.setItem("admin_user", JSON.stringify(res.data.data));
      localStorage.setItem("admin_token", token);
      localStorage.setItem("auth_timestamp", Date.now().toString());
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      if (import.meta.env.VITE_DEBUG_MODE === 'true') {
        console.log('✅ Login successful for:', cleanUsername);
      }

      return { success: true, data: res.data.data };
    } catch (err) {
      error.value = err.response?.data?.message || err.message || "Terjadi kesalahan saat login";
      isAuthenticated.value = false; user.value = null;
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try { 
      await api.post("/auth/logout", {}, { withCredentials: true }); 
    } catch (err) {
      console.warn('Logout API call failed:', err.message);
    }
    
    // Cleanup
    user.value = null; 
    isAuthenticated.value = false;
    
    // Clear all stored data
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_token");
    
    // Clear API headers
    delete api.defaults.headers.common["Authorization"];
    
    console.log('✅ Logout completed');
  }

  async function checkSession() {
    loading.value = true;
    try {
      const res = await api.get("/auth/session", { withCredentials: true });
      if (res.data?.success && res.data?.logged_in) {
        user.value = res.data.data; isAuthenticated.value = true;
        localStorage.setItem("admin_user", JSON.stringify(res.data.data));
        // kalau backend juga set cookie, header masih tetap dari localStorage
        return true;
      }
      user.value = null; isAuthenticated.value = false;
      localStorage.removeItem("admin_user"); localStorage.removeItem("admin_token");
      delete api.defaults.headers.common["Authorization"];
      return false;
    } catch {
      user.value = null; isAuthenticated.value = false;
      localStorage.removeItem("admin_user"); localStorage.removeItem("admin_token");
      delete api.defaults.headers.common["Authorization"];
      return false;
    } finally { loading.value = false; }
  }

  // Simple session validation methods
  function isSessionExpired() {
    // Simple check - if no user data, consider expired
    return !user.value || !localStorage.getItem("admin_token");
  }
  
  function validateSession() {
    if (isSessionExpired()) {
      logout();
      return false;
    }
    return true;
  }

  function initFromStorage() {
    const storedUser = localStorage.getItem("admin_user");
    const storedToken = localStorage.getItem("admin_token");
    
    if (storedUser && storedToken) {
      try {
        // Simple session validation without sessionManager
        // Check if token is not too old (24 hours)
        const tokenAge = Date.now() - parseInt(localStorage.getItem("auth_timestamp") || "0");
        if (tokenAge > 24 * 60 * 60 * 1000) {
          console.warn('🔒 Session expired, clearing stored data');
          logout();
          return;
        }
        
        user.value = JSON.parse(storedUser);
        isAuthenticated.value = true;
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        
        // Session restored from storage silently
      } catch (err) {
        console.error('🚨 Invalid stored data:', err);
        localStorage.removeItem("admin_user");
        localStorage.removeItem("admin_token");
      }
    }
  }

  function clearError() { error.value = null; }
  initFromStorage();

  return { 
    user, 
    isAuthenticated, 
    loading, 
    error, 
    isAdmin, 
    userName, 
    userRole, 
    userId: computed(() => user.value?.id),
    login, 
    logout, 
    checkSession, 
    initFromStorage, 
    clearError,
    isSessionExpired,
    validateSession
  };
});
