"use client";

import { getCompletionPercent, useTaskPlan } from "@/lib/task-plan";

export function MonthProgressBoard() {
  const { groupedPlan } = useTaskPlan();
  const sortedMonths = [...groupedPlan].sort(
    (a, b) => getCompletionPercent(b.completed, b.total) - getCompletionPercent(a.completed, a.total)
  );
  const fastestMonth = sortedMonths[0];
  const laggingMonth = sortedMonths.at(-1);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-4xl border border-emerald-300/15 bg-emerald-300/8 p-6 backdrop-blur-xl">
          <p className="text-sm text-slate-300">Moving fast</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{fastestMonth?.title}</h2>
          <p className="mt-2 text-sm text-slate-300">
            {fastestMonth?.completed}/{fastestMonth?.total} done • {getCompletionPercent(
              fastestMonth?.completed ?? 0,
              fastestMonth?.total ?? 0
            )}% complete
          </p>
        </article>
        <article className="rounded-4xl border border-amber-300/15 bg-amber-300/8 p-6 backdrop-blur-xl">
          <p className="text-sm text-slate-300">Lagging behind</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{laggingMonth?.title}</h2>
          <p className="mt-2 text-sm text-slate-300">
            {laggingMonth?.completed}/{laggingMonth?.total} done • {getCompletionPercent(
              laggingMonth?.completed ?? 0,
              laggingMonth?.total ?? 0
            )}% complete
          </p>
        </article>
      </div>

      <section className="rounded-4xl border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl">
        <h2 className="text-2xl font-semibold text-white">
          Track which month is moving fast and which one is lagging.
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          প্রতিটা month-এর completion rate compare করা যাচ্ছে। এতে বুঝতে পারবে কোন
          section strong যাচ্ছে আর কোনটা বেশি attention চাচ্ছে.
        </p>
      </section>

      <div className="space-y-4">
        {groupedPlan.map((month) => {
          const percent = getCompletionPercent(month.completed, month.total);

          return (
            <article
              key={month.key}
              className="rounded-4xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{month.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {month.completed}/{month.total} roadmap entries done
                  </p>
                </div>
                <span className="rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-amber-100">
                  {percent}% complete
                </span>
              </div>
              <div className="mt-4 h-3 rounded-full bg-white/10">
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
  );
}
