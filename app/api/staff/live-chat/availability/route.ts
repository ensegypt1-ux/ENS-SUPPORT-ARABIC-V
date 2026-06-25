import { NextResponse } from "next/server";

import {
  getOwnLiveChatAvailability,
  updateOwnLiveChatAvailability,
} from "@/actions/live-chat-availability";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getOwnLiveChatAvailability();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "تعذّر قراءة حالة التوفر";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PUT(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "البيانات غير صالحة" }, { status: 400 });
    }

    const status = (body as { status?: string })?.status;
    if (status !== "available" && status !== "unavailable") {
      return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
    }

    const data = await updateOwnLiveChatAvailability(status);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "تعذّر تحديث حالة التوفر";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
