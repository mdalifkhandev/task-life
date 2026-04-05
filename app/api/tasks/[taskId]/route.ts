import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-service";
import { updateUserTask, deleteUserTask } from "@/lib/server/task-service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;
  const body = await req.json();

  const task = await updateUserTask({
    userId: user.id,
    taskId,
    ...body
  });

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;
  await deleteUserTask(user.id, taskId);

  return NextResponse.json({ success: true });
}
