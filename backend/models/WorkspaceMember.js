const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

const WorkspaceMember = sequelize.define('WorkspaceMember', {
  role: {
    type: DataTypes.STRING,
    defaultValue: 'viewer',
  }
});

module.exports = WorkspaceMember;
