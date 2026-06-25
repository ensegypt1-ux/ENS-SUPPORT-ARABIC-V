import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth-utils";
import type { SessionUser } from "@/lib/auth";
import { getConversationMessagesForUser } from "@/lib/chat/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: {
    params:
      | Promise<{
          conversationId: string;
        }>
      | {
          conversationId: string;
        };
  }
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;
    const role = ((session.user as SessionUser).role || "customer") as
      | "customer"
      | "support"
      | "admin";
    const messages = await getConversationMessagesForUser(
      conversationId,
      session.user.id,
      role
    );

    if (!messages) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch conversation messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation messages" },
      { status: 500 }
    );
  }
}
