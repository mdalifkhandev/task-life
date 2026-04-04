"use client";

import { getCompletionPercent, useTaskPlan } from "@/lib/task-plan";

export function MonthProgressBoard() {
  const { error, groupedPlan, isLoading } = useTaskPlan();
  const sortedMonths = [...groupedPlan].sort(
    (a, b) => getCompletionPercent(b.completed, b.total) - getCompletionPercent(a.completed, a.total)
  );
  const fastestMonth = sortedMonths[0];
  const laggingMonth = sortedMonths.at(-1);

  return (
    <section className="space-y-8">
      {error ? (
        <article className="glass rounded-2xl border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
          Server error: {error}
        </article>
      ) : null}
      
      <div className="grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
        <div className="grid gap-4">
          <article className="glass-shine relative overflow-hidden rounded-[2rem] border-emerald-500/20 bg-emerald-500/5 p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/70">Top Momentum</p>
            <h2 className="mt-3 text-2xl font-bold text-white">{fastestMonth?.title}</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold">
                {getCompletionPercent(fastestMonth?.completed ?? 0, fastestMonth?.total ?? 1)}%
              </div>
              <p className="text-sm text-slate-400">
                {isLoading ? "Syncing..." : `${fastestMonth?.completed}/${fastestMonth?.total} completed`}
              </p>
            </div>
          </article>
          
          <article className="glass-shine relative overflow-hidden rounded-[2rem] border-violet-500/20 bg-violet-500/5 p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400/70">Needs Focus</p>
            <h2 className="mt-3 text-2xl font-bold text-white">{laggingMonth?.title}</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 font-bold">
                {getCompletionPercent(laggingMonth?.completed ?? 0, laggingMonth?.total ?? 1)}%
              </div>
              <p className="text-sm text-slate-400">
                {laggingMonth?.completed}/{laggingMonth?.total} completed
              </p>
            </div>
          </article>
        </div>

        <section className="glass flex flex-col justify-center rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Roadmap Analytics
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-400">
              Track which month is moving fast and which one is lagging. 
              The Vesper dashboard provides ranking sense to help you identify 
              where momentum is strong and where catch-up is needed.
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-4">
        {groupedPlan.map((month, index) => {
          const percent = getCompletionPercent(month.completed, month.total);

          return (
            <article
              key={month.key}
              className="glass group relative overflow-hidden rounded-[1.5rem] p-6 transition-all duration-300 hover:bg-white/[0.05]"
            >
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-sm font-bold text-slate-400 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
                    #{index + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:translate-x-1 transition-transform">{month.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {month.completed} / {month.total} roadmap entries completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{percent}%</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Completion</p>
                  </div>
                  <div className="h-14 w-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div 
                      className="w-full bg-gradient-to-b from-violet-500 via-indigo-500 to-emerald-500 transition-all duration-1000" 
                      style={{ height: `${percent}%` }} 
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
