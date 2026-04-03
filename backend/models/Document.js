const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Untitled Document',
  },
  content: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
});

module.exports = Document;
