"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthMode = "login" | "register";

type AuthResponse = {
  error?: string;
};

const initialFields = {
  email: "",
  name: "",
  password: ""
};

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAuthForm = async () => {
    const endpoint =
      mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login"
        ? {
            email: fields.email,
            password: fields.password
          }
        : fields;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const result = (await response.json()) as AuthResponse;

      if (!response.ok) {
        throw new Error(result.error ?? "Authentication failed");
      }

      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Authentication failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-auth-float absolute -left-8 top-16 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />
        <div
          className="animate-auth-pulse absolute right-0 top-10 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl"
          style={{ animationDelay: "0.4s" }}
        />
        <div
          className="animate-auth-float absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-emerald-300/10 blur-3xl"
          style={{ animationDelay: "1.2s" }}
        />
      </div>

      <article className="animate-auth-rise relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(120,53,15,0.22),rgba(15,23,42,0.92))] p-8 shadow-[0_35px_100px_rgba(2,6,23,0.45)] backdrop-blur-xl">
        <div className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-amber-200/45 to-transparent" />
        <span
          style={{ fontFamily: "var(--font-mono)" }}
          className="inline-flex rounded-full border border-amber-300/25 bg-amber-200/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-amber-100"
        >
          Secure Access
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Sign in to open your task workspace.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
          Task Life এখন শুধু DSA tracker না. এটা global task management
          workspace. Personal planning, roadmap tracking, team-style flow, আর
          quick edits সবকিছুর জন্য secure login system রাখা হয়েছে. Account
          create করলে session cookie set হবে, তারপর login state দিয়েই workspace
          access চলবে.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <article className="animate-auth-rise rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-md">
            <p className="text-sm text-slate-300">Private Workspace</p>
            <p className="mt-2 text-lg font-semibold text-white">
              Tasks, progress, and focused work views stay protected.
            </p>
          </article>
          <article
            className="animate-auth-rise rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-md"
            style={{ animationDelay: "0.08s" }}
          >
            <p className="text-sm text-slate-300">Session Security</p>
            <p className="mt-2 text-lg font-semibold text-white">HTTP-only Cookie</p>
          </article>
          <article
            className="animate-auth-rise rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-md"
            style={{ animationDelay: "0.16s" }}
          >
            <p className="text-sm text-slate-300">Persistence</p>
            <p className="mt-2 text-lg font-semibold text-white">MongoDB Sessions</p>
          </article>
        </div>
      </article>

      <article className="animate-auth-rise-delayed relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(30,41,59,0.82))] p-6 shadow-[0_35px_100px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
        <div className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-cyan-200/45 to-transparent" />
        <div className="pointer-events-none absolute -right-10 top-14 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="flex rounded-full border border-white/10 bg-slate-950/45 p-1">
          {(["login", "register"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setError("");
              }}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === item
                  ? "bg-amber-300 text-slate-950"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {item === "login" ? "Login" : "Create Account"}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <h2 className="text-3xl font-semibold text-white">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {mode === "login"
                ? "Use your email and password to access your task dashboard."
                : "Create a new account to unlock your personal task workspace and secure session."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            {mode === "login"
              ? "Already registered? Sign in and continue where you left off."
              : "New here? Register once, then you can log in anytime from any browser."}
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {mode === "register" ? (
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Name</span>
              <input
                value={fields.name}
                onChange={(event) =>
                  setFields((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Your full name"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-amber-300/60"
              />
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Email</span>
            <input
              type="email"
              value={fields.email}
              onChange={(event) =>
                setFields((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-amber-300/60"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Password</span>
            <input
              type="password"
              value={fields.password}
              onChange={(event) =>
                setFields((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="At least 6 characters"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-white outline-none transition focus:border-amber-300/60"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Login Flow
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Fast access for existing users with secure cookie sessions.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Registration
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Create an account once, then continue managing tasks without setup friction.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void submitAuthForm()}
            disabled={isSubmitting}
            className="w-full rounded-full bg-amber-300 px-5 py-3 font-medium text-slate-950 transition enabled:hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
          >
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
                ? "Login to workspace"
                : "Create account and continue"}
          </button>
        </div>
      </article>
    </section>
  );
}
