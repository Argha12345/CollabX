const { Document, User } = require('../models');

const createDocument = async (req, res) => {
  const { title, workspaceId } = req.body;
  try {
    const document = await Document.create({
      title: title || 'Untitled Document',
      workspaceId,
      createdById: req.user.id,
      content: ''
    });
    res.status(201).json({ ...document.toJSON(), _id: document.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWorkspaceDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      where: { workspaceId: req.params.workspaceId },
      include: [{ model: User, as: 'creator', attributes: ['name'] }]
    });
    
    const formatted = documents.map(d => {
      const json = d.toJSON();
      return { ...json, _id: json.id, createdBy: json.creator };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json({ ...document.toJSON(), _id: document.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDocument, getWorkspaceDocuments, getDocumentById };
