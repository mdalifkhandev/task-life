"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  PencilLine,
  Search,
  Sparkles,
  Target
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  buildPlanGroups,
  getCompletionPercent,
  sanitizeDetailLines,
  toGroupedTask,
  type GroupedTask,
  type Task
} from "@/lib/task-plan-core";
import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
  useTransition
} from "react";
import { TaskModal } from "./task-modal";

type FolderSummary = {
  _id: string;
  color: string;
  name: string;
};

const requestTask = async <T,>(input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Task request failed");
  }

  return payload;
};

export function DsaPlanBoard({
  activeFolderId,
  folders,
  initialTasks
}: {
  activeFolderId: string;
  folders: FolderSummary[];
  initialTasks: Task[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    () => new Set(["Month 1"])
  );
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(
    () => new Set(["Month 1::Week 1"])
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRevision, setModalRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startNetworkTransition] = useTransition();
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const groupedTasks = useMemo(() => tasks.map(toGroupedTask), [tasks]);
  const openTaskCount = useMemo(
    () => tasks.filter((task) => !task.done).length,
    [tasks]
  );
  const completedTaskCount = useMemo(
    () => tasks.filter((task) => task.done).length,
    [tasks]
  );
  const monthCount = useMemo(() => buildPlanGroups(tasks).length, [tasks]);

  const filteredMonths = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    const visibleTasks =
      normalizedQuery.length === 0
        ? tasks
        : tasks.filter((task) => {
            const groupedTask = toGroupedTask(task);

            return (
              task.title.toLowerCase().includes(normalizedQuery) ||
              task.notes.toLowerCase().includes(normalizedQuery) ||
              groupedTask.topic.toLowerCase().includes(normalizedQuery) ||
              groupedTask.details.some((detail) =>
                detail.toLowerCase().includes(normalizedQuery)
              )
            );
          });

    return buildPlanGroups(visibleTasks);
  }, [deferredSearchQuery, tasks]);

  const toggleTask = async (task: Task) => {
    const nextDone = !task.done;

    startTransition(() => {
      setTasks((current) =>
        current.map((entry) =>
          entry.id === task.id ? { ...entry, done: nextDone } : entry
        )
      );
    });

    try {
      await requestTask<Task>(`/api/tasks/${task.id}`, {
        body: JSON.stringify({ done: nextDone }),
        method: "PATCH"
      });
      setError(null);
      startNetworkTransition(() => router.refresh());
    } catch (toggleError) {
      startTransition(() => {
        setTasks((current) =>
          current.map((entry) =>
            entry.id === task.id ? { ...entry, done: task.done } : entry
          )
        );
      });
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update task"
      );
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModalRevision((current) => current + 1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  const handleSave = async (data: {
    folderId?: string;
    notes: string;
    title: string;
  }) => {
    if (!editingTask) {
      return;
    }

    try {
      const updatedTask = await requestTask<Task>(`/api/tasks/${editingTask.id}`, {
        body: JSON.stringify({
          details: data.notes,
          folderId: data.folderId || activeFolderId,
          title: data.title
        }),
        method: "PATCH"
      });

      startTransition(() => {
        setTasks((current) =>
          current.map((task) =>
            task.id === editingTask.id ? updatedTask : task
          )
        );
      });

      setError(null);
      closeModal();
      startNetworkTransition(() => router.refresh());
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save task"
      );
    }
  };

  const handleDelete = async () => {
    if (!editingTask) {
      return;
    }

    try {
      await requestTask<{ success: true }>(`/api/tasks/${editingTask.id}`, {
        method: "DELETE"
      });

      startTransition(() => {
        setTasks((current) =>
          current.filter((task) => task.id !== editingTask.id)
        );
      });

      setError(null);
      closeModal();
      startNetworkTransition(() => router.refresh());
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete task"
      );
    }
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((current) => {
      const next = new Set(current);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

  const toggleWeek = (weekKey: string) => {
    setExpandedWeeks((current) => {
      const next = new Set(current);
      if (next.has(weekKey)) {
        next.delete(weekKey);
      } else {
        next.add(weekKey);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            <Sparkles className="h-3.5 w-3.5" />
            DSA roadmap
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            DSA tasks are now grouped by month and week.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            The full plan is organized as a roadmap, so you can move through each
            month and week in sequence instead of scanning one long list.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Months" value={monthCount} />
            <MetricCard label="Open tasks" value={openTaskCount} />
            <MetricCard label="Completed" value={completedTaskCount} />
          </div>
        </div>

        <div className="rounded-[2.25rem] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#00CDB2_0%,#7CFFCB_100%)] text-slate-950">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Active focus
              </p>
              <h3 className="text-lg font-semibold text-white">
                Next roadmap steps
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {groupedTasks.filter((task) => !task.done).slice(0, 3).map((task) => (
              <div
                className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4"
                key={task.id}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  {task.month} • {task.week}
                </p>
                <h4 className="mt-2 text-sm font-semibold text-white">
                  {task.label}: {task.topic}
                </h4>
              </div>
            ))}

            {groupedTasks.filter((task) => !task.done).length === 0 && (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/4 p-5">
                <p className="text-sm font-medium text-white">
                  DSA roadmap completed
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Every visible DSA task is done.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2.1rem] border border-white/10 bg-[rgba(8,11,20,0.8)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3">
            <Search className="h-4 w-4 text-[var(--text-muted)]" />
            <input
              className="w-48 bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-muted)] sm:w-72"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search month, week, topic, or detail"
              value={searchQuery}
            />
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            {tasks.length} tasks in roadmap
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-[1.3rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-6">
          {filteredMonths.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-white/6">
                <Clock3 className="h-7 w-7 text-[var(--text-muted)]" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">
                No DSA roadmap result found
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
                Try a different search term.
              </p>
            </div>
          ) : (
            filteredMonths.map((month) => {
              const monthPercent = getCompletionPercent(
                month.completed,
                month.total
              );
              const isExpanded = expandedMonths.has(month.key);

              return (
                <div className="space-y-4" key={month.key}>
                  <button
                    className="flex w-full items-center justify-between rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 text-left transition hover:border-white/18"
                    onClick={() => toggleMonth(month.key)}
                    type="button"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-white/8 text-white">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </span>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                          Monthly bucket
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          {month.title}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {month.completed} / {month.total}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {monthPercent}% complete
                      </p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 pl-3 sm:pl-6">
                      {month.weeks.map((week) => {
                        const weekPercent = getCompletionPercent(
                          week.completed,
                          week.total
                        );
                        const isWeekExpanded = expandedWeeks.has(week.key);

                        return (
                          <div className="space-y-3" key={week.key}>
                            <button
                              className="flex w-full items-center justify-between rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-3 text-left transition hover:border-white/14"
                              onClick={() => toggleWeek(week.key)}
                              type="button"
                            >
                              <div className="flex items-center gap-3">
                                {isWeekExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" />
                                )}
                                <span className="text-sm font-semibold text-white">
                                  {week.title}
                                </span>
                              </div>

                              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                {weekPercent}% complete
                              </span>
                            </button>

                            {isWeekExpanded && (
                              <div className="grid gap-3 pl-3 sm:pl-6">
                                {week.tasks.map((task) => (
                                  <TaskCard
                                    key={task.id}
                                    onEdit={() => openEditModal(task)}
                                    onToggle={() => void toggleTask(task)}
                                    task={task}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <TaskModal
        folders={folders}
        initialData={
          editingTask
            ? {
                folderId: editingTask.folderId,
                notes: editingTask.notes,
                title: editingTask.title
              }
            : undefined
        }
        isOpen={isModalOpen}
        key={`dsa-modal-${modalRevision}-${editingTask?.id ?? "none"}`}
        onClose={closeModal}
        onDelete={editingTask ? handleDelete : undefined}
        onSave={handleSave}
      />

      {isPending && (
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Syncing roadmap changes...
        </p>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function TaskCard({
  onEdit,
  onToggle,
  task
}: {
  onEdit: () => void;
  onToggle: () => void;
  task: GroupedTask;
}) {
  const details = sanitizeDetailLines(task.details.join("\n"));

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.14)] ${
        task.done ? "opacity-75" : ""
      }`}
      initial={{ opacity: 0, y: 10 }}
      layout
    >
      <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
        <button
          className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
            task.done
              ? "border-emerald-400/20 bg-emerald-400/18 text-emerald-100"
              : "border-white/12 bg-black/15 text-[var(--text-secondary)] hover:border-white/20 hover:text-white"
          }`}
          onClick={onToggle}
          type="button"
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>

        <button className="min-w-0 flex-1 text-left" onClick={onEdit} type="button">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {task.label}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                task.kind === "exam"
                  ? "bg-[var(--brand-primary)]/14 text-[var(--brand-primary)]"
                  : "bg-[var(--brand-secondary)]/14 text-[var(--brand-secondary)]"
              }`}
            >
              {task.week}
            </span>
          </div>

          <h4
            className={`mt-3 text-xl font-semibold tracking-tight text-white ${
              task.done ? "line-through decoration-white/30" : ""
            }`}
          >
            {task.topic}
          </h4>

          <div className="mt-3 space-y-2">
            {details.slice(0, 3).map((detail) => (
              <p
                className="text-sm leading-7 text-[var(--text-secondary)]"
                key={`${task.id}-${detail}`}
              >
                {detail}
              </p>
            ))}
            {details.length > 3 && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                + {details.length - 3} more lines
              </p>
            )}
          </div>
        </button>

        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/15 text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white"
          onClick={onEdit}
          type="button"
        >
          <PencilLine className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
