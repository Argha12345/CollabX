const { sequelize, User, Workspace, WorkspaceMember } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    
    // Check table info
    const [results] = await sequelize.query("PRAGMA table_info(WorkspaceMembers);");
    console.log("WorkspaceMembers Schema:", results);

    // Grab first user and workspace
    const user = await User.findOne();
    const workspace = await Workspace.findOne();
    if (!user || !workspace) {
      console.log("No user or workspace found to test");
      process.exit(0);
    }
    console.log("Testing create with User:", user.id, "and Workspace:", workspace.id);

    // Try finding
    const existing = await WorkspaceMember.findOne({ where: { userId: user.id, workspaceId: workspace.id }});
    if (existing) {
       console.log("Already exists, going to try recreating to see error...");
       try {
         await WorkspaceMember.create({ userId: user.id, workspaceId: workspace.id, role: 'member' });
       } catch (err) {
         console.log("Error when duplicating:", err.name, err.message);
       }
    } else {
       await WorkspaceMember.create({ userId: user.id, workspaceId: workspace.id, role: 'member' });
       console.log("Inserted successfully");
    }

  } catch(e) {
    console.error("Master Error:", e.name, e.message);
    if(e.errors) console.error(e.errors.map(er => er.message));
  }
  process.exit();
})();
