import { UserDocument } from "../modules/user/user.model";

declare global {
  namespace Express {
    interface User extends UserDocument {
      _id?: any;
    }
  }
}
