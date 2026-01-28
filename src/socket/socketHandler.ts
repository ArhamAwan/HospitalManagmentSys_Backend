import type { Server, Socket } from 'socket.io';

let io: Server | null = null;

export function initializeSocket(server: Server) {
  io = server;

  server.on('connection', (socket: Socket) => {
    socket.on('join:doctor', (payload: { doctorId?: string }) => {
      if (payload?.doctorId) socket.join(`doctor:${payload.doctorId}`);
    });

    socket.on('join:display', () => {
      socket.join('display');
    });
  });
}

function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

export function emitQueueUpdate(payload: { doctorId: string; currentToken: number; roomNumber?: string }) {
  // Frontend currently listens globally; also emit to doctor room for future.
  getIO().emit('queue:update', payload);
  getIO().to(`doctor:${payload.doctorId}`).emit('queue:update', payload);
  getIO().to('display').emit('queue:update', payload);
}

export function emitEmergencyActive(payload: { doctorId: string; isActive: boolean }) {
  getIO().emit('emergency:active', payload);
  getIO().to(`doctor:${payload.doctorId}`).emit('emergency:active', payload);
  getIO().to('display').emit('emergency:active', payload);
}

export function emitDoctorQueueRefresh(payload: { doctorId: string }) {
  getIO().emit('doctor:queue-refresh', payload);
  getIO().to(`doctor:${payload.doctorId}`).emit('doctor:queue-refresh', payload);
}

