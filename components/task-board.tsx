"use client";

import dsaPlanTasks from "@/data/dsa-plan.json";
import { useMemo, useState, useSyncExternalStore } from "react";

type Task = {
  id: string;
  title: string;
  notes: string;
  done: boolean;
};

type GroupedTask = Task & {
  details: string[];
  kind: "day" | "exam";
  label: string;
  month: string;
  topic: string;
  week: string;
};

type WeekGroup = {
  completed: number;
  key: string;
  tasks: GroupedTask[];
  title: string;
  total: number;
};

type MonthGroup = {
  completed: number;
  key: string;
  title: string;
  total: number;
  weeks: WeekGroup[];
};

const STORAGE_KEY = "task-flow-board-dsa-plan-v3";
const INSERT_AT_END = "__insert_at_end__";
const listeners = new Set<() => void>();
const defaultTasks: Task[] = dsaPlanTasks;

let cachedTasks: Task[] = defaultTasks;
let hasCachedTasks = false;

const buildNotes = (month: string, week: string, details: string[]) =>
  [month, week, ...details].filter(Boolean).join("\n");

const mergeStoredTasks = (storedTasks: Task[]) => {
  if (!Array.isArray(storedTasks) || storedTasks.length === 0) {
    return defaultTasks;
  }

  return storedTasks;
};

const parseStoredTasks = (storedTasks: string | null): Task[] => {
  if (!storedTasks) {
    return defaultTasks;
  }

  try {
    const parsed = JSON.parse(storedTasks) as Task[];
    return mergeStoredTasks(parsed);
  } catch {
    return defaultTasks;
  }
};

const readStoredTasks = (): Task[] => {
  if (typeof window === "undefined") {
    return defaultTasks;
  }

  if (hasCachedTasks) {
    return cachedTasks;
  }

  const storedTasks = window.localStorage.getItem(STORAGE_KEY);
  cachedTasks = parseStoredTasks(storedTasks);
  hasCachedTasks = true;
  return cachedTasks;
};

const writeStoredTasks = (updater: (tasks: Task[]) => Task[]) => {
  const nextTasks = updater(readStoredTasks());
  cachedTasks = nextTasks;
  hasCachedTasks = true;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
  listeners.forEach((listener) => listener());
};

