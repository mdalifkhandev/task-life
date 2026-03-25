import { MonthProgressBoard } from "@/components/month-progress-board";

export default function ProgressPage() {
  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-4xl border border-white/10 bg-white/6 p-6 shadow-[0_30px_120px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:p-8">
          <span
            style={{ fontFamily: "var(--font-mono)" }}
            className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-emerald-100"
          >
            Progress Page
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Track which month is moving fast and which one is lagging
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            Month-wise progress compare করার জন্য এটা dedicated page.
          </p>
        </section>
        <MonthProgressBoard />
      </div>
    </main>
  );
}
