import { DashboardLayout } from "@/components/dashboard-layout";
import { requireAuthenticatedPageUser } from "@/lib/server/auth-service";
import {
  readUserFolders,
  readUserNotifications,
  readUserTasks
} from "@/lib/server/task-service";
import { TaskBoardClient } from "@/components/task-board-client";

export default async function TodayPage() {
  const user = await requireAuthenticatedPageUser();
  const allTasks = await readUserTasks(user.id);
  const folders = await readUserFolders(user.id);
  const notifications = await readUserNotifications(user.id);
  const todayTasks = allTasks.filter(
    (task) => !task.done && task.source !== "dsa"
  );

  return (
    <DashboardLayout
      initialFolders={folders}
      initialNotifications={notifications}
      user={user}
    >
      <TaskBoardClient
        allowCreate={false}
        boardHint={new Date().toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })}
        boardTitle="Today&apos;s focus lane keeps your active work visible."
        emptyStateDescription="Nothing is currently active. Accept an assignment or create a personal task from My Desk."
        emptyStateTitle="No active tasks for today"
        folders={folders}
        initialTasks={todayTasks}
      />
    </DashboardLayout>
  );
}
