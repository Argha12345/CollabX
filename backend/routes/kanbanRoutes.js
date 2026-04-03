const express = require('express');
const router = express.Router();
const { getBoard, createList, createCard, updateCardState } = require('../controllers/kanbanController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/:workspaceId', protect, getBoard);
router.post('/list', protect, createList);
router.post('/card', protect, createCard);
router.put('/card/:id', protect, updateCardState);

module.exports = router;
