import type { Server, Socket } from "socket.io";
import type Redis from "ioredis";
import { registerNotificationSocketEvents } from "../../notification/notification.socket";

export interface SocketData {
  userId: string;
}

export interface AuthenticatedSocket extends Socket {
  data: SocketData;
}

export interface ConversationPayload {
  conversationId: string;
}

export interface SendMessagePayload extends ConversationPayload {
  messageId: string;
  content: string;
}

export interface TypingPayload extends ConversationPayload {
  isTyping: boolean;
}

export default class SocketService {
  constructor(
    private readonly io: Server,
    private readonly redis: Redis,
  ) {}

  public initialize(): void {
    this.io.on("connection", (socket) => {
      void this.handleConnection(socket as AuthenticatedSocket);
    });
  }

  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    const userId = socket.data?.userId;

    if (!userId) {
      console.warn(`[Socket] Connection rejected: No userId attached to socket ${socket.id}`);
      socket.disconnect(true);
      return;
    }

    try {
      // 1. Add user socket mapping & mark as online in Redis
      await this.addUserSocket(userId, socket.id);

      // 2. Join a dedicated room for direct user notifications
      await socket.join(`user:${userId}`);

      console.log(`[Socket] User connected: ${userId} (socket ID: ${socket.id})`);

      // 3. Broadcast online status to connected clients
      this.io.emit("user:online", { userId });

      // 4. Register event handlers
      this.registerEvents(socket);
    } catch (error) {
      console.error(`[Socket] Connection error for user ${userId}:`, error);
      socket.disconnect(true);
    }
  }

  private registerEvents(socket: AuthenticatedSocket): void {
    socket.on("conversation:join", (payload: ConversationPayload) => {
      void this.joinConversation(socket, payload);
    });

    socket.on("message:send", (payload: SendMessagePayload) => {
      void this.sendMessage(socket, payload);
    });

    socket.on("typing", (payload: TypingPayload) => {
      void this.handleTyping(socket, payload);
    });

    socket.on("message:read", (payload: ConversationPayload) => {
      void this.handleMessageRead(socket, payload);
    });

    socket.on("disconnect", () => {
      void this.handleDisconnect(socket);
    });

    // Register notification events
    registerNotificationSocketEvents(socket);
  }

  private async addUserSocket(userId: string, socketId: string): Promise<void> {
    await this.redis.sadd(`user:${userId}:sockets`, socketId);
    await this.redis.sadd("online:users", userId);
  }

  private async joinConversation(
    socket: AuthenticatedSocket,
    payload: ConversationPayload,
  ): Promise<void> {
    const { conversationId } = payload;
    if (!conversationId) return;

    await socket.join(`conversation:${conversationId}`);
  }

  private async sendMessage(
    socket: AuthenticatedSocket,
    payload: SendMessagePayload,
  ): Promise<void> {
    const { conversationId, messageId, content } = payload;

    if (!conversationId || !messageId || !content?.trim()) {
      socket.emit("message:error", {
        message: "Invalid message payload",
      });
      return;
    }

    this.io.to(`conversation:${conversationId}`).emit("message:new", {
      messageId,
      conversationId,
      senderId: socket.data.userId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    });
  }

  private async handleTyping(
    socket: AuthenticatedSocket,
    payload: TypingPayload,
  ): Promise<void> {
    const { conversationId, isTyping } = payload;
    if (!conversationId) return;

    socket.to(`conversation:${conversationId}`).emit("typing", {
      conversationId,
      userId: socket.data.userId,
      isTyping,
    });
  }

  private async handleMessageRead(
    socket: AuthenticatedSocket,
    payload: ConversationPayload,
  ): Promise<void> {
    const { conversationId } = payload;
    if (!conversationId) return;

    socket.to(`conversation:${conversationId}`).emit("message:read", {
      conversationId,
      userId: socket.data.userId,
      readAt: new Date().toISOString(),
    });
  }

  private async handleDisconnect(socket: AuthenticatedSocket): Promise<void> {
    const userId = socket.data?.userId;
    if (!userId) return;

    try {
      await this.redis.srem(`user:${userId}:sockets`, socket.id);

      const activeConnections = await this.redis.scard(
        `user:${userId}:sockets`,
      );

      console.log(
        `[Socket] User disconnected: ${userId} (socket ID: ${socket.id}, remaining: ${activeConnections})`,
      );

      if (activeConnections === 0) {
        await this.redis.srem("online:users", userId);
        this.io.emit("user:offline", { userId });
      }
    } catch (error) {
      console.error(`[Socket] Disconnection cleanup error for user ${userId}:`, error);
    }
  }

  public async getOnlineUsers(): Promise<string[]> {
    return this.redis.smembers("online:users");
  }

  public async isUserOnline(userId: string): Promise<boolean> {
    return (await this.redis.sismember("online:users", userId)) === 1;
  }
}