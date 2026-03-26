import {
  buildNotes,
  buildPlanGroups,
  findInsertionIndex,
  renumberDayTasks,
  sanitizeDetailLines,
  type Task,
  toGroupedTask
} from "@/lib/task-plan-core";
import { connectToDatabase } from "./mongodb";
import { TaskModel } from "./task-document";

const serializeTask = (task: {
  done: boolean;
  notes: string;
  taskId: string;
  title: string;
}): Task => ({
  done: task.done,
  id: task.taskId,
  notes: task.notes,
  title: task.title
});

async function replaceTasks(tasks: Task[]) {
  const normalizedTasks = renumberDayTasks(tasks);

  await TaskModel.deleteMany({});
  await TaskModel.insertMany(
    normalizedTasks.map((task, index) => ({
      done: task.done,
      notes: task.notes,
      order: index,
      taskId: task.id,
      title: task.title
    }))
  );

  return normalizedTasks;
}

export async function readTasksFromDatabase() {
  await connectToDatabase();

  const documents = await TaskModel.find().sort({ order: 1 }).lean();

  if (documents.length === 0) {
    throw new Error("No tasks found in MongoDB. Run `npm run seed:tasks` first.");
  }

  return documents.map(serializeTask);
}

export async function insertTaskIntoDatabase(params: {
  beforeTaskId: string;
  monthKey: string;
  notes: string;
  title: string;
  weekKey: string;
}) {
  const { beforeTaskId, monthKey, notes, title, weekKey } = params;
  const currentTasks = await readTasksFromDatabase();
  const currentPlan = buildPlanGroups(currentTasks);
  const month = currentPlan.find((item) => item.key === monthKey);
  const week = month?.weeks.find((item) => item.key === weekKey);
  const insertionIndex = findInsertionIndex(currentTasks, week, beforeTaskId);
  const nextTasks = [...currentTasks];

  nextTasks.splice(insertionIndex, 0, {
    done: false,
    id: "custom-pending",
    notes: buildNotes(month?.title ?? monthKey, week?.title ?? weekKey, [
      `Focus: ${title}`,
      ...(notes ? [`Note: ${notes}`] : [])
    ]),
    title
  });

  return replaceTasks(nextTasks);
}

export async function updateTaskInDatabase(params: {
  details?: string;
  done?: boolean;
  taskId: string;
  title?: string;
}) {
  const { details, done, taskId, title } = params;
  const currentTasks = await readTasksFromDatabase();

  const nextTasks = currentTasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const groupedTask = toGroupedTask(task);

    return {
      ...task,
      done: typeof done === "boolean" ? done : task.done,
      notes:
        typeof details === "string"
          ? buildNotes(
              groupedTask.month,
              groupedTask.week,
              sanitizeDetailLines(details)
            )
          : task.notes,
      title: typeof title === "string" ? title : task.title
    };
  });

  return replaceTasks(nextTasks);
}
