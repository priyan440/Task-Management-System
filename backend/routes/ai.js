const express = require('express');
const router = express.Router();
const { getTaskSuggestions, getMotivationalQuote } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// Public route
router.get('/quote', getMotivationalQuote);

// Protected suggestion endpoint
router.post('/suggest', protect, getTaskSuggestions);

module.exports = router;
