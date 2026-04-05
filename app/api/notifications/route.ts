import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth-service";
import { respondToProposal } from "@/lib/server/task-service";
import { connectToDatabase } from "@/lib/server/mongodb";
import { UserModel } from "@/lib/server/user-document";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const userDoc = await UserModel.findById(user.id).lean();
  return NextResponse.json(userDoc?.notifications || []);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { proposalId, action } = await req.json();
  if (!["accepted", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await respondToProposal(user.id, proposalId, action);
  return NextResponse.json({ success: true });
}
