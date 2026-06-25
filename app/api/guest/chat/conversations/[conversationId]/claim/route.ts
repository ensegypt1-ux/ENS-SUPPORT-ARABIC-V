import { NextResponse } from "next/server";

import { claimGuestConversation } from "@/lib/chat/guest-chat";
import { notifyStaffOfGuestConversation } from "@/lib/chat/guest-notifications";
import { getSession } from "@/lib/auth-utils";
import type { SessionUser } from "@/lib/auth";
import { emitConversationSummaryToParticipants } from "@/lib/socket/server";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "غير مصرّح" }, { status: 401 });
    }

    const role = (session.user as SessionUser).role;
    if (role !== "support" && role !== "admin") {
      return NextResponse.json({ success: false, error: "ممنوع" }, { status: 403 });
    }

    const { conversationId } = await params;
    const result = await claimGuestConversation(conversationId, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    await emitConversationSummaryToParticipants(conversationId);
    await notifyStaffOfGuestConversation(conversationId);

    return NextResponse.json({ success: true, data: { conversationId } });
  } catch (error) {
    console.error("guest chat claim error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
