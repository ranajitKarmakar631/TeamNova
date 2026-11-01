import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { UnauthorizedException } from "../../../common/utils/appError";
import { verifyAccessToken } from "../../../common/utils/jwt";
import { UserModel } from "../../user";

interface AuthPayload {
  userId: string;
}

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      throw new UnauthorizedException("Unauthorized. Please log in.");
    }

    const decoded = verifyAccessToken(token);

    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedException("User not found or session invalid.");
    }
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
};
