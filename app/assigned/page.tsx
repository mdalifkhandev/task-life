import { DashboardLayout } from "@/components/dashboard-layout";
import { TaskBoardClient } from "@/components/task-board-client";
import { requireAuthenticatedPageUser } from "@/lib/server/auth-service";
import {
  readUserFolders,
  readUserNotifications,
  readUserTasks
} from "@/lib/server/task-service";

export default async function AssignedPage() {
  const user = await requireAuthenticatedPageUser();
  const tasks = await readUserTasks(user.id, { source: "assigned" });
  const folders = await readUserFolders(user.id);
  const notifications = await readUserNotifications(user.id);

  return (
    <DashboardLayout
      initialFolders={folders}
      initialNotifications={notifications}
      user={user}
    >
      <TaskBoardClient
        allowCreate={false}
        boardHint="Accepted assignments"
        boardTitle="Admin work lands here only after you accept it."
        emptyStateDescription="When an admin sends a proposal and you accept it from notifications, the task appears in this dedicated lane."
        emptyStateTitle="No accepted assignments yet"
        folders={folders}
        initialTasks={tasks}
      />
    </DashboardLayout>
  );
}
