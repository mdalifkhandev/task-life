"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Folder,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Target
} from "lucide-react";
import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
  useTransition
} from "react";
import { useRouter } from "next/navigation";
import { type Task } from "@/lib/task-plan-core";
import { TaskModal } from "./task-modal";

type FolderSummary = {
  _id: string;
  color: string;
  name: string;
};

type TaskBoardClientProps = {
  activeFolderId?: string;
  allowCreate?: boolean;
  boardHint: string;
  boardTitle: string;
  emptyStateDescription: string;
  emptyStateTitle: string;
  folders: FolderSummary[];
  initialTasks: Task[];
  isArchive?: boolean;
};

type ViewFilter = "all" | "completed" | "open";

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

export function TaskBoardClient({
  activeFolderId,
  allowCreate = true,
  boardHint,
  boardTitle,
  emptyStateDescription,
  emptyStateTitle,
  folders,
  initialTasks,
  isArchive
}: TaskBoardClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>(
    isArchive ? "completed" : "all"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalRevision, setModalRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startNetworkTransition] = useTransition();
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const openTaskCount = useMemo(
    () => tasks.filter((task) => !task.done).length,
    [tasks]
  );
  const completedTaskCount = useMemo(
    () => tasks.filter((task) => task.done).length,
    [tasks]
  );
  const assignedTaskCount = useMemo(
    () => tasks.filter((task) => task.source === "assigned").length,
    [tasks]
  );
  const focusTasks = useMemo(
    () => tasks.filter((task) => !task.done).slice(0, 3),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const normalizedSearch = deferredSearchQuery.trim().toLowerCase();

    return tasks
      .filter((task) => {
        if (viewFilter === "completed") {
          return task.done;
        }

        if (viewFilter === "open") {
          return !task.done;
        }

        return true;
      })
      .filter((task) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          task.title.toLowerCase().includes(normalizedSearch) ||
          task.notes.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((left, right) => {
        if (left.done !== right.done) {
          return Number(left.done) - Number(right.done);
        }

        return left.title.localeCompare(right.title);
      });
  }, [deferredSearchQuery, tasks, viewFilter]);

  const openCreateModal = () => {
    setEditingTask(null);
    setModalRevision((current) => current + 1);
    setIsModalOpen(true);
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
    const finalFolderId = data.folderId || activeFolderId || "";

    try {
      if (editingTask) {
        const updatedTask = await requestTask<Task>(`/api/tasks/${editingTask.id}`, {
          body: JSON.stringify({
            details: data.notes,
            folderId: finalFolderId,
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
      } else {
        const createdTask = await requestTask<Task>("/api/tasks", {
          body: JSON.stringify({
            folderId: finalFolderId,
            notes: data.notes,
            title: data.title
          }),
          method: "POST"
        });

        startTransition(() => {
          setTasks((current) => [createdTask, ...current]);
        });
      }

      setError(null);
      closeModal();
      startNetworkTransition(() => router.refresh());
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save task"
      );
    }
  };

  const toggleDone = async (task: Task) => {
    const nextDone = !task.done;

    startTransition(() => {
      setTasks((current) =>
        current
          .map((entry) =>
            entry.id === task.id ? { ...entry, done: nextDone } : entry
          )
          .filter((entry) => !(isArchive && entry.id === task.id && !nextDone))
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

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            <Sparkles className="h-3.5 w-3.5" />
            {boardHint}
          </span>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {boardTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Structured like Asana, fast like Todoist, and calm like Sunsama.
                This board keeps the next move obvious.
              </p>
            </div>
            {allowCreate && (
              <button
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#FF7A59_0%,#FFC145_100%)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_35px_rgba(255,122,89,0.22)] transition hover:scale-[1.02]"
                onClick={openCreateModal}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Create task
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Open queue" value={openTaskCount} />
            <MetricCard label="Completed" value={completedTaskCount} />
            <MetricCard label="Assigned" value={assignedTaskCount} />
          </div>
        </div>

        <div className="rounded-[2.25rem] border border-white/10 bg-[rgba(10,14,24,0.82)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#00CDB2_0%,#7CFFCB_100%)] text-slate-950">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Focus lane
              </p>
              <h3 className="text-lg font-semibold text-white">
                Your next best actions
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {focusTasks.length === 0 ? (
              <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-white/4 p-5">
                <p className="text-sm font-medium text-white">
                  No active tasks left
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  You cleared the visible queue. Create something new or archive the
                  win.
                </p>
              </div>
            ) : (
              focusTasks.map((task, index) => (
                <div
                  className="rounded-[1.5rem] border border-white/8 bg-white/5 p-4"
                  key={task.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Priority {index + 1}
                      </p>
                      <h4 className="mt-2 text-sm font-semibold text-white">
                        {task.title}
                      </h4>
                    </div>
                    {task.source === "assigned" && (
                      <span className="rounded-full bg-[var(--brand-secondary)]/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-secondary)]">
                        Assigned
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2.1rem] border border-white/10 bg-[rgba(8,11,20,0.8)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3">
              <Search className="h-4 w-4 text-[var(--text-muted)]" />
              <input
                className="w-48 bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-muted)] sm:w-64"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search titles and notes"
                value={searchQuery}
              />
            </div>

            <FilterChip
              active={viewFilter === "all"}
              label="All"
              onClick={() => setViewFilter("all")}
            />
            <FilterChip
              active={viewFilter === "open"}
              label="Open"
              onClick={() => setViewFilter("open")}
            />
            <FilterChip
              active={viewFilter === "completed"}
              label="Completed"
              onClick={() => setViewFilter("completed")}
            />
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            {filteredTasks.length} visible of {tasks.length} total tasks
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-[1.3rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => {
              const folder = folders.find((item) => item._id === task.folderId);

              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={`group rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.14)] transition hover:border-white/18 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] ${
                    task.done ? "opacity-75" : ""
                  }`}
                  exit={{ opacity: 0, scale: 0.98 }}
                  initial={{ opacity: 0, y: 12 }}
                  key={task.id}
                  layout
                >
                  <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
                    <button
                      className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                        task.done
                          ? "border-emerald-400/20 bg-emerald-400/18 text-emerald-100"
                          : "border-white/12 bg-black/15 text-[var(--text-secondary)] hover:border-white/20 hover:text-white"
                      }`}
                      onClick={() => void toggleDone(task)}
                      type="button"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>

                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => openEditModal(task)}
                      type="button"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {task.source === "assigned" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-secondary)]/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-secondary)]">
                            <BriefcaseBusiness className="h-3 w-3" />
                            Assigned
                          </span>
                        )}

                        {folder && (
                          <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                            style={{
                              backgroundColor: `${folder.color}1F`,
                              color: folder.color
                            }}
                          >
                            <Folder className="h-3 w-3" />
                            {folder.name}
                          </span>
                        )}
                      </div>

                      <h3
                        className={`mt-3 text-xl font-semibold tracking-tight text-white ${
                          task.done ? "line-through decoration-white/30" : ""
                        }`}
                      >
                        {task.title}
                      </h3>

                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
                        {task.notes || "Open the task to add context, notes, or a clear next step."}
                      </p>
                    </button>

                    <button
                      className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/15 text-[var(--text-secondary)] opacity-0 transition group-hover:opacity-100 hover:border-white/20 hover:text-white"
                      onClick={() => openEditModal(task)}
                      type="button"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredTasks.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/3 px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-white/6">
                <Clock3 className="h-7 w-7 text-[var(--text-muted)]" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">
                {emptyStateTitle}
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
                {emptyStateDescription}
              </p>
            </div>
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
            : activeFolderId
              ? {
                  folderId: activeFolderId,
                  notes: "",
                  title: ""
                }
              : undefined
        }
        isOpen={isModalOpen}
        key={`task-modal-${modalRevision}-${editingTask?.id ?? "new"}`}
        onClose={closeModal}
        onDelete={editingTask ? handleDelete : undefined}
        onSave={handleSave}
      />

      {isPending && (
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Syncing workspace changes...
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

function FilterChip({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-950"
          : "border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:text-white"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
