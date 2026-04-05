import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-service";
import { sendTaskProposal } from "@/lib/server/task-service";

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { notes, targetUserEmail, title } = await req.json();

  if (!targetUserEmail || !title) {
    return NextResponse.json(
      { error: "Target user email and title are required" },
      { status: 400 }
    );
  }

  try {
    const proposal = await sendTaskProposal(
      user.id,
      targetUserEmail,
      title,
      notes || ""
    );

    return NextResponse.json(proposal);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send proposal"
      },
      { status: 400 }
    );
  }
}
