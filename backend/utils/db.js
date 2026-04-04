const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'collabx.sqlite'),
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite database connected.');
    // SQLite doesn't natively support easy alter operations on Foreign Keys.
    // We will just conventionally sync (create if not exist) to avoid DROP TABLE errors.
    await sequelize.sync();
    console.log('Models synchronized.');
  } catch (error) {
    console.error('Database sync error:', error);
  }
};

module.exports = { sequelize, connectDB };
