const { Workspace, User, WorkspaceMember, Notification } = require('../models');
const nodemailer = require('nodemailer');

const createWorkspace = async (req, res) => {
  const { name, description } = req.body;
  try {
    const workspace = await Workspace.create({
      name,
      description,
      ownerId: req.user.id,
    });

    await WorkspaceMember.create({
      userId: req.user.id,
      workspaceId: workspace.id,
      role: 'admin'
    });

    res.status(201).json({ ...workspace.toJSON(), _id: workspace.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWorkspaces = async (req, res) => {
  try {
    const myMemberships = await WorkspaceMember.findAll({
      where: { userId: req.user.id },
      attributes: ['workspaceId']
    });
    
    if (myMemberships.length === 0) {
      return res.json([]);
    }

    const workspaceIds = myMemberships.map(m => m.workspaceId);

    const workspaces = await Workspace.findAll({
      where: { id: workspaceIds },
      include: [
        {
          model: WorkspaceMember,
          as: 'memberDetails',
        }
      ]
    });
    
    const formatted = workspaces.map(w => {
       const json = w.toJSON();
       return { ...json, _id: json.id, members: json.memberDetails };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id, {
      include: [
        {
          model: WorkspaceMember,
          as: 'memberDetails',
          include: [{ model: User, as: 'user', attributes: ['name', 'email', 'avatar'] }]
        }
      ]
    });
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const json = workspace.toJSON();
    const isMember = json.memberDetails.some(m => m.userId === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized for this workspace' });
    }

    res.json({ ...json, _id: json.id, members: json.memberDetails });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    if (workspace.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this workspace' });
    }

    await workspace.destroy();
    res.json({ message: 'Workspace removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addMember = async (req, res) => {
  try {
    const { email } = req.body;
    const workspace = await Workspace.findByPk(req.params.id);
    
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (workspace.ownerId !== req.user.id) return res.status(403).json({ message: 'Only workspace owners can add members' });
    
    const targetUser = await User.findOne({ where: { email } });
    if (!targetUser) return res.status(404).json({ message: 'User with this email perfectly not found' });

    const existingMember = await WorkspaceMember.findOne({
      where: { workspaceId: workspace.id, userId: targetUser.id }
    });

    if (existingMember) return res.status(400).json({ message: 'User is already a member of this workspace' });

    await WorkspaceMember.create({
      workspaceId: workspace.id,
      userId: targetUser.id,
      role: 'member'
    });

    // Create In-App Notification
    try {
      await Notification.create({
        userId: targetUser.id,
        message: `You have been added to the workspace: ${workspace.name}`,
        type: 'workspace_invite',
        link: `/workspace/${workspace.id}`,
        read: false
      });
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      const socketId = userSockets.get(targetUser.id);
      if (io && socketId) {
        io.to(socketId).emit('new-notification', {
           message: `You have been added to the workspace: ${workspace.name}`,
           link: `/workspace/${workspace.id}`
        });
      }
    } catch(e) {
      console.error('Notification record error:', e.message);
    }

    res.json({ message: 'Member added successfully' });
    
    // Dispatch Email Notification
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        }
      });
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
         await transporter.sendMail({
           from: `"CollabX Teams" <${process.env.EMAIL_USER}>`,
           to: targetUser.email,
           subject: `CollabX: You've been added to ${workspace.name}`,
           html: `<h2>Welcome!</h2><p>You have just been added to the CollabX Workspace: <strong>${workspace.name}</strong>.</p><p>Log in to access documents and kanban boards!</p>`
         });
      }
    } catch(err) {
      console.error('Notification error:', err.message);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createWorkspace, getWorkspaces, getWorkspaceById, deleteWorkspace, addMember };
