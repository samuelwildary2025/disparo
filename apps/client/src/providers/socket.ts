import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@app-disparo/shared";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(userId?: string) {
  if (!socket) {
    socket = io("/", {
      path: "/socket.io",
      withCredentials: true,
      auth: {
        userId
      }
    });
  } else if (userId) {
    const currentAuth = socket.auth;
    const currentUserId =
      currentAuth && typeof currentAuth === "object" && "userId" in currentAuth
        ? (currentAuth as { userId?: string }).userId
        : undefined;

    if (currentUserId !== userId) {
      socket.auth = { userId };
      if (!socket.connected) {
        socket.connect();
      }
    }
  }

  return socket;
}
