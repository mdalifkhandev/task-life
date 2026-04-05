import { DashboardLayout } from "@/components/dashboard-layout";
import { requireAuthenticatedPageUser } from "@/lib/server/auth-service";
import {
  readUserFolders,
  readUserNotifications,
  readUserTasks
} from "@/lib/server/task-service";
import { TaskBoardClient } from "@/components/task-board-client";

export default async function CompletedPage() {
  const user = await requireAuthenticatedPageUser();
  const allTasks = await readUserTasks(user.id);
  const folders = await readUserFolders(user.id);
  const notifications = await readUserNotifications(user.id);
  const completedTasks = allTasks.filter(
    (task) => task.done && task.source !== "dsa"
  );

  return (
    <DashboardLayout
      initialFolders={folders}
      initialNotifications={notifications}
      user={user}
    >
      <TaskBoardClient
        allowCreate={false}
        boardHint="Archive"
        boardTitle="Completed work stays visible as proof, not clutter."
        emptyStateDescription="Finish a task and it will appear here with the rest of your shipped work."
        emptyStateTitle="Nothing completed yet"
        folders={folders}
        initialTasks={completedTasks}
        isArchive
      />
    </DashboardLayout>
  );
}
