"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Task List" },
  { href: "/arrays", label: "Arrays Focus" },
  { href: "/progress", label: "Month Progress" }
] as const;

type TopNavProps = {
  user: {
    email: string;
    id: string;
    name: string;
  } | null;
};

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (pathname === "/login") {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-6 z-50 mx-auto w-full max-w-5xl px-4 sm:px-0">
      <div className="glass flex items-center justify-between gap-4 rounded-[2rem] px-6 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            T
          </div>
          <div className="hidden md:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/80">Premium</p>
            <h1 className="text-sm font-bold tracking-tight text-white">Task Life</h1>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-2xl bg-slate-950/40 p-1 border border-white/5">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right lg:block">
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[10px] font-medium text-slate-500">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="shimmer-button flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-indigo-500/20 hover:text-white"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
