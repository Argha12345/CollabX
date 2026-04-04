const { User } = require('../models');
const fs = require('fs');
const path = require('path');

const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.name = req.body.name || user.name;
    
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ where: { email: req.body.email } });
      if (emailExists) return res.status(400).json({ message: 'Email already in use by another account' });
      user.email = req.body.email;
    }
    
    if (req.body.avatar !== undefined) {
      if (req.body.avatar.startsWith('data:image')) {
        const base64Data = req.body.avatar.replace(/^data:image\/\w+;base64,/, "");
        const filename = `avatar_${user.id}_${Date.now()}.png`;
        const uploadPath = path.join(__dirname, '../uploads', filename);
        fs.writeFileSync(uploadPath, base64Data, 'base64');
        user.avatar = `http://localhost:5050/uploads/${filename}`;
      } else {
        user.avatar = req.body.avatar;
      }
    }
    
    await user.save();
    
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Missing password fields' });
    }
    
    if (await user.matchPassword(oldPassword)) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(400).json({ message: 'Incorrect old password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updateProfile, updatePassword };
