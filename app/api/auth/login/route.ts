import {
  AuthInvalidCredentialsError,
  authenticateUser,
  startUserSession
} from "@/lib/server/auth-service";
import { loginSchema } from "@/lib/server/auth-schemas";
import { ZodError } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const user = await authenticateUser(payload);
    await startUserSession(user.id);
    return Response.json({ user });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Invalid login payload", issues: error.flatten() },
        { status: 400 }
      );
    }

    if (error instanceof AuthInvalidCredentialsError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to sign in";
    return Response.json({ error: message }, { status: 500 });
  }
}
