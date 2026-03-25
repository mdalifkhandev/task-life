"use client";

import { getCompletionPercent, useTaskPlan } from "@/lib/task-plan";

export function ArraysTopicBoard() {
  const { groupedTasks, toggleTask } = useTaskPlan();
  const arraysTasks = groupedTasks.filter((task) => task.topic === "Striver Arrays Topic");
  const completedCount = arraysTasks.filter((task) => task.done).length;
  const months = Array.from(new Set(arraysTasks.map((task) => task.month)));

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
          <p className="text-sm text-slate-300">Arrays tasks</p>
          <p className="mt-2 text-3xl font-semibold text-white">{arraysTasks.length}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
          <p className="text-sm text-slate-300">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-white">{completedCount}</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
          <p className="text-sm text-slate-300">Completion rate</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {getCompletionPercent(completedCount, arraysTasks.length)}%
          </p>
        </article>
      </div>

      <div className="rounded-4xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl">
        <h2 className="text-2xl font-semibold text-white">Striver Arrays Topic</h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          এই page-এ শুধু `Striver Arrays Topic`-এর tasks দেখা যাবে। Month-wise split আছে,
          আর এখান থেকেও done mark করা যাবে.
        </p>
        <p className="mt-3 text-sm text-slate-400">Covers: {months.join(", ")}</p>
      </div>

      <div className="space-y-4">
        {months.map((month) => {
          const monthTasks = arraysTasks.filter((task) => task.month === month);

          return (
            <section
              key={month}
              className="rounded-4xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl"
            >
              <h3 className="text-xl font-semibold text-white">{month}</h3>
              <div className="mt-4 space-y-3">
                {monthTasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-3xl border border-white/10 bg-slate-950/35 p-4"
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
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                            {task.label}
                          </span>
                          <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-100">
                            {task.week}
                          </span>
                        </div>
                        <h4
                          className={`text-lg font-medium text-white ${
                            task.done ? "line-through opacity-60" : ""
                          }`}
                        >
                          {task.topic}
                        </h4>
                        <div className="space-y-1 text-sm leading-6 text-slate-300">
                          {task.details.map((detail) => (
                            <p key={`${task.id}-${detail}`}>{detail}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
