// server.js
const express = require('express');
const http = require('http'); // Required to attach socket.io
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server); // Attach socket.io to the server

// Serve static files (like index.html) from the current directory
app.use(express.static('public'));

// Store connected users
const users = new Map();
const messages = [];

app.get('/', (req, res) => {
  res.send('Socket.IO server is running');
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user joining
  socket.on('user join', (username) => {
    users.set(socket.id, username);
    // Send current users list to all clients
    io.emit('users list', Array.from(users.values()));
    // Send message history to the new user
    socket.emit('message history', messages);
    // Broadcast new user joined
    io.emit('chat message', {
      type: 'system',
      text: `${username} has joined the chat`,
      timestamp: new Date().toISOString()
    });
  });

  // Handle chat messages
  socket.on('chat message', (msg) => {
    const username = users.get(socket.id);
    const messageData = {
      type: 'user',
      text: msg,
      username: username,
      timestamp: new Date().toISOString()
    };
    messages.push(messageData);
    io.emit('chat message', messageData);
  });

  // Handle image messages
  socket.on('chat image', (imageData) => {
    const username = users.get(socket.id);
    const messageData = {
      type: 'image',
      image: imageData,
      username: username,
      timestamp: new Date().toISOString()
    };
    // Optionally, you can also push to messages[] if you want to keep image history:
    // messages.push(messageData);
    io.emit('chat image', messageData);
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    const username = users.get(socket.id);
    socket.broadcast.emit('user typing', {
      username: username,
      isTyping: isTyping
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      io.emit('users list', Array.from(users.values()));
      io.emit('chat message', {
        type: 'system',
        text: `${username} has left the chat`,
        timestamp: new Date().toISOString()
      });
    }
    console.log('User disconnected:', socket.id);
  });
});

// ✅ Use dynamic port and host for Render
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
