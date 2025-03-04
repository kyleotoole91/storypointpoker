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
  members: { id: string; name: string; vote: string | null; isAdmin: boolean; lastActiveTime: number; }[];
  revealed: boolean;
  votingSystem: 'fibonacci' | 'tshirt';
  adminId: string | null;
  lastAdminResetTime: number;
}

const rooms: Record<string, Room> = {};

const ADMIN_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const INACTIVE_MEMBER_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const cleanupInactiveMembers = (room: Room) => {
  const now = Date.now();
  const activeMembers = room.members.filter(member => {
    const isActive = (now - member.lastActiveTime) < INACTIVE_MEMBER_TIMEOUT;
    if (!isActive && member.id === room.adminId) {
      room.adminId = null;
    }
    return isActive;
  });
  room.members = activeMembers;
};

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ roomId, memberName, requestAdmin }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = {
        members: [],
        revealed: false,
        votingSystem: 'fibonacci',
        adminId: null,
        lastAdminResetTime: Date.now()
      };
    }

    const room = rooms[roomId];
    const now = Date.now();

    // Clean up inactive members and reset admin if needed
    if (room.lastAdminResetTime && (now - room.lastAdminResetTime > ADMIN_RESET_INTERVAL)) {
      room.adminId = null;
      room.lastAdminResetTime = now;
      cleanupInactiveMembers(room);
    }

    // Check if someone is requesting admin but it's already taken
    if (requestAdmin && room.adminId) {
      socket.emit('joinError', 'Admin role is already taken for this room');
      socket.leave(roomId);
      return;
    }

    // Assign admin if requested and no admin exists
    const isAdmin = requestAdmin && !room.adminId;
    if (isAdmin) {
      room.adminId = socket.id;
    }

    room.members.push({ 
      id: socket.id, 
      name: memberName, 
      vote: null, 
      isAdmin,
      lastActiveTime: now
    });
    
    io.to(roomId).emit('roomUpdate', room);
  });

  socket.on('vote', ({ roomId, vote }) => {
    const room = rooms[roomId];
    if (room) {
      const member = room.members.find(m => m.id === socket.id);
      if (member) {
        member.vote = vote;
        member.lastActiveTime = Date.now();
        io.to(roomId).emit('roomUpdate', room);
      }
    }
  });

  socket.on('reveal', (roomId) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      room.revealed = true;
      const member = room.members.find(m => m.id === socket.id);
      if (member) {
        member.lastActiveTime = Date.now();
      }
      io.to(roomId).emit('roomUpdate', room);
    }
  });

  socket.on('reset', (roomId) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      room.revealed = false;
      room.members.forEach(member => member.vote = null);
      const member = room.members.find(m => m.id === socket.id);
      if (member) {
        member.lastActiveTime = Date.now();
      }
      io.to(roomId).emit('roomUpdate', room);
    }
  });

  socket.on('removeMember', ({ roomId, memberId }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      room.members = room.members.filter(m => m.id !== memberId);
      if (memberId === room.adminId) {
        room.adminId = null;
      }
      const member = room.members.find(m => m.id === socket.id);
      if (member) {
        member.lastActiveTime = Date.now();
      }
      io.to(roomId).emit('roomUpdate', room);
      // Notify the removed member
      io.to(memberId).emit('kicked');
    }
  });

  socket.on('changeVotingSystem', ({ roomId, system }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      room.votingSystem = system;
      room.revealed = false;
      room.members.forEach(member => member.vote = null);
      const member = room.members.find(m => m.id === socket.id);
      if (member) {
        member.lastActiveTime = Date.now();
      }
      io.to(roomId).emit('roomUpdate', room);
    }
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.adminId === socket.id) {
        room.adminId = null;
      }
      room.members = room.members.filter(m => m.id !== socket.id);
      if (room.members.length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('roomUpdate', room);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});