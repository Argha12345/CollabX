const { sequelize, DocumentLog } = require('./models');

const sync = async () => {
  await DocumentLog.sync({ alter: true });
  console.log("DocumentLog model synchronized");
};

sync();
