// ============================================
// Dashboard Store
// Kedai Sepijak Frontend
// ============================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getDashboardStats, getRecentFeedback, getFeedbackByCategory, clearDashboardCache, refreshDashboardData } from '@/services/dashboardAPI'
import eventBus from '@/utils/eventBus'

export const useDashboardStore = defineStore("dashboard", () => {
  // State
  const statistics = ref({
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
    rating_trend: "stable",
  });

  const recentFeedback = ref([]);
  const activePolls = ref([]);
  const topWaiters = ref([]);
  const feedbackByCategory = ref([]);
  const feedbackTrend = ref([]);
  const voucherStatistics = ref({
    total: 0,
    available: 0,
    used: 0,
    expired: 0,
    created_today: 0,
    used_today: 0,
    usage_rate: 0,
  });

  const loading = ref(false);
  const error = ref(null);

  // Actions
  async function fetchDashboardData(forceRefresh = false) {
    loading.value = true;
    error.value = null;

    try {
      const response = await getDashboardStats(forceRefresh);

      if (response.success) {
        const data = response.data;

        // Update statistics with real data
        statistics.value = data.statistics;
        
        // Update other data if available
        if (data.recent_feedback) {
          recentFeedback.value = data.recent_feedback;
        }
        
        if (data.active_polls) {
          activePolls.value = data.active_polls;
        }
        
        if (data.top_waiters) {
          topWaiters.value = data.top_waiters;
        }

        // Only log in debug mode
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
          console.log("✅ Dashboard data updated successfully");
        }
        return { success: true };
      } else {
        throw new Error(response.message || "Gagal memuat data dashboard");
      }
    } catch (err) {
      console.error("🚨 Dashboard fetch error:", err);
      error.value = err.message || "Terjadi kesalahan saat memuat data dashboard";
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function fetchRecentFeedback() {
    try {
      const response = await getRecentFeedback(5);
      if (response.success) {
        recentFeedback.value = response.data;
      }
      return response;
    } catch (err) {
      console.error("Error fetching recent feedback:", err);
      return { success: false, message: err.message };
    }
  }

  async function fetchFeedbackByCategory() {
    try {
      const response = await getFeedbackByCategory();
      if (response.success) {
        feedbackByCategory.value = response.data;
      }
      return response;
    } catch (err) {
      console.error("Error fetching feedback by category:", err);
      return { success: false, message: err.message };
    }
  }

  function clearError() {
    error.value = null;
  }

  function resetDashboard() {
    statistics.value = {
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
      rating_trend: "stable",
    };
    recentFeedback.value = [];
    activePolls.value = [];
    topWaiters.value = [];
    feedbackByCategory.value = [];
    feedbackTrend.value = [];
    voucherStatistics.value = {
      total: 0,
      available: 0,
      used: 0,
      expired: 0,
      created_today: 0,
      used_today: 0,
      usage_rate: 0,
    };
  }

  return {
    // State
    statistics,
    recentFeedback,
    activePolls,
    topWaiters,
    feedbackByCategory,
    feedbackTrend,
    voucherStatistics,
    loading,
    error,

    // Actions
    fetchDashboardData,
    fetchRecentFeedback,
    fetchFeedbackByCategory,
    clearError,
    resetDashboard,
  };
});