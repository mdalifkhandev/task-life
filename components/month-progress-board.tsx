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
    <section className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[0.4fr_0.6fr]">
        <div className="grid gap-4">
          <article className="rounded-[1.7rem] border border-emerald-300/20 bg-emerald-300/10 p-5 backdrop-blur-xl">
            <p className="text-sm text-slate-200">Fastest month</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{fastestMonth?.title}</h2>
            <p className="mt-2 text-sm text-slate-300">
              {fastestMonth?.completed}/{fastestMonth?.total} done • {getCompletionPercent(
                fastestMonth?.completed ?? 0,
                fastestMonth?.total ?? 0
              )}% complete
            </p>
          </article>
          <article className="rounded-[1.7rem] border border-amber-300/20 bg-amber-300/10 p-5 backdrop-blur-xl">
            <p className="text-sm text-slate-200">Needs attention</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{laggingMonth?.title}</h2>
            <p className="mt-2 text-sm text-slate-300">
              {laggingMonth?.completed}/{laggingMonth?.total} done • {getCompletionPercent(
                laggingMonth?.completed ?? 0,
                laggingMonth?.total ?? 0
              )}% complete
            </p>
          </article>
        </div>

        <section className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(145deg,rgba(6,78,59,0.72),rgba(15,23,42,0.88))] p-5 shadow-[0_30px_90px_rgba(6,78,59,0.25)] backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-white">
            Track which month is moving fast and which one is lagging.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            এটা এখন শুধু progress bar list না। ranking sense-ও দিচ্ছে, যাতে তুমি
            immediately বুঝতে পারো কোন month-এ momentum strong আর কোন month-এ
            catch-up দরকার.
          </p>
        </section>
      </div>

      <div className="space-y-3">
        {groupedPlan.map((month, index) => {
          const percent = getCompletionPercent(month.completed, month.total);

          return (
            <article
              key={month.key}
              className="rounded-[1.7rem] border border-white/10 bg-white/6 p-4 shadow-[0_25px_80px_rgba(8,15,31,0.25)] backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-slate-200">
                    #{index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{month.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {month.completed}/{month.total} roadmap entries done
                    </p>
                  </div>
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
