import { z } from "zod";
import { TaskPriorityEnum, TaskStatusEnum } from "./task.enum";

export const titleSchema = z.string().trim().min(1).max(255);
export const descriptionSchema = z.string().trim().nullable().optional();

export const assignedToSchema = z
  .union([z.string().trim().min(1), z.array(z.string().trim().min(1))])
  .nullable()
  .optional();

export const reportedToSchema = z.string().trim().min(1).nullable().optional();

export const prioritySchema = z.enum(
  Object.values(TaskPriorityEnum) as [string, ...string[]]
);

export const statusSchema = z.enum(
  Object.values(TaskStatusEnum) as [string, ...string[]]
);

export const dueDateSchema = z
  .string()
  .trim()
  .nullable()
  .optional()
  .refine(
    (val) => {
      return !val || !isNaN(Date.parse(val));
    },
    {
      message: "Invalid date format. Please provide a valid date string.",
    }
  );

export const teamIdSchema = z.string().trim().min(1).nullable().optional();

export const taskIdSchema = z.string().trim().min(1);

export const createTaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  priority: prioritySchema,
  status: statusSchema,
  assignedTo: assignedToSchema,
  reportedTo: reportedToSchema,
  dueDate: dueDateSchema,
  teamId: teamIdSchema,
  team: teamIdSchema,
});

export const updateTaskSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema,
  priority: prioritySchema.optional(),
  status: statusSchema.optional(),
  assignedTo: assignedToSchema,
  reportedTo: reportedToSchema,
  dueDate: dueDateSchema,
  teamId: teamIdSchema,
  team: teamIdSchema,
});
