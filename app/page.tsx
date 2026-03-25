import { TaskListBoard } from "@/components/task-list-board";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-4xl border border-white/10 bg-white/6 p-6 shadow-[0_30px_120px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:p-8">
          <span
            style={{ fontFamily: "var(--font-mono)" }}
            className="inline-flex rounded-full border border-amber-300/30 bg-amber-200/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-amber-100"
          >
            Home Page
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Task List
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            এই page-এ শুধু roadmap task list আর task insert controls রাখা হয়েছে.
          </p>
        </section>
        <TaskListBoard />
      </div>
    </main>
  );
}
