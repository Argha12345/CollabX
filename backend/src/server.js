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
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-document', (documentId) => {
    socket.join(documentId);
    console.log(`Socket ${socket.id} joined document ${documentId}`);
  });

  socket.on('send-changes', (documentId, delta, userName) => {
    socket.to(documentId).emit('receive-changes', delta, userName);
  });
  
  socket.on('join-workspace', (workspaceId) => {
    socket.join(workspaceId);
    console.log(`Socket ${socket.id} joined workspace ${workspaceId}`);
  });

  socket.on('kanban-update', (workspaceId) => {
    socket.to(workspaceId).emit('kanban-changed');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
