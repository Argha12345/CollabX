const express = require('express');
const router = express.Router();
const { getBoard, createList, createCard, updateCardState, deleteCard, deleteList, reorderCards, handleAiCard } = require('../controllers/kanbanController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/:workspaceId', protect, getBoard);
router.post('/list', protect, createList);
router.route('/list/:id')
  .delete(protect, deleteList);
router.post('/card', protect, createCard);
router.post('/ai-card', protect, handleAiCard);
router.route('/card/:id')
  .put(protect, updateCardState)
  .delete(protect, deleteCard);

router.put('/reorder/cards', protect, reorderCards);

module.exports = router;
