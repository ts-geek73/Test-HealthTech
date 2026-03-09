import { Server as SocketIOServer } from "socket.io";
import logger from "./logger";

let io: SocketIOServer | null = null;

export function setSocket(server: SocketIOServer) {
  io = server;
}

function getSocket() {
  if (!io) {
    logger.warn("[Socket] io not initialized yet");
  }
  return io;
}

export function emitSessionCreated(payload: unknown) {
  const socket = getSocket();
  if (!socket) return;
  socket.emit("session_created", payload);
}

export function emitSessionUpdated(payload: unknown) {
  const socket = getSocket();
  if (!socket) return;
  socket.emit("session_updated", payload);
}

export function emitSessionDeleted(payload: unknown) {
  const socket = getSocket();
  if (!socket) return;
  socket.emit("session_deleted", payload);
}
