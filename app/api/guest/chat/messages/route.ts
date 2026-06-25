import { NextResponse } from "next/server";
import { z } from "zod";

import {
  sendGuestMessage,
  validateGuestAccess,
} from "@/lib/chat/guest-chat";
import { notifyStaffOfGuestMessage } from "@/lib/chat/guest-notifications";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const messageSchema = z.object({
  conversationId: z.string().min(1).max(100),
  guestSessionId: z.string().min(1).max(100),
  guestAccessToken: z.string().min(1).max(200),
  content: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  try {
    const ip = extractClientIp(req);
    const rate = await checkRateLimit({
      key: `guestchat:msg:${ip}`,
      limit: 120,
      windowSeconds: 3600,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: "عدد كبير من المحاولات. حاول لاحقًا." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "البيانات غير صالحة" },
        { status: 400 }
      );
    }

    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "البيانات غير صالحة" },
        { status: 400 }
      );
    }

    const conversation = await validateGuestAccess({
      conversationId: parsed.data.conversationId,
      guestSessionId: parsed.data.guestSessionId,
      guestAccessToken: parsed.data.guestAccessToken,
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "غير مصرّح" },
        { status: 403 }
      );
    }

    const result = await sendGuestMessage(parsed.data);
    if (!result.success || !result.message) {
      return NextResponse.json(
        { success: false, error: result.error || "تعذّر إرسال الرسالة" },
        { status: 400 }
      );
    }

    await notifyStaffOfGuestMessage(
      parsed.data.conversationId,
      result.message,
      conversation.guestName
    );

    return NextResponse.json({ success: true, data: result.message });
  } catch (error) {
    console.error("guest chat message error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
