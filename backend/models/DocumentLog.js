const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

const DocumentLog = sequelize.define('DocumentLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = DocumentLog;
