const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

const DocumentComment = sequelize.define('DocumentComment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  documentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING,
  },
  selectionStart: {
    type: DataTypes.INTEGER,
  },
  selectionEnd: {
    type: DataTypes.INTEGER,
  },
  quotedText: {
    type: DataTypes.TEXT,
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

module.exports = DocumentComment;
