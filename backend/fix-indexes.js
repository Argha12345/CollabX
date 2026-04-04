const { sequelize, User, Workspace, WorkspaceMember } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    
    console.log("Dropping corrupt WorkspaceMembers table...");
    await WorkspaceMember.drop();
    
    console.log("Resyncing WorkspaceMembers to create correct indexes...");
    await WorkspaceMember.sync();

    console.log("Restoring Ownership relationships...");
    const workspaces = await Workspace.findAll();
    for (let workspace of workspaces) {
      if (workspace.ownerId) {
         try {
            await WorkspaceMember.create({ userId: workspace.ownerId, workspaceId: workspace.id, role: 'admin' });
         } catch(e) {
            console.log("Failed to restore owner for workspace", workspace.id);
         }
      }
    }
    console.log("Successfully rebuilt WorkspaceMembers without UNIQUE flaws!");
  } catch(e) {
    console.error("Migration failed:", e);
  }
  process.exit();
})();
