import mongoose, { Document, Schema } from "mongoose";

export interface IReaction {
  emoji: string;
  users: mongoose.Types.ObjectId[];
}

export interface IAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface CommentDocument extends Document {
  _id: mongoose.Types.ObjectId;
  task: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: any;
  parentId: mongoose.Types.ObjectId | null;
  rootParentId: mongoose.Types.ObjectId | null;
  replyCount: number;
  mentions: mongoose.Types.ObjectId[];
  attachments: IAttachment[];
  reactions: IReaction[];
  isEdited: boolean;
  editedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new Schema<IReaction>(
  {
    emoji: {
      type: String,
      required: true,
      trim: true,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { _id: false }
);

const attachmentSchema = new Schema<IAttachment>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: "application/octet-stream",
    },
  },
  { _id: false }
);

const commentSchema = new Schema<CommentDocument>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    rootParentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    replyCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// High-Performance Compound Indexes for Scale:
// 1. Fetch top-level comments for task (sorted newest/oldest)
commentSchema.index({ task: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ task: 1, parentId: 1, createdAt: 1 });

// 2. Thread replies retrieval
commentSchema.index({ rootParentId: 1, createdAt: 1 });
commentSchema.index({ parentId: 1, createdAt: 1 });

// 3. Multi-tenant workspace audit & user activity
commentSchema.index({ workspace: 1, author: 1, createdAt: -1 });

// 4. Cascade task deletion
commentSchema.index({ task: 1, createdAt: -1 });

const CommentModel = mongoose.model<CommentDocument>("Comment", commentSchema);

export default CommentModel;
