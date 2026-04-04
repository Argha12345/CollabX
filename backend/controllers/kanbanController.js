const { KanbanList, KanbanCard } = require('../models');

const getBoard = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const lists = await KanbanList.findAll({
      where: { workspaceId },
      order: [['position', 'ASC']]
    });
    
    const listIds = lists.map(l => l.id);
    const cards = await KanbanCard.findAll({
      where: { listId: listIds },
      order: [['position', 'ASC']]
    });
    
    const formattedLists = lists.map(l => ({ ...l.toJSON(), _id: l.id }));
    const formattedCards = cards.map(c => ({ ...c.toJSON(), _id: c.id, list: c.listId }));

    res.json({ lists: formattedLists, cards: formattedCards });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createList = async (req, res) => {
  try {
    const { title, workspaceId, position } = req.body;
    const list = await KanbanList.create({ title, workspaceId, position });
    res.status(201).json({ ...list.toJSON(), _id: list.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCard = async (req, res) => {
  try {
    const { title, description, listId, position } = req.body;
    const card = await KanbanCard.create({ title, description, listId, position });
    res.status(201).json({ ...card.toJSON(), _id: card.id, list: card.listId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCardState = async (req, res) => {
  try {
    const { listId, position, title, description } = req.body;
    const card = await KanbanCard.findByPk(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    
    if (listId !== undefined) card.listId = listId;
    if (position !== undefined) card.position = position;
    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;
    
    await card.save();
    
    res.json({ ...card.toJSON(), _id: card.id, list: card.listId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCard = async (req, res) => {
  try {
    const card = await KanbanCard.findByPk(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    await card.destroy();
    res.json({ ...card.toJSON(), _id: card.id, list: card.listId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteList = async (req, res) => {
  try {
    const list = await KanbanList.findByPk(req.params.id);
    if (!list) return res.status(404).json({ message: 'List not found' });
    
    // Safely cleanup all cards inside this list first
    await KanbanCard.destroy({ where: { listId: list.id } });
    await list.destroy();
    
    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBoard, createList, createCard, updateCardState, deleteCard, deleteList };
