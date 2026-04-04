const express = require('express');
const router = express.Router();
const { createWorkspace, getWorkspaces, getWorkspaceById, deleteWorkspace, addMember } = require('../controllers/workspaceController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, createWorkspace)
  .get(protect, getWorkspaces);

router.route('/:id')
  .get(protect, getWorkspaceById)
  .delete(protect, deleteWorkspace);

router.route('/:id/members')
  .post(protect, addMember);

module.exports = router;
