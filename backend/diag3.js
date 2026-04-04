const { sequelize } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    const [indexes] = await sequelize.query("PRAGMA index_list(WorkspaceMembers);");
    console.log("Indexes on WorkspaceMembers:");
    for (let idx of indexes) {
       console.log(idx);
       if (idx.unique) {
         const [info] = await sequelize.query(`PRAGMA index_info(${idx.name});`);
         console.log(` Columns for ${idx.name}:`, info);
       }
    }
  } catch(e) {
    console.error(e);
  }
  process.exit();
})();
