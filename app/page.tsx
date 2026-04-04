import { TaskListBoard } from "@/components/task-list-board";
import { requireAuthenticatedPageUser } from "@/lib/server/auth-service";

export default async function Home() {
  await requireAuthenticatedPageUser();

  return (
    <main className="min-h-screen px-4 py-12 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12">
        <section className="relative flex flex-col items-center justify-center py-16 text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
            <div className="h-96 w-96 rounded-full bg-indigo-500/20 blur-[120px]" />
            <div className="h-64 w-64 translate-x-24 rounded-full bg-violet-500/20 blur-[100px]" />
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <span
              style={{ fontFamily: "var(--font-mono)" }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-indigo-300"
            >
              <span className="h-1 w-1 animate-pulse rounded-full bg-indigo-400" />
              Core Workspace
            </span>
            <h1 className="mt-8 max-w-4xl bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
              Modern Task Flow <br /> 
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text">for High Performers.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
              Experience a streamlined roadmap with cleaner hierarchy, <br className="hidden sm:block" /> 
              instant controls, and a premium glassmorphic interface.
            </p>
          </div>
        </section>
        
        <TaskListBoard />
      </div>
    </main>
  );
}
