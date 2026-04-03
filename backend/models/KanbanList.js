const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

const KanbanList = sequelize.define('KanbanList', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

module.exports = KanbanList;
