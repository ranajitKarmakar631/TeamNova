import type { Server, Socket } from "socket.io";
import type Redis from "ioredis";

interface SocketData {
  userId: string;
}

interface AuthenticatedSocket extends Socket {
  data: SocketData;
}

interface ConversationPayload {
  conversationId: string;
}

interface SendMessagePayload extends ConversationPayload {
  messageId: string;
  content: string;
}

interface TypingPayload extends ConversationPayload {
  isTyping: boolean;
}

export class SocketService {
  constructor(
    private readonly io: Server,
    private readonly redis: Redis,
    
  ) {}

  initialize(): void {
    this.io.on("connection", (socket) => {
      void this.handleConnection(socket as AuthenticatedSocket);
    });
  }

  private async handleConnection(
    socket: AuthenticatedSocket
  ): Promise<void> {
    const { userId } = socket.data;

    try {
      await this.addUserSocket(userId, socket.id);
      await socket.join(`user:${userId}`);

      this.io.emit("user:online", { userId });

      this.registerEvents(socket);
    } catch (error) {
      console.error("Socket connection failed:", error);
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
  }

  private async addUserSocket(
    userId: string,
    socketId: string
  ): Promise<void> {
    await this.redis.sadd(`user:${userId}:sockets`, socketId);
    await this.redis.sadd("online:users", userId);
  }

  private async joinConversation(
    socket: AuthenticatedSocket,
    payload: ConversationPayload
  ): Promise<void> {
    const { conversationId } = payload;

    if (!conversationId) return;

    await socket.join(`conversation:${conversationId}`);
  }

  private async sendMessage(
    socket: AuthenticatedSocket,
    payload: SendMessagePayload
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
    payload: TypingPayload
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
    payload: ConversationPayload
  ): Promise<void> {
    const { conversationId } = payload;

    if (!conversationId) return;

    socket.to(`conversation:${conversationId}`).emit("message:read", {
      conversationId,
      userId: socket.data.userId,
      readAt: new Date().toISOString(),
    });
  }

  private async handleDisconnect(
    socket: AuthenticatedSocket
  ): Promise<void> {
    const { userId } = socket.data;

    try {
      await this.redis.srem(`user:${userId}:sockets`, socket.id);

      const activeConnections = await this.redis.scard(
        `user:${userId}:sockets`
      );

      if (activeConnections === 0) {
        await this.redis.srem("online:users", userId);
        this.io.emit("user:offline", { userId });
      }
    } catch (error) {
      console.error("Socket disconnection failed:", error);
    }
  }
}