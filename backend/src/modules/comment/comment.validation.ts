import { z } from "zod";

export const commentIdSchema = z.string().trim().min(1, "Comment ID is required");

export const attachmentSchema = z.object({
  name: z.string().trim().min(1, "Attachment name is required"),
  url: z.string().trim().url("Attachment must be a valid URL"),
  size: z.number().nonnegative().optional(),
  type: z.string().trim().optional(),
});

export const createCommentSchema = z.object({
  content: z.union([
    z.string().trim().min(1, "Comment content cannot be empty"),
    z.record(z.any()),
  ]),
  parentId: z.string().trim().nullable().optional(),
  mentions: z.array(z.string().trim().min(1)).optional().default([]),
  attachments: z.array(attachmentSchema).optional().default([]),
});

export const updateCommentSchema = z.object({
  content: z.union([
    z.string().trim().min(1, "Comment content cannot be empty"),
    z.record(z.any()),
  ]),
});

export const toggleReactionSchema = z.object({
  emoji: z.string().trim().min(1, "Emoji is required").max(32, "Invalid emoji format"),
});

export const getCommentsQuerySchema = z.object({
  pageNumber: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().trim().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  parentId: z.string().trim().nullable().optional(),
});

