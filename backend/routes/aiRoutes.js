const express = require('express');
const router = express.Router();
const { generateSuggestion, queryWorkspace, getWorkspaceStandup } = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/suggest', protect, generateSuggestion);
router.post('/query-workspace', protect, queryWorkspace);
router.post('/workspace-standup', protect, getWorkspaceStandup);

module.exports = router;
