"use client";

import {
  buildPlanGroups,
  findInsertionIndex,
  getCompletionPercent,
  INSERT_AT_END,
  sanitizeDetailLines,
  toGroupedTask,
  type GroupedTask,
  type MonthGroup,
  type Task,
  type WeekGroup
} from "@/lib/task-plan-core";
import { useEffect, useMemo, useState } from "react";

const requestTasks = async (input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const payload = (await response.json()) as {
    error?: string;
    tasks?: Task[];
  };

  if (!response.ok || !payload.tasks) {
    throw new Error(payload.error ?? "Task request failed");
  }

  return payload.tasks;
};

export {
  buildPlanGroups,
  findInsertionIndex,
  getCompletionPercent,
  INSERT_AT_END,
  sanitizeDetailLines,
  toGroupedTask
};
export type { GroupedTask, MonthGroup, Task, WeekGroup };

export function useTaskPlan() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTasks = async () => {
      try {
        const nextTasks = await requestTasks("/api/tasks", {
          cache: "no-store",
          method: "GET"
        });

        if (!cancelled) {
          setTasks(nextTasks);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load tasks from server"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  const groupedTasks = useMemo(() => tasks.map(toGroupedTask), [tasks]);
  const groupedPlan = useMemo(() => buildPlanGroups(tasks), [tasks]);

  const toggleTask = async (taskId: string) => {
    const currentTask = tasks.find((task) => task.id === taskId);

    if (!currentTask) {
      return;
    }

    try {
      const nextTasks = await requestTasks(`/api/tasks/${taskId}`, {
        body: JSON.stringify({
          done: !currentTask.done
        }),
        method: "PATCH"
      });

      setTasks(nextTasks);
      setError(null);
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update task status"
      );
    }
  };

  const insertTask = async (params: {
    beforeTaskId: string;
    monthKey: string;
    notes: string;
    title: string;
    weekKey: string;
  }) => {
    try {
      const nextTasks = await requestTasks("/api/tasks", {
        body: JSON.stringify(params),
        method: "POST"
      });

      setTasks(nextTasks);
      setError(null);
    } catch (insertError) {
      setError(
        insertError instanceof Error
          ? insertError.message
          : "Failed to insert task"
      );
    }
  };

  const updateTask = async (params: {
    details: string;
    taskId: string;
    title: string;
  }) => {
    try {
      const nextTasks = await requestTasks(`/api/tasks/${params.taskId}`, {
        body: JSON.stringify({
          details: params.details,
          title: params.title
        }),
        method: "PATCH"
      });

      setTasks(nextTasks);
      setError(null);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to save task edit"
      );
    }
  };

  return {
    error,
    groupedPlan,
    groupedTasks,
    insertTask,
    isLoading,
    tasks,
    toggleTask,
    updateTask
  };
}
