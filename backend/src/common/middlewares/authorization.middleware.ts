import { NextFunction, Request, Response } from "express";
import { IRolePermissionDocument } from "../../modules/RolePermission/rolePermission.model";

export interface AuthorizedUserRequest extends Request {
  user?: Express.User;
  role?: IRolePermissionDocument;
}

export const workspaceAuthorization = (allowedRoles: string[]) => {
  return (req: AuthorizedUserRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const workspace = user.activeWorkspace;
    if (!workspace) {
      return res.status(400).json({ message: "No active workspace found." });
    }

    if (!allowedRoles || allowedRoles.length === 0) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!allowedRoles.includes(workspace.workspaceRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
    
