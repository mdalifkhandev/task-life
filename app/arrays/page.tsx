import { ArraysTopicBoard } from "@/components/arrays-topic-board";

export default function ArraysPage() {
  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(8,47,73,0.72),rgba(15,23,42,0.9))] p-6 shadow-[0_35px_100px_rgba(8,47,73,0.25)] backdrop-blur-xl lg:p-8">
          <span
            style={{ fontFamily: "var(--font-mono)" }}
            className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-cyan-100"
          >
            Focus Page
          </span>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Striver Arrays Topic, redesigned as a focused practice lane.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            Arrays-related tasks-গুলো এখানে cleaner grouping আর better completion visibility নিয়ে রাখা হয়েছে.
          </p>
        </section>
        <ArraysTopicBoard />
      </div>
    </main>
  );
}
