"use client";

import {
  INSERT_AT_END,
  type GroupedTask,
  getCompletionPercent,
  useTaskPlan
} from "@/lib/task-plan";
import { useMemo, useState } from "react";

export function TaskListBoard() {
  const {
    error,
    groupedPlan,
    groupedTasks,
    insertTask,
    isLoading,
    toggleTask,
    updateTask
  } = useTaskPlan();
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
    <section className="grid gap-8 xl:grid-cols-[0.35fr_0.65fr]">
      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        {error ? (
          <section className="glass rounded-2xl border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
            Server error: {error}
          </section>
        ) : null}
        
        <section className="glass rounded-[2rem] p-6 shadow-2xl">
          <div className="space-y-4">
            <span
              style={{ fontFamily: "var(--font-mono)" }}
              className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-300"
            >
              Command Deck
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Task Management
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Insert new tasks, edit existing ones, and manage the full roadmap from a single control panel.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <article className="glass-shine relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/80">Day Progress</p>
              <p className="mt-2 text-4xl font-bold text-white">
                {completedDays}<span className="text-xl text-slate-500">/{totalDays}</span>
              </p>
              <div className="mt-4 h-1.5 w-full rounded-full bg-white/5">
                <div 
                  className="h-full rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all duration-500"
                  style={{ width: `${getCompletionPercent(completedDays, totalDays)}%` }}
                />
              </div>
            </article>
            <article className="glass-shine relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-400/80">Active Roadmap</p>
              <p className="mt-2 text-4xl font-bold text-white">{groupedPlan.length}<span className="text-xl text-slate-500"> Months</span></p>
              <p className="mt-2 text-xs text-slate-400">Roadmap split across structured buckets.</p>
            </article>
          </div>
        </section>

        <section className="glass rounded-[2rem] p-6 shadow-2xl">
          <div className="space-y-4">
            <p
              style={{ fontFamily: "var(--font-mono)" }}
              className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-400"
            >
              Quick Action
            </p>
            <h3 className="text-xl font-bold text-white">Insert Task</h3>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-medium uppercase text-slate-500">Month</span>
                <select
                  value={activeMonth?.key ?? ""}
                  onChange={(event) => handleMonthChange(event.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.05]"
                >
                  {groupedPlan.map((month) => (
                    <option key={month.key} value={month.key} className="bg-slate-950">
                      {month.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] font-medium uppercase text-slate-500">Week</span>
                <select
                  value={activeWeek?.key ?? ""}
                  onChange={(event) => handleWeekChange(event.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.05]"
                >
                  {(activeMonth?.weeks ?? []).map((week) => (
                    <option key={week.key} value={week.key} className="bg-slate-950">
                      {week.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-medium uppercase text-slate-500">Insert Position</span>
              <select
                value={safeInsertBeforeTaskId}
                onChange={(event) => setInsertBeforeTaskId(event.target.value)}
                className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.05]"
              >
                {insertableDays.map((task) => (
                  <option key={task.id} value={task.id} className="bg-slate-950">
                    Before {task.label}: {task.topic}
                  </option>
                ))}
                <option value={INSERT_AT_END} className="bg-slate-950">
                  After last day in week
                </option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-medium uppercase text-slate-500">Task Title</span>
              <input
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                placeholder="Practice sliding window..."
                className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/[0.05]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-medium uppercase text-slate-500">Notes</span>
              <textarea
                value={newTaskNotes}
                onChange={(event) => setNewTaskNotes(event.target.value)}
                placeholder="Optional details..."
                rows={3}
                className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/50 focus:bg-white/[0.05]"
              />
            </label>

            <button
              type="button"
              onClick={handleInsert}
              className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400 hover:shadow-indigo-500/40 active:scale-[0.98]"
            >
              Insert Task
            </button>
          </div>
        </section>

        <section className={`glass rounded-[2rem] p-6 shadow-2xl transition-all duration-500 ${editingTask ? 'ring-2 ring-violet-500/30' : ''}`}>
          <div className="space-y-4">
            <p
              style={{ fontFamily: "var(--font-mono)" }}
              className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-400"
            >
              Edit Flow
            </p>
            <h3 className="text-xl font-bold text-white">
              {editingTask ? `Modify ${editingTask.label}` : "Editor Panel"}
            </h3>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-[10px] font-medium uppercase text-slate-500">Task Title</span>
              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder="Select a task to edit"
                disabled={!editingTask}
                className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition disabled:opacity-30 focus:border-emerald-500/50 focus:bg-white/[0.05]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] font-medium uppercase text-slate-500">Details</span>
              <textarea
                value={editDetails}
                onChange={(event) => setEditDetails(event.target.value)}
                placeholder="Task details appear here"
                rows={4}
                disabled={!editingTask}
                className="w-full rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition disabled:opacity-30 focus:border-emerald-500/50 focus:bg-white/[0.05]"
              />
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editingTask}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all enabled:hover:bg-emerald-400 disabled:opacity-30"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={!editingTask}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all enabled:hover:bg-white/10 disabled:opacity-30"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      </aside>

      <div className="space-y-6">
        <section className="glass rounded-[1.5rem] p-4 shadow-xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search anything..."
                className="w-full rounded-full border border-white/5 bg-white/[0.02] py-2.5 pl-11 pr-4 text-sm text-white outline-none transition focus:border-indigo-500/50 focus:bg-white/[0.05]"
              />
            </div>
            <div className="flex gap-1.5 rounded-full border border-white/5 bg-white/[0.02] p-1">
              {(["all", "pending", "done", "exam"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatusFilter(item)}
                  className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    statusFilter === item
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        {filteredMonths.length === 0 ? (
          <section className="glass flex h-64 flex-col items-center justify-center rounded-[2rem] border-dashed border-white/10 text-slate-400">
            <p className="text-lg font-medium">No results found</p>
            <p className="mt-1 text-sm text-slate-500 text-center px-6">Try adjusting your filters or search query.</p>
          </section>
        ) : null}

        <div className="space-y-8">
          {filteredMonths.map((month) => {
            const isMonthExpanded = expandedMonths.has(month.key);
            const monthPercent = getCompletionPercent(month.completed, month.total);

            return (
              <article key={month.key} className="group flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => toggleMonth(month.key)}
                  className="glass group/btn flex w-full flex-wrap items-center justify-between gap-4 rounded-[1.5rem] p-5 text-left transition-all hover:border-indigo-500/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 transition-colors group-hover/btn:bg-indigo-500 group-hover/btn:text-white">
                      <span className="text-lg font-bold">{month.title.split(' ')[1]}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/70">Month Roadmap</p>
                      <h3 className="text-xl font-bold text-white group-hover/btn:translate-x-1 transition-transform">{month.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{month.completed} / {month.total}</p>
                      <p className="text-[10px] font-medium uppercase text-slate-500">{monthPercent}% Done</p>
                    </div>
                    <div className="h-10 w-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="w-full bg-gradient-to-b from-violet-500 via-indigo-500 to-emerald-500 transition-all duration-700" style={{ height: `${monthPercent}%` }} />
                    </div>
                  </div>
                </button>

                {isMonthExpanded && (
                  <div className="grid gap-4 pl-4 sm:pl-8 border-l-2 border-white/5 ml-6">
                    {month.weeks.map((week) => {
                      const isWeekExpanded = expandedWeeks.has(week.key);
                      const weekPercent = getCompletionPercent(week.completed, week.total);

                      return (
                        <section key={week.key} className="space-y-4">
                          <button
                            type="button"
                            onClick={() => toggleWeek(week.key)}
                            className="glass group/week flex w-full items-center justify-between rounded-2xl bg-white/[0.02] px-4 py-3 text-left transition-all hover:bg-white/[0.04]"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`h-2 w-2 rounded-full ${weekPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                              <h4 className="text-sm font-bold text-slate-200 group-hover/week:text-white">{week.title}</h4>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{weekPercent}% Complete</span>
                          </button>

                          {isWeekExpanded && (
                            <div className="grid gap-3">
                              {week.tasks.map((task: GroupedTask) => (
                                <article
                                  key={task.id}
                                  className={`glass relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                                    editingTaskId === task.id ? "ring-2 ring-violet-500/50" : ""
                                  }`}
                                >
                                  <div 
                                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                                      task.done 
                                        ? "bg-emerald-500" 
                                        : task.kind === "exam" 
                                          ? "bg-indigo-500" 
                                          : "bg-violet-500"
                                    }`} 
                                  />
                                  
                                  <div className="flex items-start gap-4">
                                    <button
                                      type="button"
                                      onClick={() => toggleTask(task.id)}
                                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                                        task.done
                                          ? "border-emerald-500 bg-emerald-500 text-white"
                                          : "border-white/10 bg-white/5 text-transparent hover:border-white/30"
                                      }`}
                                    >
                                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    </button>

                                    <div className="min-w-0 flex-1 space-y-3">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex gap-2">
                                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 border border-white/5">
                                            {task.label}
                                          </span>
                                          <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border ${
                                            task.done 
                                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                              : task.kind === "exam"
                                                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                                : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                          }`}>
                                            {task.done ? "Completed" : task.kind === "exam" ? "Exam" : "Pending"}
                                          </span>
                                        </div>
                                        {task.kind === "day" && (
                                          <button
                                            type="button"
                                            onClick={() => startEditing(task)}
                                            className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors"
                                          >
                                            Edit
                                          </button>
                                        )}
                                      </div>

                                      <div>
                                        <h5 className={`text-base font-bold text-white transition-all ${task.done ? "opacity-30 line-through" : ""}`}>
                                          {task.topic}
                                        </h5>
                                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                                          {task.month} • {task.week}
                                        </p>
                                      </div>

                                      <div className="space-y-1.5">
                                        {task.details.slice(0, 3).map((detail, i) => (
                                          <div key={i} className="flex gap-2 text-sm leading-relaxed text-slate-400">
                                            <span className="text-slate-600">•</span>
                                            <p>{detail}</p>
                                          </div>
                                        ))}
                                        {task.details.length > 3 && (
                                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 pl-4">
                                            + {task.details.length - 3} more lines
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </article>
                              ))}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
