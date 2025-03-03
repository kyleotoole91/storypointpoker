import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

interface Room {
  members: { id: string; name: string; vote: string | null; }[];
  revealed: boolean;
  votingSystem: 'fibonacci' | 'tshirt';
}

const rooms: Record<string, Room> = {};

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ roomId, memberName }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = {
        members: [],
        revealed: false,
        votingSystem: 'fibonacci'
      };
    }
    rooms[roomId].members.push({ id: socket.id, name: memberName, vote: null });
    io.to(roomId).emit('roomUpdate', rooms[roomId]);
  });

  socket.on('vote', ({ roomId, vote }) => {
    const room = rooms[roomId];
    if (room) {
      const member = room.members.find(m => m.id === socket.id);
      if (member) {
        member.vote = vote;
        io.to(roomId).emit('roomUpdate', room);
      }
    }
  });

  socket.on('reveal', (roomId) => {
    const room = rooms[roomId];
    if (room) {
      room.revealed = true;
      io.to(roomId).emit('roomUpdate', room);
    }
  });

  socket.on('reset', (roomId) => {
    const room = rooms[roomId];
    if (room) {
      room.revealed = false;
      room.members.forEach(member => member.vote = null);
      io.to(roomId).emit('roomUpdate', room);
    }
  });

  socket.on('changeVotingSystem', ({ roomId, system }) => {
    const room = rooms[roomId];
    if (room) {
      room.votingSystem = system;
      room.revealed = false;
      room.members.forEach(member => member.vote = null);
      io.to(roomId).emit('roomUpdate', room);
    }
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      rooms[roomId].members = rooms[roomId].members.filter(m => m.id !== socket.id);
      if (rooms[roomId].members.length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('roomUpdate', rooms[roomId]);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});