"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Task List", tone: "amber" },
  { href: "/arrays", label: "Arrays Focus", tone: "cyan" },
  { href: "/progress", label: "Month Progress", tone: "emerald" }
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
      await fetch("/api/auth/logout", {
        method: "POST"
      });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="mb-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.82))] p-4 shadow-[0_25px_80px_rgba(2,6,23,0.4)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Task Life</p>
          <h1 className="mt-2 text-xl font-semibold text-white">DSA Roadmap Workspace</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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

          {user ? (
            <>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isLoggingOut ? "Signing out..." : "Logout"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
