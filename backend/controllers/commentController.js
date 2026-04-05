const { DocumentComment } = require('../models');

const getComments = async (req, res) => {
  try {
    const comments = await DocumentComment.findAll({
      where: { documentId: req.params.documentId },
      order: [['createdAt', 'ASC']]
    });
    res.json(comments.map(c => ({...c.toJSON(), _id: c.id})));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createComment = async (req, res) => {
  try {
    const { content, documentId, selectionStart, selectionEnd, quotedText } = req.body;
    const comment = await DocumentComment.create({
      content,
      documentId,
      userId: req.user.id,
      userName: req.user.name,
      selectionStart,
      selectionEnd,
      quotedText
    });
    res.status(201).json({...comment.toJSON(), _id: comment.id});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await DocumentComment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ message: "Not found" });
    if (comment.userId !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await comment.destroy();
    res.json({ message: "Removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getComments, createComment, deleteComment };
