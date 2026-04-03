const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

const KanbanCard = sequelize.define('KanbanCard', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  dueDate: {
    type: DataTypes.DATE,
  },
});

module.exports = KanbanCard;
