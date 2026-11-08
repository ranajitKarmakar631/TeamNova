import commentRoutes from "./comment.routes";
import CommentModel from "./comment.model";
import * as commentService from "./comment.service";

export { commentRoutes, CommentModel, commentService };
export * from "./comment.model";
export * from "./comment.validation";
export * from "./comment.service";

