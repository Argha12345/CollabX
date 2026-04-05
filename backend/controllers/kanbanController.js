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
    const formattedCards = cards.map(c => ({ ...c.toJSON(), _id: c.id, list: c.listId, listId: c.listId }));

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

const reorderCards = async (req, res) => {
  try {
    const { cards } = req.body;
    if (!Array.isArray(cards)) return res.status(400).json({ message: 'Invalid data format' });

    // Multi-update logic (Sequelize)
    await Promise.all(cards.map(async (c) => {
      await KanbanCard.update(
        { listId: c.listId, position: c.position },
        { where: { id: c.id } }
      );
    }));

    res.json({ message: 'Reordered' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const handleAiCard = async (req, res) => {
  const { prompt, workspaceId } = req.body;
  if (!prompt || !workspaceId) return res.status(400).json({ message: "Task description required" });

  try {
    let geminiKey = process.env.GEMINI_API_KEY;
    const fs = require('fs');
    const pathRef = require('path');
    try {
      const match = fs.readFileSync(pathRef.resolve(__dirname, '../.env'), 'utf8').match(/GEMINI_API_KEY=(.+)/);
      if (match && match[1]) geminiKey = match[1].trim();
    } catch(e) {}

    const listRes = await KanbanList.findOne({ where: { workspaceId }, order: [['position', 'ASC']] });
    if (!listRes) return res.status(404).json({ message: "Create a list first" });

    const https = require('https');
    const payload = JSON.stringify({
      contents: [{
        parts: [{
          text: `Convert this user request into a Kanban card title and description.
          User Request: "${prompt}"
          Output JSON format (no backticks): { "title": "...", "description": "..." }`
        }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length }
    };

    const request = https.request(options, (response) => {
      let body = '';
      response.on('data', chunk => body += chunk);
      response.on('end', async () => {
        try {
          const data = JSON.parse(body);
          let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          // clean any possible markdown formatting
          rawText = rawText.replace(/```json|```/g, '').trim();
          const { title, description } = JSON.parse(rawText);

          const card = await KanbanCard.create({
            title: title || prompt,
            description: description || '',
            listId: listRes.id,
            position: 99
          });
          res.json({ card: { ...card.toJSON(), _id: card.id } });
        } catch(e) { res.status(500).json({ message: "AI Parsing Failed" }); }
      });
    });

    request.on('error', (e) => res.status(500).json({ message: e.message }));
    request.write(payload);
    request.end();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBoard, createList, createCard, updateCardState, deleteCard, deleteList, reorderCards, handleAiCard };

