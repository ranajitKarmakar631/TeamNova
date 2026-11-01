import { Server as HttpServer } from "http";
import { Server as SocketIoServer } from "socket.io";
import SocketService from "./socketService";
import { redis } from "../../../redis/redis.service";
import { socketAuthMiddleware } from "./socket.middleware";

let io: SocketIoServer | null = null;
let service: SocketService | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIoServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });
  io.use(socketAuthMiddleware);

  service = new SocketService(io, redis);
  service.initialize();

  return { io, service };
};

export const getIO = (): SocketIoServer => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

export const getSocketService = (): SocketService => {
  if (!service) {
    throw new Error("SocketService not initialized");
  }
  return service;
};
