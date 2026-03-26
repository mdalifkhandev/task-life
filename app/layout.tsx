import { TopNav } from "@/components/top-nav";
import { getCurrentUser } from "@/lib/server/auth-service";
import type { Metadata } from "next";
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
  title: "Task Life",
  description: "A redesigned DSA task workspace with focused pages and better editing UX."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${headingFont.variable} ${monoFont.variable}`}>
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pt-6 sm:px-6 lg:px-10">
          <TopNav user={user} />
          {children}
        </div>
      </body>
    </html>
  );
}