const subscribeToTasks = (listener: () => void) => {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cachedTasks = parseStoredTasks(event.newValue);
      hasCachedTasks = true;
      listener();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

const toGroupedTask = (task: Task): GroupedTask => {
  const [month = "Month", week = "Week", ...details] = task.notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const isExam = task.id.startsWith("exam-") || task.title.includes("Weekly Exam");

  if (isExam) {
    return {
      ...task,
      details,
      kind: "exam",
      label: "Weekly Exam",
      month,
      topic: details[0] ?? task.title,
      week
    };
  }

  const titleMatch = task.title.match(/^Day\s+(\d+)\s+-\s+(.*)$/);

  return {
    ...task,
    details,
    kind: "day",
    label: titleMatch ? `Day ${titleMatch[1]}` : task.title,
    month,
    topic: titleMatch?.[2] ?? task.title,
    week
  };
};

const renumberDayTasks = (tasks: Task[]) => {
  let dayCounter = 0;

  return tasks.map((task) => {
    const groupedTask = toGroupedTask(task);

    if (groupedTask.kind === "exam") {
      return {
        ...task,
        notes: buildNotes(groupedTask.month, groupedTask.week, groupedTask.details),
        title: `${groupedTask.week} - Weekly Exam`
      };
    }

    dayCounter += 1;

    return {
      ...task,
      id: `day-${dayCounter}`,
      notes: buildNotes(groupedTask.month, groupedTask.week, groupedTask.details),
      title: `Day ${dayCounter} - ${groupedTask.topic}`
    };
  });
};

const buildPlanGroups = (tasks: Task[]): MonthGroup[] => {
  const monthMap = new Map<string, MonthGroup>();
  const weekMap = new Map<string, WeekGroup>();

  tasks.map(toGroupedTask).forEach((task) => {
    let monthGroup = monthMap.get(task.month);

    if (!monthGroup) {
      monthGroup = {
        completed: 0,
        key: task.month,
        title: task.month,
        total: 0,
        weeks: []
      };
      monthMap.set(task.month, monthGroup);
    }

    const weekKey = `${task.month}::${task.week}`;
    let weekGroup = weekMap.get(weekKey);

    if (!weekGroup) {
      weekGroup = {
        completed: 0,
        key: weekKey,
        tasks: [],
        title: task.week,
        total: 0
      };
      weekMap.set(weekKey, weekGroup);
      monthGroup.weeks.push(weekGroup);
    }

    weekGroup.tasks.push(task);
    weekGroup.total += 1;
    monthGroup.total += 1;

    if (task.done) {
      weekGroup.completed += 1;
      monthGroup.completed += 1;
    }
  });

  return Array.from(monthMap.values());
};

const findInsertionIndex = (
  tasks: Task[],
  week: WeekGroup | undefined,
  beforeTaskId: string
) => {
  if (!week) {
    return tasks.length;
  }

  if (beforeTaskId !== INSERT_AT_END) {
    const explicitIndex = tasks.findIndex((task) => task.id === beforeTaskId);
    return explicitIndex >= 0 ? explicitIndex : tasks.length;
  }

  const firstExam = week.tasks.find((task) => task.kind === "exam");

  if (firstExam) {
    const examIndex = tasks.findIndex((task) => task.id === firstExam.id);
    return examIndex >= 0 ? examIndex : tasks.length;
  }

  const lastWeekTask = week.tasks.at(-1);

  if (!lastWeekTask) {
    return tasks.length;
  }

  const lastWeekTaskIndex = tasks.findIndex((task) => task.id === lastWeekTask.id);
  return lastWeekTaskIndex >= 0 ? lastWeekTaskIndex + 1 : tasks.length;
};

const getCompletionPercent = (completed: number, total: number) =>
  total === 0 ? 0 : Math.round((completed / total) * 100);

export function TaskBoard() {
  const tasks = useSyncExternalStore(
    subscribeToTasks,
    readStoredTasks,
    () => defaultTasks
  );
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
  const [focusedTaskId, setFocusedTaskId] = useState("");

  const groupedPlan = useMemo(() => buildPlanGroups(tasks), [tasks]);
  const groupedTasks = useMemo(() => tasks.map(toGroupedTask), [tasks]);
  const completedCount = tasks.filter((task) => task.done).length;
  const totalDayCount = groupedTasks.filter((task) => task.kind === "day").length;
  const completedDayCount = groupedTasks.filter(
    (task) => task.kind === "day" && task.done
  ).length;
  const completedExamCount = groupedTasks.filter(
    (task) => task.kind === "exam" && task.done
  ).length;
  const nextPendingTask = groupedTasks.find(
    (task) => task.kind === "day" && !task.done
  );
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

  const jumpToTask = (task: GroupedTask) => {
    const weekKey = `${task.month}::${task.week}`;

    setExpandedMonths((current) => new Set(current).add(task.month));
    setExpandedWeeks((current) => new Set(current).add(weekKey));
    setFocusedTaskId(task.id);

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document.getElementById(task.id)?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });
    }
  };

  const toggleTask = (taskId: string) => {
    if (focusedTaskId === taskId) {
      setFocusedTaskId("");
    }

    writeStoredTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task
      )
    );
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

  const insertTask = () => {
    const trimmedTitle = newTaskTitle.trim();
    const trimmedNotes = newTaskNotes.trim();

    if (!trimmedTitle || !activeMonth || !activeWeek) {
      return;
    }

    const customTask: Task = {
      done: false,
      id: "custom-pending",
      notes: buildNotes(activeMonth.title, activeWeek.title, [
        `Focus: ${trimmedTitle}`,
        ...(trimmedNotes ? [`Note: ${trimmedNotes}`] : [])
      ]),
      title: trimmedTitle
    };

    writeStoredTasks((currentTasks) => {
      const currentPlan = buildPlanGroups(currentTasks);
      const month = currentPlan.find((item) => item.key === activeMonth.key);
      const week = month?.weeks.find((item) => item.key === activeWeek.key);
      const insertionIndex = findInsertionIndex(
        currentTasks,
        week,
        safeInsertBeforeTaskId
      );
      const nextTasks = [...currentTasks];

      nextTasks.splice(insertionIndex, 0, customTask);
      return renumberDayTasks(nextTasks);
    });

    setExpandedMonths((current) => new Set(current).add(activeMonth.key));
    setExpandedWeeks((current) => new Set(current).add(activeWeek.key));
    setNewTaskTitle("");
    setNewTaskNotes("");
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
      <aside className="space-y-6">
        <section className="rounded-4xl border border-white/10 bg-slate-950/45 p-6 shadow-[0_25px_80px_rgba(8,15,31,0.35)] backdrop-blur-xl">
          <div className="space-y-4">
            <p
              style={{ fontFamily: "var(--font-mono)" }}
              className="text-xs uppercase tracking-[0.35em] text-amber-100/80"
            >
              Smart Resume
            </p>
            <h2 className="text-3xl font-semibold text-white">
              Resume from the next unfinished day instead of scanning the roadmap.
            </h2>
            <p className="text-sm leading-7 text-slate-300">
              Dashboard-এ overall progress, month-wise completion, আর next pending
              task shortcut আছে. চাইলে এক click-এ ওই জায়গায় jump করতে পারবে.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-emerald-300/15 bg-emerald-300/8 p-4">
              <p
                style={{ fontFamily: "var(--font-mono)" }}
                className="text-[11px] uppercase tracking-[0.3em] text-emerald-100/70"
              >
                Total Progress
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {getCompletionPercent(completedCount, tasks.length)}%
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {completedCount}/{tasks.length} roadmap entries done
              </p>
            </article>
            <article className="rounded-3xl border border-cyan-300/15 bg-cyan-300/8 p-4">
              <p
                style={{ fontFamily: "var(--font-mono)" }}
                className="text-[11px] uppercase tracking-[0.3em] text-cyan-100/70"
              >
                Day Completion
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {completedDayCount}/{totalDayCount}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Weekly exams completed: {completedExamCount}
              </p>
            </article>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-[11px] uppercase tracking-[0.3em] text-amber-100/70"
                >
                  Next Up
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {nextPendingTask ? nextPendingTask.topic : "All roadmap days completed"}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {nextPendingTask
                    ? `${nextPendingTask.label} • ${nextPendingTask.month} • ${nextPendingTask.week}`
                    : "You have finished every day task in the plan."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (nextPendingTask) {
                    jumpToTask(nextPendingTask);
                  }
                }}
                disabled={!nextPendingTask}
                className="rounded-full bg-amber-300 px-4 py-2 text-sm font-medium text-slate-950 transition enabled:hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
              >
                Jump now
              </button>
            </div>
            {nextPendingTask?.details.length ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm leading-6 text-slate-300">
                {nextPendingTask.details.slice(0, 2).map((detail) => (
                  <p key={detail}>{detail}</p>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-4xl border border-white/10 bg-slate-950/45 p-6 shadow-[0_25px_80px_rgba(8,15,31,0.35)] backdrop-blur-xl">
          <div className="space-y-4">
            <p
              style={{ fontFamily: "var(--font-mono)" }}
              className="text-xs uppercase tracking-[0.35em] text-cyan-100/80"
            >
              Month Progress
            </p>
            <h3 className="text-2xl font-semibold text-white">
              Track which month is moving fast and which one is lagging.
            </h3>
          </div>

          <div className="mt-6 space-y-4">
            {groupedPlan.map((month) => {
              const percent = getCompletionPercent(month.completed, month.total);

              return (
                <article key={month.key} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-medium text-white">{month.title}</p>
                      <p className="text-sm text-slate-400">
                        {month.completed}/{month.total} entries done
                      </p>
                    </div>
                    <span className="text-sm font-medium text-amber-100">{percent}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-amber-300 via-cyan-300 to-emerald-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-4xl border border-white/10 bg-slate-950/45 p-6 shadow-[0_25px_80px_rgba(8,15,31,0.35)] backdrop-blur-xl">
          <div className="space-y-4">
            <p
              style={{ fontFamily: "var(--font-mono)" }}
              className="text-xs uppercase tracking-[0.35em] text-amber-100/80"
            >
              Add New Task
            </p>
            <h3 className="text-3xl font-semibold text-white">
              Choose a month, choose a week, then insert before any day.
            </h3>
            <p className="text-sm leading-7 text-slate-300">
              নতুন task add করলে ওই জায়গা থেকে পরের সব day serial auto update হবে.
              যেমন Day 30-এর আগে insert করলে নতুনটা Day 30 হবে, আর আগের Day 30
              হবে Day 31.
            </p>
          </div>

          <div className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
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
              onClick={insertTask}
              className="w-full rounded-full bg-amber-300 px-5 py-3 font-medium text-slate-950 transition hover:bg-amber-200"
            >
              Add task and renumber days
            </button>
          </div>
        </section>
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
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-sm text-slate-300">
                      {month.completed}/{month.total} done
                    </p>
                  </div>
                  <span className="text-2xl text-slate-300">
                    {isMonthExpanded ? "−" : "+"}
                  </span>
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
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2 text-right">
                              <p className="text-sm text-slate-300">
                                {week.completed}/{week.total} done
                              </p>
                              <p className="text-xs text-slate-500">{weekPercent}% complete</p>
                            </div>
                            <span className="text-xl text-slate-300">
                              {isWeekExpanded ? "−" : "+"}
                            </span>
                          </div>
                        </button>

                        {isWeekExpanded ? (
                          <div className="mt-4 space-y-3">
                            {week.tasks.map((task) => (
                              <article
                                key={task.id}
                                id={task.id}
                                className={`rounded-[1.7rem] border p-4 transition ${
                                  focusedTaskId === task.id
                                    ? "border-amber-300/55 bg-amber-300/8 shadow-[0_0_0_1px_rgba(252,211,77,0.18)]"
                                    : "border-white/10 bg-white/5"
                                }`}
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
                                      {focusedTaskId === task.id ? (
                                        <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs text-amber-100">
                                          Resume point
                                        </span>
                                      ) : null}
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
