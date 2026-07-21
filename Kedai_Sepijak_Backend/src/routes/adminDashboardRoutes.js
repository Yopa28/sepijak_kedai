// ============================================
// Admin Dashboard Routes
// Kedai Sepijak Backend
// ============================================

const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', authenticate, adminDashboardController.getStatistics);

/**
 * @route   GET /api/dashboard/recent-feedback
 * @desc    Get recent feedback
 * @access  Private
 */
router.get('/recent-feedback', authenticate, adminDashboardController.getRecentFeedback);

/**
 * @route   GET /api/dashboard/active-polls
 * @desc    Get active polls
 * @access  Private
 */
router.get('/active-polls', authenticate, adminDashboardController.getActivePolls);

/**
 * @route   GET /api/dashboard/top-waiters
 * @desc    Get top rated waiters
 * @access  Private
 */
router.get('/top-waiters', authenticate, adminDashboardController.getTopWaiters);

/**
 * @route   GET /api/dashboard/feedback-trend
 * @desc    Get feedback trend data
 * @access  Private
 */
router.get('/feedback-trend', authenticate, adminDashboardController.getFeedbackTrend);

/**
 * @route   GET /api/dashboard/feedback-by-category
 * @desc    Get feedback grouped by category
 * @access  Private
 */
router.get('/feedback-by-category', authenticate, adminDashboardController.getFeedbackByCategory);

module.exports = router;
