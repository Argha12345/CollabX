const express = require('express');
const router = express.Router();
const { createDocument, getWorkspaceDocuments, getDocumentById } = require('../controllers/documentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createDocument);
router.get('/workspace/:workspaceId', protect, getWorkspaceDocuments);
router.get('/:id', protect, getDocumentById);

module.exports = router;
