const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/feedbackController')

// POST feedback dari frontend
router.post('/', ctrl.createFeedback)

// List untuk admin (dengan filter opsional)
router.get('/', ctrl.listFeedback)

// Detail (opsional)
router.get('/:id', ctrl.getFeedbackById)

module.exports = router
