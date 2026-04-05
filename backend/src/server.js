require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectDB } = require('../utils/db');
const authRoutes = require('../routes/authRoutes');
const workspaceRoutes = require('../routes/workspaceRoutes');
const documentRoutes = require('../routes/documentRoutes');
const kanbanRoutes = require('../routes/kanbanRoutes');
const aiRoutes = require('../routes/aiRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const userRoutes = require('../routes/userRoutes');
const commentRoutes = require('../routes/commentRoutes');

// Setup MongoDB/SQLite models mappings before connecting
require('../models');

// Connect to SQLite
connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Setup sockets
const activeUsers = new Map();
const userSockets = new Map();

app.set('io', io);
app.set('userSockets', userSockets);
app.set('activeUsers', activeUsers);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('register-user', (userId) => {
    userSockets.set(userId, socket.id);
  });

  socket.on('join-document', ({ documentId, user }) => {
    socket.join(documentId);
    if (user) {
      activeUsers.set(socket.id, { ...user, roomId: documentId });
      if (user.id) userSockets.set(user.id, socket.id);
      updatePresence(documentId);
    }
    console.log(`Socket ${socket.id} joined document ${documentId}`);
  });

  socket.on('join-workspace', ({ workspaceId, user }) => {
    socket.join(workspaceId);
    if (user) {
      activeUsers.set(socket.id, { ...user, roomId: workspaceId });
      if (user.id) userSockets.set(user.id, socket.id);
      updatePresence(workspaceId);
    }
    console.log(`Socket ${socket.id} joined workspace ${workspaceId}`);
  });

  // ... (inside the controller we should emit)

  socket.on('send-changes', (documentId, delta, userName) => {
    socket.to(documentId).emit('receive-changes', delta, userName);
  });
  
  socket.on('kanban-update', (workspaceId) => {
    socket.to(workspaceId).emit('kanban-changed');
  });

  socket.on('new-comment', ({ documentId, comment }) => {
    socket.to(documentId).emit('comment-added', comment);
  });
  
  socket.on('alert-notification', ({ userId, notification }) => {
    // Send directly to a specific user? We'd need a way to find their socket
    // For now, simpler: broadcast to everyone, and frontend filters?
    // Better: let's not use an event, the frontend can just poll OR we'd need a userId->socketId map.
    // For this demo, let's keep it simple: the record exists, the notification center will fetch unread ones.
  });

  socket.on('disconnect', () => {
    const userInfo = activeUsers.get(socket.id);
    if (userInfo) {
       const { roomId } = userInfo;
       activeUsers.delete(socket.id);
       updatePresence(roomId);
    }
    console.log('User disconnected:', socket.id);
  });

  function updatePresence(roomId) {
    // Collect all users currently in this room
    const roomUsers = Array.from(activeUsers.values())
      .filter(u => u.roomId === roomId)
      .reduce((acc, user) => {
         // Unique users only (by email or ID)
         if (!acc.find(u => u.email === user.email)) acc.push(user);
         return acc;
      }, []);

    io.to(roomId).emit('presence-update', roomUsers);
  }
});

app.get('/', (req, res) => {
  res.send('CollabX API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/kanban', kanbanRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
