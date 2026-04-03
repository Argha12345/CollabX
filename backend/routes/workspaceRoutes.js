const express = require('express');
const router = express.Router();
const { createWorkspace, getWorkspaces, getWorkspaceById } = require('../controllers/workspaceController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, createWorkspace)
  .get(protect, getWorkspaces);

router.route('/:id')
  .get(protect, getWorkspaceById);

module.exports = router;
