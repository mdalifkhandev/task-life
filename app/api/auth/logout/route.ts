import { endCurrentSession } from "@/lib/server/auth-service";

export const runtime = "nodejs";

export async function POST() {
  await endCurrentSession();
  return Response.json({ ok: true });
}
