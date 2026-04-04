"use client";

import { getCompletionPercent, useTaskPlan } from "@/lib/task-plan";

export function ArraysTopicBoard() {
  const { error, groupedTasks, isLoading, toggleTask } = useTaskPlan();
  const arraysTasks = groupedTasks.filter((task) => task.topic === "Striver Arrays Topic");
  const completedCount = arraysTasks.filter((task) => task.done).length;
  const months = Array.from(new Set(arraysTasks.map((task) => task.month)));

  return (
    <section className="space-y-8">
      {error ? (
        <article className="glass rounded-2xl border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
          Server error: {error}
        </article>
      ) : null}
      
      <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
        <aside className="space-y-6">
          <article className="glass-shine relative overflow-hidden rounded-[2rem] border-indigo-500/20 bg-indigo-500/5 p-6 shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/70">Focus Topic</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Arrays Lane</h2>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl font-bold text-indigo-400">
                {getCompletionPercent(completedCount, arraysTasks.length)}%
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {completedCount} <span className="text-slate-500">/ {arraysTasks.length}</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Tasks Completed</p>
              </div>
            </div>
          </article>
          
          <article className="glass rounded-[2rem] p-6 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Coverage</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {months.map((month) => (
                <span
                  key={month}
                  className="rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-300"
                >
                  {month}
                </span>
              ))}
            </div>
          </article>
        </aside>

        <section className="glass flex flex-col justify-center rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white">Striver Arrays Roadmap</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-400">
              The Arrays focus page is intentionally cleaner to help you maintain deep focus. 
              Track your practice streak and master fundamental patterns with the Vesper experience.
            </p>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        {months.map((month) => {
          const monthTasks = arraysTasks.filter((task) => task.month === month);
          const monthPercent = getCompletionPercent(monthTasks.filter(t => t.done).length, monthTasks.length);

          return (
            <section key={month} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold text-white">{month}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{monthPercent}% Complete</span>
                  <div className="h-1.5 w-32 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-indigo-500 transition-all duration-1000" style={{ width: `${monthPercent}%` }} />
                  </div>
                </div>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {monthTasks.map((task) => (
                  <article
                    key={task.id}
                    className="glass group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05]"
                  >
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
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 border border-white/5">
                            {task.label}
                          </span>
                          <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/20">
                            {task.week}
                          </span>
                        </div>
                        
                        <h4 className={`text-base font-bold text-white transition-all ${task.done ? "opacity-30 line-through" : ""}`}>
                          {task.topic}
                        </h4>
                        
                        <div className="mt-3 space-y-1.5">
                          {task.details.slice(0, 2).map((detail, i) => (
                            <div key={i} className="flex gap-2 text-sm leading-relaxed text-slate-400">
                              <span className="text-slate-600">•</span>
                              <p>{detail}</p>
                            </div>
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
