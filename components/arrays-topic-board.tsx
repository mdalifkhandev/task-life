"use client";

import { getCompletionPercent, useTaskPlan } from "@/lib/task-plan";

export function ArraysTopicBoard() {
  const { error, groupedTasks, isLoading, toggleTask } = useTaskPlan();
  const arraysTasks = groupedTasks.filter((task) => task.topic === "Striver Arrays Topic");
  const completedCount = arraysTasks.filter((task) => task.done).length;
  const months = Array.from(new Set(arraysTasks.map((task) => task.month)));

  return (
    <section className="space-y-5">
      {error ? (
        <article className="rounded-[1.4rem] border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100 backdrop-blur-xl">
          Server error: {error}
        </article>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[0.3fr_0.7fr]">
        <aside className="space-y-4">
          <article className="rounded-[1.6rem] border border-cyan-300/20 bg-cyan-300/10 p-5 backdrop-blur-xl">
            <p className="text-sm text-slate-200">Arrays completion</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {getCompletionPercent(completedCount, arraysTasks.length)}%
            </p>
            <p className="mt-2 text-sm text-slate-300">
              {isLoading
                ? "Syncing arrays lane..."
                : `${completedCount}/${arraysTasks.length} arrays tasks done`}
            </p>
          </article>
          <article className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
            <p className="text-sm text-slate-300">Coverage months</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {months.map((month) => (
                <span
                  key={month}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-cyan-100"
                >
                  {month}
                </span>
              ))}
            </div>
          </article>
        </aside>

        <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(145deg,rgba(8,47,73,0.72),rgba(15,23,42,0.9))] p-5 shadow-[0_30px_90px_rgba(8,47,73,0.25)] backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-white">Striver Arrays Topic</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Arrays focus page-টা intentionally cleaner রাখা হয়েছে। এখানে শুধু arrays-related
            tasks আছে, so practice streak maintain করা easier হবে.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {months.map((month) => {
          const monthTasks = arraysTasks.filter((task) => task.month === month);

          return (
            <section
              key={month}
              className="rounded-[1.7rem] border border-white/10 bg-white/6 p-4 shadow-[0_25px_80px_rgba(8,15,31,0.25)] backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-white">{month}</h3>
                <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs text-cyan-100">
                  {monthTasks.filter((task) => task.done).length}/{monthTasks.length} done
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {monthTasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-[1.3rem] border border-white/10 bg-slate-950/35 p-3"
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
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                            {task.label}
                          </span>
                          <span className="rounded-full bg-cyan-300/15 px-2.5 py-1 text-[11px] text-cyan-100">
                            {task.week}
                          </span>
                        </div>
                        <h4
                          className={`text-base font-medium text-white ${
                            task.done ? "line-through opacity-60" : ""
                          }`}
                        >
                          {task.topic}
                        </h4>
                        <div className="space-y-1 text-sm leading-5 text-slate-300">
                          {task.details.slice(0, 2).map((detail) => (
                            <p key={`${task.id}-${detail}`}>{detail}</p>
                          ))}
                          {task.details.length > 2 ? (
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                              +{task.details.length - 2} more lines
                            </p>
                          ) : null}
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
