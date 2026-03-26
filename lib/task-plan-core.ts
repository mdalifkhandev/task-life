export type Task = {
  id: string;
  title: string;
  notes: string;
  done: boolean;
};

export type GroupedTask = Task & {
  details: string[];
  kind: "day" | "exam";
  label: string;
  month: string;
  topic: string;
  week: string;
};

export type WeekGroup = {
  completed: number;
  key: string;
  tasks: GroupedTask[];
  title: string;
  total: number;
};

export type MonthGroup = {
  completed: number;
  key: string;
  title: string;
  total: number;
  weeks: WeekGroup[];
};

export const INSERT_AT_END = "__insert_at_end__";

export const buildNotes = (month: string, week: string, details: string[]) =>
  [month, week, ...details].filter(Boolean).join("\n");

export const sanitizeDetailLines = (details: string) =>
  details
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export const toGroupedTask = (task: Task): GroupedTask => {
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

export const renumberDayTasks = (tasks: Task[]) => {
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

export const buildPlanGroups = (tasks: Task[]): MonthGroup[] => {
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

export const findInsertionIndex = (
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

export const getCompletionPercent = (completed: number, total: number) =>
  total === 0 ? 0 : Math.round((completed / total) * 100);
