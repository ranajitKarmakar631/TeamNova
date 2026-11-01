import { UserDocument } from "../modules/user/user.model";
import { Types } from "mongoose";

export interface WorkspaceContext {
  workspaceId: Types.ObjectId;
  workspaceRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

declare global {
  namespace Express {
    interface User extends Omit<UserDocument, "_id"> {
      _id: any;
      activeWorkspace?: WorkspaceContext;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};