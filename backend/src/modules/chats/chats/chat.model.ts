import mongoose, { Schema, Types, Document } from "mongoose";

export enum ChatType {
  PRIVATE = "PRIVATE",
  GROUP = "GROUP",
}

export enum ParticipantRole {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
}

export interface IChatParticipant {
  userId: Types.ObjectId;
  role: ParticipantRole;
  joinedAt: Date;
  lastReadMessage?: Types.ObjectId | null;
  isMuted: boolean;
  isActive: boolean;
}

export interface IChat extends Document {
  type: ChatType;
  participants: IChatParticipant[];
  groupName?: string;
  groupImage?: string;
  createdBy: Types.ObjectId;
  lastMessage?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IChatParticipant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(ParticipantRole),
      default: ParticipantRole.MEMBER,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    lastReadMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    isMuted: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const chatSchema = new Schema<IChat>(
  {
    type: {
      type: String,
      enum: Object.values(ChatType),
      required: true,
    },

    participants: {
      type: [participantSchema],
      required: true,
    },

    groupName: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    groupImage: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

chatSchema.index({ "participants.userId": 1, updatedAt: -1 });
chatSchema.index({ type: 1, updatedAt: -1 });

const Chat = mongoose.model<IChat>("Chat", chatSchema);

export default Chat;