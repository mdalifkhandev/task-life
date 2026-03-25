import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"]
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Task Flow Board",
  description: "A focused task board with flexible insertion points."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${monoFont.variable}`}>
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pt-6 sm:px-6 lg:px-10">
          <header className="mb-6 rounded-4xl border border-white/10 bg-slate-950/45 p-4 backdrop-blur-xl">
            <nav className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
              >
                Home / Task List
              </Link>
              <Link
                href="/arrays"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
              >
                Striver Arrays Topic
              </Link>
              <Link
                href="/progress"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
              >
                Month Progress
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
