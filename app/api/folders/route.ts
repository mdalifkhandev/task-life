import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-service";
import {
  readUserFolders,
  createUserFolder,
  deleteUserFolder,
  updateUserFolder
} from "@/lib/server/task-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folders = await readUserFolders(user.id);
  return NextResponse.json(folders);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color } = await req.json();
  const folder = await createUserFolder(user.id, name, color);
  return NextResponse.json(folder);
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { folderId } = await req.json();
  await deleteUserFolder(user.id, folderId);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { color, folderId, name } = await req.json();

  if (!folderId) {
    return NextResponse.json({ error: "Folder id is required" }, { status: 400 });
  }

  if (typeof name === "string" && name.trim().length === 0) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
  }

  const folder = await updateUserFolder({
    color,
    folderId,
    name,
    userId: user.id
  });

  if (!folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  return NextResponse.json(folder);
}
