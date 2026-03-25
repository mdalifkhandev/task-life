"use client";

import {
  INSERT_AT_END,
  type GroupedTask,
  getCompletionPercent,
  useTaskPlan
} from "@/lib/task-plan";
import { useState } from "react";

export function TaskListBoard() {
  const { groupedPlan, insertTask, toggleTask, tasks } = useTaskPlan();
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
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
      <aside className="rounded-4xl border border-white/10 bg-slate-950/45 p-6 shadow-[0_25px_80px_rgba(8,15,31,0.35)] backdrop-blur-xl">
        <div className="space-y-4">
          <p
            style={{ fontFamily: "var(--font-mono)" }}
            className="text-xs uppercase tracking-[0.35em] text-amber-100/80"
          >
            Task List Controls
          </p>
          <h2 className="text-3xl font-semibold text-white">
            Home page keeps only the roadmap task list and task insert controls.
          </h2>
          <p className="text-sm leading-7 text-slate-300">
            Month, week, and day hierarchy এখানেই থাকবে. নতুন task add করলে পরের
            day serial auto update হবে.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-300">Total roadmap entries</p>
          <p className="mt-2 text-3xl font-semibold text-white">{tasks.length}</p>
        </div>

        <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
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
            Add task and renumber days
          </button>
        </div>
      </aside>

      <div className="space-y-4">
        {groupedPlan.map((month) => {
          const isMonthExpanded = expandedMonths.has(month.key);

          return (
            <article
              key={month.key}
              className="rounded-4xl border border-white/10 bg-white/6 p-5 shadow-[0_25px_80px_rgba(8,15,31,0.3)] backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={() => toggleMonth(month.key)}
                className="flex w-full flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/35 px-5 py-4 text-left transition hover:border-amber-300/30 hover:bg-slate-950/45"
              >
                <div>
                  <p
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="text-[11px] uppercase tracking-[0.3em] text-amber-100/70"
                  >
                    Month Section
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {month.title}
                  </h3>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                  <p className="text-sm text-slate-300">
                    {month.completed}/{month.total} done
                  </p>
                </div>
              </button>

              {isMonthExpanded ? (
                <div className="mt-4 space-y-3">
                  {month.weeks.map((week) => {
                    const isWeekExpanded = expandedWeeks.has(week.key);
                    const weekPercent = getCompletionPercent(week.completed, week.total);

                    return (
                      <section
                        key={week.key}
                        className="rounded-3xl border border-white/10 bg-slate-950/30 p-4"
                      >
                        <button
                          type="button"
                          onClick={() => toggleWeek(week.key)}
                          className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-cyan-300/30 hover:bg-white/8"
                        >
                          <div>
                            <p
                              style={{ fontFamily: "var(--font-mono)" }}
                              className="text-[11px] uppercase tracking-[0.3em] text-cyan-100/70"
                            >
                              Week Section
                            </p>
                            <h4 className="mt-2 text-xl font-semibold text-white">
                              {week.title}
                            </h4>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2 text-right">
                            <p className="text-sm text-slate-300">
                              {week.completed}/{week.total} done
                            </p>
                            <p className="text-xs text-slate-500">{weekPercent}% complete</p>
                          </div>
                        </button>

                        {isWeekExpanded ? (
                          <div className="mt-4 space-y-3">
                            {week.tasks.map((task: GroupedTask) => (
                              <article
                                key={task.id}
                                className="rounded-[1.7rem] border border-white/10 bg-white/5 p-4"
                              >
                                <div className="flex flex-wrap items-start gap-4">
                                  <button
                                    type="button"
                                    onClick={() => toggleTask(task.id)}
                                    className={`mt-1 h-6 w-6 rounded-full border transition ${
                                      task.done
                                        ? "border-emerald-300 bg-emerald-300 text-slate-950"
                                        : "border-white/20 bg-transparent text-transparent"
                                    }`}
                                    aria-label={`Mark ${task.title} as done`}
                                  >
                                    ✓
                                  </button>

                                  <div className="min-w-0 flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        style={{ fontFamily: "var(--font-mono)" }}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-300"
                                      >
                                        {task.label}
                                      </span>
                                      <span
                                        className={`rounded-full px-3 py-1 text-xs ${
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
                                    </div>

                                    <div>
                                      <h5
                                        className={`text-lg font-medium text-white ${
                                          task.done ? "line-through opacity-60" : ""
                                        }`}
                                      >
                                        {task.topic}
                                      </h5>
                                      <p className="mt-1 text-sm text-slate-400">
                                        {task.month} • {task.week}
                                      </p>
                                    </div>

                                    <div className="space-y-2 text-sm leading-6 text-slate-300">
                                      {task.details.map((detail) => (
                                        <p key={`${task.id}-${detail}`}>{detail}</p>
                                      ))}
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
