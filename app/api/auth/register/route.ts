import {
  AuthConflictError,
  registerUser,
  startUserSession
} from "@/lib/server/auth-service";
import { registerSchema } from "@/lib/server/auth-schemas";
import { ZodError } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    const user = await registerUser(payload);
    await startUserSession(user.id);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Invalid registration payload", issues: error.flatten() },
        { status: 400 }
      );
    }

    if (error instanceof AuthConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to register user";
    return Response.json({ error: message }, { status: 500 });
  }
}
