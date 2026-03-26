"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Task List", tone: "amber" },
  { href: "/arrays", label: "Arrays Focus", tone: "cyan" },
  { href: "/progress", label: "Month Progress", tone: "emerald" }
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="mb-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.82))] p-4 shadow-[0_25px_80px_rgba(2,6,23,0.4)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Task Life</p>
          <h1 className="mt-2 text-xl font-semibold text-white">DSA Roadmap Workspace</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-3">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  isActive
                    ? "border-white/15 bg-white/12 text-white"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
