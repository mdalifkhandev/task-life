import { AuthPanel } from "@/components/auth-panel";
import { getCurrentUser } from "@/lib/server/auth-service";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <AuthPanel />
      </div>
    </main>
  );
}
