const { Document, User, DocumentLog } = require('../models');

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

const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    
    await document.destroy();
    res.json({ message: 'Document removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDocument = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    
    let action = '';
    const newTitle = req.body.title || document.title;
    const newContent = req.body.content !== undefined ? req.body.content : document.content;
    
    if (newTitle !== document.title && newContent !== document.content) {
       action = `Updated Title to "${newTitle}" and edited Content`;
    } else if (newTitle !== document.title) {
       action = `Changed Title to "${newTitle}"`;
    } else if (newContent !== document.content) {
       action = `Edited Document Content`;
    }
    
    document.title = newTitle;
    document.content = newContent;
    await document.save();
    
    if (action) {
       const user = await User.findByPk(req.user.id);
       await DocumentLog.create({
         documentId: document.id,
         userName: user ? user.name : 'Unknown',
         action
       });
    }
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDocumentLogs = async (req, res) => {
  try {
    const logs = await DocumentLog.findAll({
      where: { documentId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDocument, getWorkspaceDocuments, getDocumentById, deleteDocument, updateDocument, getDocumentLogs };
