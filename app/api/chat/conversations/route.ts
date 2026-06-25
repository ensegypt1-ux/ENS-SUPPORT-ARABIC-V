import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth-utils";
import type { SessionUser } from "@/lib/auth";
import { getConversationSummariesForUser } from "@/lib/chat/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const archivedOnly = searchParams.get("archived") === "1";

    const role = ((session.user as SessionUser).role || "customer") as
      | "customer"
      | "support"
      | "admin";
    const conversations = await getConversationSummariesForUser(
      session.user.id,
      role,
      { archivedOnly }
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("تعذّر جلب المحادثات:", error);
    return NextResponse.json(
      { error: "تعذّر جلب المحادثات" },
      { status: 500 }
    );
  }
}
