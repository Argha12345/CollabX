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
    // Force sync during development if needed, for now just alter
    await sequelize.sync({ alter: true });
    console.log('Models synchronized.');
  } catch (error) {
    console.error('Database sync error:', error);
  }
};

module.exports = { sequelize, connectDB };
