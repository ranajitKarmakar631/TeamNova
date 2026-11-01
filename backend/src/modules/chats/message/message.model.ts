import mongoose, { Schema, Types, Document } from "mongoose";

export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  FILE = "FILE",
  SYSTEM = "SYSTEM",
}

export enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  DELETED = "DELETED",
}

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  replyTo?: Types.ObjectId | null;
  forwardedFrom?: Types.ObjectId | null;
  editedAt?: Date | null;
  deletedFor: Types.ObjectId[];
  deletedForEveryone: boolean;
  status: MessageStatus;
  deliveredTo: Types.ObjectId[];
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
      required: true,
    },

    content: {
      type: String,
      trim: true,
      maxlength: 10000,
    },

    mediaUrl: {
      type: String,
      trim: true,
    },

    mediaName: {
      type: String,
      trim: true,
      maxlength: 255,
    },

    mediaSize: {
      type: Number,
      min: 0,
    },

    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    forwardedFrom: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    deletedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    deletedForEveryone: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },

    deliveredTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

messageSchema.index({ chatId: 1, createdAt: -1, _id: -1 });

messageSchema.index({ senderId: 1, createdAt: -1 });

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;