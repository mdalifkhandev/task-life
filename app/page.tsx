import { DashboardLayout } from "@/components/dashboard-layout";
import { requireAuthenticatedPageUser } from "@/lib/server/auth-service";
import {
  readUserFolders,
  readUserNotifications,
  readUserTasks
} from "@/lib/server/task-service";
import { TaskBoardClient } from "@/components/task-board-client";

export default async function Home() {
  const user = await requireAuthenticatedPageUser();
  const tasks = await readUserTasks(user.id, { source: "personal" });
  const folders = await readUserFolders(user.id);
  const notifications = await readUserNotifications(user.id);

  return (
    <DashboardLayout
      initialFolders={folders}
      initialNotifications={notifications}
      user={user}
    >
      <TaskBoardClient
        boardHint="Personal workspace"
        boardTitle="Build your own system, one intentional task at a time."
        emptyStateDescription="Create a task, drop it into a folder, and shape your private operating system exactly how you want it."
        emptyStateTitle="Your personal workspace is clear"
        folders={folders}
        initialTasks={tasks}
      />
    </DashboardLayout>
  );
}
