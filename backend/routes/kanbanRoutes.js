const express = require('express');
const router = express.Router();
const { getBoard, createList, createCard, updateCardState, deleteCard, deleteList } = require('../controllers/kanbanController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/:workspaceId', protect, getBoard);
router.post('/list', protect, createList);
router.route('/list/:id')
  .delete(protect, deleteList);
router.post('/card', protect, createCard);
router.route('/card/:id')
  .put(protect, updateCardState)
  .delete(protect, deleteCard);

module.exports = router;
