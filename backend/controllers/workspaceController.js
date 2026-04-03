const { Workspace, User, WorkspaceMember } = require('../models');

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
    const workspaces = await Workspace.findAll({
      include: [
        {
          model: WorkspaceMember,
          as: 'memberDetails',
          where: { userId: req.user.id }
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

module.exports = { createWorkspace, getWorkspaces, getWorkspaceById };
