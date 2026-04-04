const { sequelize, User, Workspace, WorkspaceMember } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    
    // Create new test user
    const newUser = await User.create({ name: 'Test Memb', email: 'testmemb@test.com', password: 'test' });
    const workspace = await Workspace.findOne();
    
    console.log("Adding new user:", newUser.id, "to workspace:", workspace.id);

    // Try creating
    try {
      await WorkspaceMember.create({ userId: newUser.id, workspaceId: workspace.id, role: 'member' });
      console.log("Success! No validation error.");
    } catch (err) {
      console.log("Exact Error Name:", err.name);
      console.log("Exact Error Message:", err.message);
      if (err.errors) console.log(err.errors.map(e => e.message));
    }
  } catch(e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
       console.log('Already exists from previous run');
    }
  }
  process.exit();
})();
