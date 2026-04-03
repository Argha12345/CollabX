const User = require('./User');
const Workspace = require('./Workspace');
const WorkspaceMember = require('./WorkspaceMember');
const Document = require('./Document');
const KanbanList = require('./KanbanList');
const KanbanCard = require('./KanbanCard');
const Notification = require('./Notification');
const { sequelize } = require('../utils/db');

// Setup Associations
User.hasMany(Workspace, { foreignKey: 'ownerId' });
Workspace.belongsTo(User, { foreignKey: 'ownerId', as: 'owner_user' });

User.belongsToMany(Workspace, { through: WorkspaceMember, foreignKey: 'userId', as: 'workspace_memberships' });
Workspace.belongsToMany(User, { through: WorkspaceMember, foreignKey: 'workspaceId', as: 'workspace_users' });

// Workaround for easy querying via join table directly
User.hasMany(WorkspaceMember, { foreignKey: 'userId' });
WorkspaceMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Workspace.hasMany(WorkspaceMember, { foreignKey: 'workspaceId', as: 'memberDetails' });
WorkspaceMember.belongsTo(Workspace, { foreignKey: 'workspaceId' });

Workspace.hasMany(Document, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
Document.belongsTo(Workspace, { foreignKey: 'workspaceId' });

User.hasMany(Document, { foreignKey: 'createdById' });
Document.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

Workspace.hasMany(KanbanList, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
KanbanList.belongsTo(Workspace, { foreignKey: 'workspaceId' });

KanbanList.hasMany(KanbanCard, { foreignKey: 'listId', onDelete: 'CASCADE', as: 'cards' });
KanbanCard.belongsTo(KanbanList, { foreignKey: 'listId' });

User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Workspace,
  WorkspaceMember,
  Document,
  KanbanList,
  KanbanCard,
  Notification,
  sequelize
};
