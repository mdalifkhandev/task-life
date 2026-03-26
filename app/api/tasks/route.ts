import { requireAuthenticatedApiUser } from "@/lib/server/auth-service";
import { insertTaskSchema } from "@/lib/server/task-schemas";
import {
  insertTaskIntoDatabase,
  readTasksFromDatabase
} from "@/lib/server/task-service";
import { ZodError } from "zod";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAuthenticatedApiUser();
    const tasks = await readTasksFromDatabase();
    return Response.json({ tasks });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load tasks";
    return Response.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAuthenticatedApiUser();
    const payload = insertTaskSchema.parse(await request.json());
    const tasks = await insertTaskIntoDatabase(payload);
    return Response.json({ tasks }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Invalid task payload", issues: error.flatten() },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to insert task";
    return Response.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 }
    );
  }
}
