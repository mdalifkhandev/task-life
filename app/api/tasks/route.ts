import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-service";
import { readUserTasks, createUserTask } from "@/lib/server/task-service";
import { type TaskSource } from "@/lib/task-plan-core";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId") || undefined;
  const sourceParam = searchParams.get("source");
  const source =
    sourceParam === "assigned" || sourceParam === "personal"
      ? (sourceParam as TaskSource)
      : undefined;

  const tasks = await readUserTasks(user.id, { folderId, source });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, notes, folderId } = await req.json();
  const task = await createUserTask({
    folderId,
    notes,
    title,
    userId: user.id
  });
  return NextResponse.json(task);
}
