import { z } from "zod";

export const emojiSchema = z.string().trim().nullable().optional();
export const nameSchema = z.string().trim().min(1).max(255);
export const descriptionSchema = z.string().trim().nullable().optional();

export const projectIdSchema = z.string().trim().min(1);

export const projectMemberSchema = z.object({
  memberId: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  role: z.enum(["HEAD", "LEAD", "MEMBER"]).optional(),
});

export const createProjectSchema = z.object({
  emoji: emojiSchema,
  name: nameSchema,
  description: descriptionSchema,
  teamId: z.string().trim().optional(),
  teamIds: z.array(z.string().trim()).optional(),
  newTeam: z
    .object({
      name: z.string().trim().min(1, "Team name is required"),
      description: z.string().trim().optional(),
      members: z.array(projectMemberSchema).optional(),
    })
    .optional(),
  leadUserId: z.string().trim().optional(),
  members: z.array(projectMemberSchema).optional(),
});

export const updateProjectSchema = z.object({
  emoji: emojiSchema,
  name: nameSchema.optional(),
  description: descriptionSchema,
  teamId: z.string().trim().optional(),
  teamIds: z.array(z.string().trim()).optional(),
});

export const assignTeamsSchema = z.object({
  teamIds: z
    .array(z.string().trim())
    .or(z.string().trim().transform((val) => [val])),
});

export const teamIdParamSchema = z.string().trim().min(1);

export const getProjectMembersQuerySchema = z.object({
  search: z.string().trim().optional(),
  teamId: z.string().trim().optional(),
  role: z.string().trim().optional(),
  sortBy: z.enum(["tasks", "completion", "name"]).optional(),
});

export const getProjectTeamsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

