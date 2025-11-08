const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(); // allow anonymous (no rooms)
    try {
      const payload = jwt.decode(token);
      socket.user = { id: payload?.sub, role: payload?.role };
    } catch {}
    next();
  });

  io.on('connection', (socket) => {
    const uid = socket.user?.id;
    const role = socket.user?.role;
    if (uid) socket.join(`user:${uid}`);
    if (role === 'admin') socket.join('admin');

    socket.on('chat:message', async (payload) => {
      // payload: { toUserId?, content }
      try {
        if (!socket.user?.id || !payload?.content) return;
        const Message = require('../models/Message');
        const toId = payload.toUserId || null; // null => to admins/support
        const created = await Message.create({ from: socket.user.id, to: toId, content: String(payload.content).slice(0, 2000) });
        const msg = { from: String(created.from), to: created.to ? String(created.to) : null, content: created.content, createdAt: created.createdAt };
        if (toId) {
          io.to(`user:${toId}`).emit('chat:message', msg);
        } else {
          io.to('admin').emit('chat:message', msg);
        }
        io.to(`user:${socket.user.id}`).emit('chat:message', msg);
      } catch {}
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };
