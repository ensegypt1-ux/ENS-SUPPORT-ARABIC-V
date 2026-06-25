import { NextResponse } from "next/server";

import { validateGuestAccess } from "@/lib/chat/guest-chat";
import { getConversationMessagesForGuest } from "@/lib/chat/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const url = new URL(req.url);
    const guestSessionId = url.searchParams.get("guestSessionId");
    const guestAccessToken = url.searchParams.get("guestAccessToken");

    if (!guestSessionId || !guestAccessToken) {
      return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
    }

    const conversation = await validateGuestAccess({
      conversationId,
      guestSessionId,
      guestAccessToken,
    });

    if (!conversation) {
      return NextResponse.json({ error: "غير مصرّح" }, { status: 403 });
    }

    const messages =
      (await getConversationMessagesForGuest(conversationId, guestSessionId)) ||
      [];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("guest chat messages GET error:", error);
    return NextResponse.json(
      { error: "تعذّر جلب الرسائل" },
      { status: 500 }
    );
  }
}
