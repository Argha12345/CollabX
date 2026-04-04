const express = require('express');
const router = express.Router();
const { createDocument, getWorkspaceDocuments, getDocumentById, deleteDocument, updateDocument, getDocumentLogs } = require('../controllers/documentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createDocument);
router.get('/workspace/:workspaceId', protect, getWorkspaceDocuments);
router.route('/:id')
  .get(protect, getDocumentById)
  .put(protect, updateDocument)
  .delete(protect, deleteDocument);

router.get('/:id/logs', protect, getDocumentLogs);

module.exports = router;
