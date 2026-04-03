const express = require('express');
const router = express.Router();
const { generateSuggestion } = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/suggest', protect, generateSuggestion);

module.exports = router;
