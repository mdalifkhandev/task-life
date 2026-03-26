import { z } from "zod";

export const insertTaskSchema = z.object({
  beforeTaskId: z.string().min(1),
  monthKey: z.string().min(1),
  notes: z.string(),
  title: z.string().trim().min(1),
  weekKey: z.string().min(1)
});

export const updateTaskSchema = z
  .object({
    details: z.string().optional(),
    done: z.boolean().optional(),
    title: z.string().trim().min(1).optional()
  })
  .refine(
    (value) =>
      typeof value.done === "boolean" ||
      typeof value.title === "string" ||
      typeof value.details === "string",
    {
      message: "At least one update field is required"
    }
  );
