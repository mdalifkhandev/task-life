"use client";

import {
  INSERT_AT_END,
  type GroupedTask,
  getCompletionPercent,
  useTaskPlan
} from "@/lib/task-plan";
import { useMemo, useState } from "react";

export function TaskListBoard() {
  const { groupedPlan, groupedTasks, insertTask, toggleTask, updateTask } = useTaskPlan();
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    () => new Set(["Month 1"])
  );
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(
    () => new Set(["Month 1::Week 1"])
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState("");
  const [selectedWeekKey, setSelectedWeekKey] = useState("");
  const [insertBeforeTaskId, setInsertBeforeTaskId] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [editingTaskId, setEditingTaskId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "done" | "exam"
  >("all");

  const totalDays = groupedTasks.filter((task) => task.kind === "day").length;
  const completedDays = groupedTasks.filter(
    (task) => task.kind === "day" && task.done
  ).length;
  const activeMonth =
    groupedPlan.find((month) => month.key === selectedMonthKey) ?? groupedPlan[0];
  const activeWeek =
    activeMonth?.weeks.find((week) => week.key === selectedWeekKey) ??
    activeMonth?.weeks[0];
  const insertableDays = activeWeek?.tasks.filter((task) => task.kind === "day") ?? [];
  const safeInsertBeforeTaskId =
    insertableDays.some((task) => task.id === insertBeforeTaskId)
      ? insertBeforeTaskId
      : insertableDays[0]?.id ?? INSERT_AT_END;
  const editingTask = groupedTasks.find((task) => task.id === editingTaskId);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredMonths = useMemo(
    () =>
      groupedPlan
        .map((month) => {
          const weeks = month.weeks
            .map((week) => ({
              ...week,
              tasks: week.tasks.filter((task) => {
                const matchesQuery =
                  normalizedQuery.length === 0 ||
                  task.topic.toLowerCase().includes(normalizedQuery) ||
                  task.label.toLowerCase().includes(normalizedQuery) ||
                  task.details.some((detail) =>
                    detail.toLowerCase().includes(normalizedQuery)
                  );

                const matchesStatus =
                  statusFilter === "all" ||
                  (statusFilter === "pending" &&
                    task.kind === "day" &&
                    !task.done) ||
                  (statusFilter === "done" && task.done) ||
                  (statusFilter === "exam" && task.kind === "exam");

                return matchesQuery && matchesStatus;
              })
            }))
            .filter((week) => week.tasks.length > 0);

          return {
            ...month,
            weeks
          };
        })
        .filter((month) => month.weeks.length > 0),
    [groupedPlan, normalizedQuery, statusFilter]
  );

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

  const handleMonthChange = (monthKey: string) => {
    const nextMonth = groupedPlan.find((month) => month.key === monthKey) ?? groupedPlan[0];
    const nextWeek = nextMonth?.weeks[0];
    const nextDay = nextWeek?.tasks.find((task) => task.kind === "day");

    setSelectedMonthKey(monthKey);
    setSelectedWeekKey(nextWeek?.key ?? "");
    setInsertBeforeTaskId(nextDay?.id ?? INSERT_AT_END);
  };

  const handleWeekChange = (weekKey: string) => {
    const nextWeek = activeMonth?.weeks.find((week) => week.key === weekKey) ?? activeWeek;
    const nextDay = nextWeek?.tasks.find((task) => task.kind === "day");

    setSelectedWeekKey(weekKey);
    setInsertBeforeTaskId(nextDay?.id ?? INSERT_AT_END);
  };

  const handleInsert = () => {
    const trimmedTitle = newTaskTitle.trim();
    const trimmedNotes = newTaskNotes.trim();

    if (!trimmedTitle || !activeMonth || !activeWeek) {
      return;
    }

    insertTask({
      beforeTaskId: safeInsertBeforeTaskId,
      monthKey: activeMonth.key,
      notes: trimmedNotes,
      title: trimmedTitle,
      weekKey: activeWeek.key
    });

    setExpandedMonths((current) => new Set(current).add(activeMonth.key));
    setExpandedWeeks((current) => new Set(current).add(activeWeek.key));
    setNewTaskTitle("");
    setNewTaskNotes("");
    setEditingTaskId("");
  };

  const startEditing = (task: GroupedTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.topic);
    setEditDetails(task.details.join("\n"));
    setExpandedMonths((current) => new Set(current).add(task.month));
    setExpandedWeeks((current) => new Set(current).add(`${task.month}::${task.week}`));
  };

  const handleSaveEdit = () => {
    const trimmedTitle = editTitle.trim();

    if (!editingTaskId || !trimmedTitle) {
      return;
    }

    updateTask({
      details: editDetails,
      taskId: editingTaskId,
      title: trimmedTitle
    });

    setEditingTaskId("");
    setEditTitle("");
    setEditDetails("");
  };

  const handleCancelEdit = () => {
    setEditingTaskId("");
    setEditTitle("");
    setEditDetails("");
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[0.34fr_0.66fr]">
      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.82))] p-6 shadow-[0_35px_100px_rgba(2,6,23,0.45)] backdrop-blur-xl">
          <div className="space-y-5">
            <span
              style={{ fontFamily: "var(--font-mono)" }}
              className="inline-flex rounded-full border border-amber-300/25 bg-amber-200/10 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-amber-100"
            >
              Command Deck
            </span>
            <div>
              <h2 className="max-w-md text-3xl font-semibold tracking-tight text-white">
                Better UX, faster edits, and a cleaner task flow.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Insert new tasks, edit existing ones, and manage the full roadmap
                from a single control panel.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <article className="rounded-3xl border border-emerald-300/15 bg-emerald-300/8 p-4">
              <p className="text-sm text-slate-300">Day Progress</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {completedDays}/{totalDays}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {getCompletionPercent(completedDays, totalDays)}% day completion
              </p>
            </article>
            <article className="rounded-3xl border border-cyan-300/15 bg-cyan-300/8 p-4">
              <p className="text-sm text-slate-300">Months Open</p>
              <p className="mt-2 text-3xl font-semibold text-white">{groupedPlan.length}</p>
              <p className="mt-2 text-sm text-slate-300">
                Roadmap split across structured month buckets.
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-5 shadow-[0_25px_80px_rgba(8,15,31,0.35)] backdrop-blur-xl">
          <div className="space-y-4">
            <p
              style={{ fontFamily: "var(--font-mono)" }}
              className="text-xs uppercase tracking-[0.35em] text-amber-100/80"
            >
              Insert Task
            </p>
            <h3 className="text-2xl font-semibold text-white">
              Drop a new task into any week and auto-renumber the roadmap.
            </h3>
          </div>

          <div className="mt-5 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Month</span>
              <select
                value={activeMonth?.key ?? ""}
                onChange={(event) => handleMonthChange(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-amber-300/60"
              >
                {groupedPlan.map((month) => (
                  <option key={month.key} value={month.key} className="bg-slate-950">
                    {month.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Week</span>
              <select
                value={activeWeek?.key ?? ""}
                onChange={(event) => handleWeekChange(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-amber-300/60"
              >
                {(activeMonth?.weeks ?? []).map((week) => (
                  <option key={week.key} value={week.key} className="bg-slate-950">
                    {week.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Insert before day</span>
              <select
                value={safeInsertBeforeTaskId}
                onChange={(event) => setInsertBeforeTaskId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-amber-300/60"
              >
                {insertableDays.map((task) => (
                  <option key={task.id} value={task.id} className="bg-slate-950">
                    {task.label} - {task.topic}
                  </option>
                ))}
                <option value={INSERT_AT_END} className="bg-slate-950">
                  After last day in this week
                </option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Task title</span>
              <input
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                placeholder="Example: Practice sliding window"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-amber-300/60"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Task notes</span>
              <textarea
                value={newTaskNotes}
                onChange={(event) => setNewTaskNotes(event.target.value)}
                placeholder="Short details for the inserted task"
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-amber-300/60"
              />
            </label>

            <button
              type="button"
              onClick={handleInsert}
              className="w-full rounded-full bg-amber-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-amber-200"
            >
              Insert task and renumber
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-5 shadow-[0_25px_80px_rgba(8,15,31,0.35)] backdrop-blur-xl">
          <div className="space-y-4">
            <p
              style={{ fontFamily: "var(--font-mono)" }}
              className="text-xs uppercase tracking-[0.35em] text-cyan-100/80"
            >
              Edit Task
            </p>
            <h3 className="text-2xl font-semibold text-white">
              {editingTask ? `Editing ${editingTask.label}` : "Pick any day card and press Edit."}
            </h3>
          </div>

          <div className="mt-5 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Task title</span>
              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder="Select a day task to edit"
                disabled={!editingTask}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-45 focus:border-cyan-300/60"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Task details</span>
              <textarea
                value={editDetails}
                onChange={(event) => setEditDetails(event.target.value)}
                placeholder="Task details appear here"
                rows={5}
                disabled={!editingTask}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-45 focus:border-cyan-300/60"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editingTask}
                className="rounded-full bg-cyan-300 px-5 py-3 font-medium text-slate-950 transition enabled:hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
              >
                Save edit
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={!editingTask}
                className="rounded-full border border-white/12 bg-white/5 px-5 py-3 font-medium text-white transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      </aside>

      <div className="space-y-4">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.82),rgba(30,41,59,0.58))] p-4 shadow-[0_20px_60px_rgba(8,15,31,0.25)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search task, topic, or detail..."
              className="min-w-60 flex-1 rounded-full border border-white/10 bg-slate-950/45 px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60"
            />
            {(["all", "pending", "done", "exam"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatusFilter(item)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  statusFilter === item
                    ? "bg-amber-300 text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                {item === "all"
                  ? "All"
                  : item === "pending"
                    ? "Pending"
                    : item === "done"
                      ? "Done"
                      : "Exams"}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.28em] text-slate-400">
            Compact View
          </p>
        </section>

        {filteredMonths.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-6 text-center text-slate-300 backdrop-blur-xl">
            No tasks match your current search or filter.
          </section>
        ) : null}

        {filteredMonths.map((month) => {
          const isMonthExpanded = expandedMonths.has(month.key);
          const monthPercent = getCompletionPercent(month.completed, month.total);

          return (
            <article
              key={month.key}
              className="rounded-[1.75rem] border border-white/10 bg-white/6 p-4 shadow-[0_20px_50px_rgba(8,15,31,0.25)] backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={() => toggleMonth(month.key)}
                className="flex w-full flex-wrap items-center justify-between gap-4 rounded-[1.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.86),rgba(30,41,59,0.58))] px-4 py-3 text-left transition hover:border-amber-300/30 hover:bg-slate-950/45"
              >
                <div>
                  <p
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="text-[11px] uppercase tracking-[0.3em] text-amber-100/70"
                  >
                    Month Section
                  </p>
                  <h3 className="mt-1.5 text-xl font-semibold text-white">
                    {month.title}
                  </h3>
                </div>
                <div className="min-w-36 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
                  <p className="text-sm text-slate-300">
                    {month.completed}/{month.total} done
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-amber-300 via-cyan-300 to-emerald-300"
                      style={{ width: `${monthPercent}%` }}
                    />
                  </div>
                </div>
              </button>

              {isMonthExpanded ? (
                <div className="mt-3 space-y-2.5">
                  {month.weeks.map((week) => {
                    const isWeekExpanded = expandedWeeks.has(week.key);
                    const weekPercent = getCompletionPercent(week.completed, week.total);

                    return (
                      <section
                        key={week.key}
                        className="rounded-[1.4rem] border border-white/10 bg-slate-950/30 p-3"
                      >
                        <button
                          type="button"
                          onClick={() => toggleWeek(week.key)}
                          className="flex w-full flex-wrap items-center justify-between gap-4 rounded-[1.1rem] border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:border-cyan-300/30 hover:bg-white/8"
                        >
                          <div>
                            <p
                              style={{ fontFamily: "var(--font-mono)" }}
                              className="text-[11px] uppercase tracking-[0.3em] text-cyan-100/70"
                            >
                              Week Section
                            </p>
                            <h4 className="mt-1.5 text-lg font-semibold text-white">
                              {week.title}
                            </h4>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-right">
                            <p className="text-sm text-slate-300">
                              {week.completed}/{week.total} done
                            </p>
                            <p className="text-xs text-slate-500">{weekPercent}% complete</p>
                          </div>
                        </button>

                        {isWeekExpanded ? (
                          <div className="mt-3 space-y-2">
                            {week.tasks.map((task: GroupedTask) => (
                              <article
                                key={task.id}
                                className={`rounded-[1.7rem] border p-4 transition ${
                                  editingTaskId === task.id
                                    ? "border-cyan-300/45 bg-cyan-300/8 shadow-[0_0_0_1px_rgba(103,232,249,0.12)]"
                                    : "border-white/10 bg-white/5"
                                }`}
                              >
                                <div className="flex flex-wrap items-start gap-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleTask(task.id)}
                                    className={`mt-0.5 h-5 w-5 rounded-full border text-[10px] transition ${
                                      task.done
                                        ? "border-emerald-300 bg-emerald-300 text-slate-950"
                                        : "border-white/20 bg-transparent text-transparent"
                                    }`}
                                    aria-label={`Mark ${task.title} as done`}
                                  >
                                    ✓
                                  </button>

                                  <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        style={{ fontFamily: "var(--font-mono)" }}
                                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300"
                                      >
                                        {task.label}
                                      </span>
                                      <span
                                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                                          task.done
                                            ? "bg-emerald-300/15 text-emerald-100"
                                            : "bg-cyan-300/15 text-cyan-100"
                                        }`}
                                      >
                                        {task.done
                                          ? "Done"
                                          : task.kind === "exam"
                                            ? "Exam"
                                            : "Pending"}
                                      </span>
                                      {task.kind === "day" ? (
                                        <button
                                          type="button"
                                          onClick={() => startEditing(task)}
                                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200 transition hover:bg-white/10"
                                        >
                                          Edit
                                        </button>
                                      ) : null}
                                    </div>

                                    <div>
                                      <h5
                                        className={`text-base font-medium text-white ${
                                          task.done ? "line-through opacity-60" : ""
                                        }`}
                                      >
                                        {task.topic}
                                      </h5>
                                      <p className="mt-1 text-xs text-slate-400">
                                        {task.month} • {task.week}
                                      </p>
                                    </div>

                                    <div className="space-y-1 text-sm leading-5 text-slate-300">
                                      {task.details.slice(0, 2).map((detail) => (
                                        <p key={`${task.id}-${detail}`}>{detail}</p>
                                      ))}
                                      {task.details.length > 2 ? (
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                          +{task.details.length - 2} more lines
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        ) : null}
                      </section>
                    );
                  })}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
