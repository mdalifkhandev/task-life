import { updateTaskSchema } from "@/lib/server/task-schemas";
import { updateTaskInDatabase } from "@/lib/server/task-service";
import { ZodError } from "zod";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await context.params;
    const payload = updateTaskSchema.parse(await request.json());
    const tasks = await updateTaskInDatabase({
      ...payload,
      taskId
    });

    return Response.json({ tasks });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Invalid update payload", issues: error.flatten() },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to update task";
    return Response.json({ error: message }, { status: 500 });
  }
}
