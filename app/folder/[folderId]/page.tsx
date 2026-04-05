import { DashboardLayout } from "@/components/dashboard-layout";
import { DsaPlanBoard } from "@/components/dsa-plan-board";
import { requireAuthenticatedPageUser } from "@/lib/server/auth-service";
import {
  readUserFolders,
  readUserNotifications,
  readUserTasks
} from "@/lib/server/task-service";
import { TaskBoardClient } from "@/components/task-board-client";
import { FolderModel } from "@/lib/server/folder-document";
import { connectToDatabase } from "@/lib/server/mongodb";
import { notFound } from "next/navigation";

export default async function FolderPage({ params }: { params: Promise<{ folderId: string }> }) {
  const user = await requireAuthenticatedPageUser();
  const { folderId } = await params;

  await connectToDatabase();
  const folder = await FolderModel.findOne({ _id: folderId, userId: user.id }).lean();
  
  if (!folder) {
    notFound();
  }

  const tasks = await readUserTasks(user.id, { folderId });
  const folders = await readUserFolders(user.id);
  const notifications = await readUserNotifications(user.id);

  return (
    <DashboardLayout
      initialFolders={folders}
      initialNotifications={notifications}
      user={user}
    >
      {folder.name.toLowerCase() === "dsa" ? (
        <DsaPlanBoard
          activeFolderId={folderId}
          folders={folders}
          initialTasks={tasks}
        />
      ) : (
        <TaskBoardClient
          activeFolderId={folderId}
          boardHint={`${folder.name} collection`}
          boardTitle={`Everything in ${folder.name} is gathered into one premium lane.`}
          emptyStateDescription={`No tasks live in ${folder.name} yet. Create one here or move an existing task into this collection.`}
          emptyStateTitle={`${folder.name} is empty`}
          folders={folders}
          initialTasks={tasks}
        />
      )}
    </DashboardLayout>
  );
}
