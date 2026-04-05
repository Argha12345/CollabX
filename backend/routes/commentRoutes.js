const express = require('express');
const router = express.Router();
const { getComments, createComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/document/:documentId', protect, getComments);
router.post('/', protect, createComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
