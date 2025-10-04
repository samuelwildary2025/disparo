import type { Server } from "http";
import { Server as SocketServer } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@app-disparo/shared";
import { logger } from "./logger";

let io: SocketServer<ClientToServerEvents, ServerToClientEvents> | null = null;

export function createSocketServer(httpServer: Server) {
  io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    logger.debug({ id: socket.id }, "socket connected");

    const userId = socket.handshake.auth?.userId as string | undefined;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("disconnect", () => {
      logger.debug({ id: socket.id }, "socket disconnected");
    });

    socket.on("subscribe_campaign", (campaignId) => {
      socket.join(`campaign:${campaignId}`);
    });

    socket.on("unsubscribe_campaign", (campaignId) => {
      socket.leave(`campaign:${campaignId}`);
    });
  });

  return io;
}

export function getSocketServer() {
  if (!io) {
    throw new Error("Socket server not initialised");
  }
  return io;
}
