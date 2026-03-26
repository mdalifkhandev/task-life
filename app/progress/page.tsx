import { MonthProgressBoard } from "@/components/month-progress-board";
import { requireAuthenticatedPageUser } from "@/lib/server/auth-service";

export default async function ProgressPage() {
  await requireAuthenticatedPageUser();

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(6,78,59,0.72),rgba(15,23,42,0.88))] p-6 shadow-[0_35px_100px_rgba(6,78,59,0.25)] backdrop-blur-xl lg:p-8">
          <span
            style={{ fontFamily: "var(--font-mono)" }}
            className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-emerald-100"
          >
            Progress Page
          </span>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Month progress now feels more like a ranking dashboard than a plain list.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            Fastest এবং lagging month দুটোই upfront দেখাবে, তারপর ranked progress bars দিয়ে পুরো picture clear করবে.
          </p>
        </section>
        <MonthProgressBoard />
      </div>
    </main>
  );
}
