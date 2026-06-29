import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createOrResumeGuestConversation,
  findOpenGuestConversation,
  closeGuestConversationByGuest,
  GuestProfileRequiredError,
  updateGuestProfile,
} from "@/lib/chat/guest-chat";
import { notifyStaffOfGuestConversationEnded } from "@/lib/chat/guest-notifications";
import { getSupportOnlineStatus } from "@/lib/chat/availability";
import { getOrCreateAISettings } from "@/lib/ai/settings-store";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const sessionSchema = z.object({
  guestSessionId: z.string().min(1).max(100),
  chatLogId: z.string().max(100).optional(),
  departmentSlug: z.string().max(100).optional(),
  guestName: z.string().max(200).optional(),
  guestEmail: z.string().email().max(200).optional().or(z.literal("")),
  guestPhone: z.string().max(50).optional(),
});

const patchSchema = z.object({
  guestSessionId: z.string().min(1).max(100),
  guestAccessToken: z.string().min(1).max(200),
  conversationId: z.string().min(1).max(100),
  guestName: z.string().max(200).optional(),
  guestEmail: z.string().email().max(200).optional().or(z.literal("")),
  guestPhone: z.string().max(50).optional(),
});

const endSchema = z.object({
  guestSessionId: z.string().min(1).max(100),
  guestAccessToken: z.string().min(1).max(200),
  conversationId: z.string().min(1).max(100),
});

export async function POST(req: Request) {
  try {
    const settings = await getOrCreateAISettings();
    if (!settings.features.guestLiveChat) {
      return NextResponse.json(
        { success: false, error: "المحادثة المباشرة غير مفعّلة" },
        { status: 403 }
      );
    }

    const ip = extractClientIp(req);
    const rate = await checkRateLimit({
      key: `guestchat:session:${ip}`,
      limit: 30,
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

    const parsed = sessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "البيانات غير صالحة" },
        { status: 400 }
      );
    }

    const existingConversation = await findOpenGuestConversation(
      parsed.data.guestSessionId
    );

    if (!existingConversation && !parsed.data.guestPhone?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "profile_required",
          requiresProfile: true,
        },
        { status: 400 }
      );
    }

    if (!existingConversation) {
      const supportStatus = await getSupportOnlineStatus();
      if (!supportStatus.online) {
        return NextResponse.json(
          { success: false, error: "offline", offline: true },
          { status: 503 }
        );
      }
    }

    const result = await createOrResumeGuestConversation({
      guestSessionId: parsed.data.guestSessionId,
      chatLogId: parsed.data.chatLogId,
      departmentSlug: parsed.data.departmentSlug,
      guestName: parsed.data.guestName,
      guestEmail: parsed.data.guestEmail || undefined,
      guestPhone: parsed.data.guestPhone,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof GuestProfileRequiredError) {
      return NextResponse.json(
        {
          success: false,
          error: "profile_required",
          requiresProfile: true,
        },
        { status: 400 }
      );
    }
    console.error("guest chat session error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "البيانات غير صالحة" },
        { status: 400 }
      );
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "البيانات غير صالحة" },
        { status: 400 }
      );
    }

    const ok = await updateGuestProfile(
      parsed.data.conversationId,
      parsed.data.guestSessionId,
      parsed.data.guestAccessToken,
      {
        guestName: parsed.data.guestName,
        guestEmail: parsed.data.guestEmail || undefined,
        guestPhone: parsed.data.guestPhone,
      }
    );

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "غير مصرّح" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("guest chat profile error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const settings = await getOrCreateAISettings();
    if (!settings.features.guestLiveChat) {
      return NextResponse.json(
        { success: false, error: "المحادثة المباشرة غير مفعّلة" },
        { status: 403 }
      );
    }

    const ip = extractClientIp(req);
    const rate = await checkRateLimit({
      key: `guestchat:end:${ip}`,
      limit: 30,
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

    const parsed = endSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "البيانات غير صالحة" },
        { status: 400 }
      );
    }

    const result = await closeGuestConversationByGuest(parsed.data);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "تعذّر إنهاء المحادثة" },
        { status: 403 }
      );
    }

    await notifyStaffOfGuestConversationEnded(
      parsed.data.conversationId,
      result.guestName
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("guest chat end error:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
